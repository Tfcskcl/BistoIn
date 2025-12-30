
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, Zap, Key, ShieldCheck } from 'lucide-react';
import { getChatResponse, hasValidApiKey, openNeuralGateway } from '../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isAiActive, setIsAiActive] = useState(hasValidApiKey());
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initialization Flow logic
    useEffect(() => {
        const active = hasValidApiKey();
        setIsAiActive(active);
        
        if (active) {
            setMessages([
                { id: '1', role: 'assistant', text: 'Neural Link Established. I am Gemini AI, initialized inside BistroConnect Intelligence. How shall we optimize your operations today?' }
            ]);
        } else {
            setMessages([
                { id: '1', role: 'assistant', text: 'Initializing BistroConnect Intelligence... Before proceeding, a valid Google Gemini API key is required. This powers the high-fidelity Vision AI, dynamic costing engine, and strategic reasoning modules. Please establish a secure link via the button below.' }
            ]);
        }
    }, [isAiActive]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
        
        // Polling for key injection from platform
        const interval = setInterval(() => {
            const active = hasValidApiKey();
            if (active && !isAiActive) setIsAiActive(true);
        }, 3000);
        
        return () => clearInterval(interval);
    }, [messages, isOpen, isAiActive]);

    const handleSend = async () => {
        if (!input.trim() || !isAiActive) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            const responseText = await getChatResponse(history, input);
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: `Handshake Failed: ${error.message}` };
            setMessages(prev => [...prev, errorMsg]);
            
            // If the error indicates a bad key, reset active state to prompt re-selection
            if (error.message.includes("NEURAL_SESSION_RESET")) {
                setIsAiActive(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConnectInChat = async () => {
        const success = await openNeuralGateway();
        if (success) {
            // MANDATORY: Assume success immediately after triggering openSelectKey
            setIsAiActive(true);
            setMessages(prev => [
                ...prev, 
                { id: Date.now().toString(), role: 'assistant', text: 'Nexus Gateway Handshake triggered. Assuming secure link... Connecting modules...' }
            ]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-scale-in origin-bottom-right transition-colors duration-200">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 uppercase tracking-tighter">Bistro AI <span className={`w-1.5 h-1.5 rounded-full ${isAiActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span></h3>
                                <span className="text-[10px] text-indigo-100 opacity-80 uppercase tracking-widest font-black">Node 04 // Live</span>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none leading-relaxed'
                                }`}>
                                    {msg.text}
                                    {!isAiActive && msg.id === '1' && (
                                        <button 
                                            onClick={handleConnectInChat}
                                            className="mt-4 w-full py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-md"
                                        >
                                            <Zap size={14} className="fill-current"/> Initialize Neural Link
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        {isAiActive ? (
                            <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Optimize layout, analyze SOPs..."
                                    className="flex-1 px-3 py-2 bg-transparent border-none text-sm focus:ring-0 outline-none text-slate-800 dark:text-white placeholder-slate-400"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-2">
                                    <ShieldCheck size={12}/> Handshake Required to Proceed
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button 
                onClick={toggleChat}
                className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 ${isAiActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-600 border-red-500 text-white animate-pulse'}`}
            >
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <>
                        {isAiActive ? <MessageCircle size={28} /> : <Zap size={28} className="fill-current" />}
                        {!isAiActive && (
                             <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white flex items-center justify-center text-[8px] font-black">!</span>
                             </span>
                        )}
                    </>
                )}
            </button>
        </div>
    );
};
