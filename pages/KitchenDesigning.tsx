
import React, { useState, useEffect, useRef } from 'react';
import { User, KitchenDesign, KitchenDesignRequest, UserRole, DesignElement, AppView } from '../types';
import { storageService, storageEvents } from '../services/storageService';
import { generateKitchenDesign, optimizeKitchenDesign, hasValidApiKey, openNeuralGateway } from '../services/geminiService';
import { PenTool, Download, Plus, Loader2, Sparkles, AlertCircle, Trash2, ArrowLeft, Ruler, Printer, FileText, Settings2, Info, Move, Zap, Droplets, Flame, ShieldAlert, CheckCircle2, Save, Square, XCircle, Brain } from 'lucide-react';

interface KitchenDesigningProps {
    user: User;
}

const BlueprintRenderer: React.FC<{ 
    design: KitchenDesign, 
    editMode: boolean, 
    onUpdateElement: (index: number, updates: Partial<DesignElement>) => void,
    onSelectElement: (index: number | null) => void,
    selectedIdx: number | null,
    id?: string
}> = ({ design, editMode, onUpdateElement, onSelectElement, selectedIdx, id = "kitchen-svg" }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<{ index: number, startX: number, startY: number } | null>(null);

    const CANVAS_W = 1000;
    const CANVAS_H = 800;
    const LINE_COLOR = '#00ffff'; 
    const TEXT_COLOR = '#ffffff';

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        
        if ('clientX' in e) {
            pt.x = e.clientX;
            pt.y = e.clientY;
        } else {
            pt.x = (e as React.TouchEvent).touches[0].clientX;
            pt.y = (e as React.TouchEvent).touches[0].clientY;
        }
        
        const loc = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        return { x: loc.x, y: loc.y };
    };

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        if (!editMode) return;
        e.stopPropagation();
        onSelectElement(index);
        const { x, y } = getCoords(e);
        const el = design.elements[index];
        const currentX = (el.x / 100 * (CANVAS_W - 100) + 50);
        const currentY = (el.y / 100 * (CANVAS_H - 150) + 70);
        setDragging({ index, startX: x - currentX, startY: y - currentY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !editMode) return;
        const { x, y } = getCoords(e);
        
        let newX = ((x - dragging.startX - 50) / (CANVAS_W - 100)) * 100;
        let newY = ((y - dragging.startY - 70) / (CANVAS_H - 150)) * 100;

        const el = design.elements[dragging.index];
        newX = Math.max(0, Math.min(100 - el.w, newX));
        newY = Math.max(0, Math.min(100 - el.h, newY));

        onUpdateElement(dragging.index, { x: newX, y: newY });
    };

    const handleMouseUp = () => setDragging(null);

    const renderElement = (el: DesignElement, i: number) => {
        const rectW = (el.w / 100) * (CANVAS_W - 100);
        const rectH = (el.h / 100) * (CANVAS_H - 150);
        const rectX = (el.x / 100) * (CANVAS_W - 100) + 50;
        const rectY = (el.y / 100) * (CANVAS_H - 150) + 70;
        const isSelected = selectedIdx === i;

        return (
            <g 
                key={i} 
                onMouseDown={(e) => handleMouseDown(e, i)}
                className={`transition-all ${editMode ? 'cursor-move' : ''}`}
            >
                {el.type === 'door' ? (
                    <g>
                        <rect x={rectX} y={rectY} width={rectW} height={rectH} fill="none" stroke={isSelected ? "#fff" : LINE_COLOR} strokeWidth="2" strokeDasharray="5,5" />
                        <path d={`M ${rectX} ${rectY + rectH} Q ${rectX + rectW} ${rectY + rectH} ${rectX + rectW} ${rectY}`} fill="none" stroke={LINE_COLOR} strokeWidth="1" opacity="0.5" />
                        <line x1={rectX} y1={rectY} x2={rectX} y2={rectY + rectH} stroke={isSelected ? "#fff" : LINE_COLOR} strokeWidth="4" />
                    </g>
                ) : el.type === 'window' ? (
                    <g>
                        <rect x={rectX} y={rectY} width={rectW} height={rectH} fill="rgba(0, 255, 255, 0.1)" stroke={isSelected ? "#fff" : LINE_COLOR} strokeWidth="2" />
                        <line x1={rectX} y1={rectY + rectH/2} x2={rectX + rectW} y2={rectY + rectH/2} stroke={LINE_COLOR} strokeWidth="1" />
                    </g>
                ) : (
                    <rect 
                        x={rectX} 
                        y={rectY} 
                        width={rectW} 
                        height={rectH} 
                        fill={isSelected ? 'rgba(0, 255, 255, 0.15)' : 'rgba(0, 255, 255, 0.05)'} 
                        stroke={isSelected ? '#ffffff' : LINE_COLOR} 
                        strokeWidth={isSelected ? "4" : "2"}
                        className={isSelected ? 'animate-pulse' : ''}
                    />
                )}

                {el.utility_req?.power && <circle cx={rectX + 10} cy={rectY + 10} r="4" fill="#fbbf24" />}
                {el.utility_req?.water && <circle cx={rectX + 22} cy={rectY + 10} r="4" fill="#60a5fa" />}
                {el.utility_req?.gas && <circle cx={rectX + 34} cy={rectY + 10} r="4" fill="#ef4444" />}

                <text x={rectX + rectW/2} y={rectY + rectH/2 + 5} fill={isSelected ? '#ffffff' : TEXT_COLOR} textAnchor="middle" fontSize="12" fontWeight="black" style={{ pointerEvents: 'none' }}>{el.label.toUpperCase()}</text>
                <g style={{ pointerEvents: 'none' }}>
                    <text x={rectX + rectW/2} y={rectY - 8} fill={isSelected ? "#fff" : LINE_COLOR} textAnchor="middle" fontSize="10" opacity={isSelected ? 1 : 0.6}>{el.length_ft}'</text>
                    <text x={rectX + rectW + 12} y={rectY + rectH/2} fill={isSelected ? "#fff" : LINE_COLOR} textAnchor="start" fontSize="10" transform={`rotate(90, ${rectX + rectW + 12}, ${rectY + rectH/2})`} opacity={isSelected ? 1 : 0.6}>{el.width_ft}'</text>
                </g>
            </g>
        );
    };

    return (
        <div className="relative w-full h-full bg-[#001a21] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 font-mono">
            <svg id={id} ref={svgRef} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className={`w-full h-full select-none ${editMode ? 'cursor-crosshair' : 'cursor-default'}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={() => onSelectElement(null)} xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 255, 0.05)" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect x="50" y="70" width={CANVAS_W - 100} height={CANVAS_H - 150} fill="none" stroke={LINE_COLOR} strokeWidth="4" />
                <text x={CANVAS_W/2} y="50" fill={LINE_COLOR} textAnchor="middle" fontSize="18" fontWeight="black" className="uppercase tracking-[0.3em]">{design.title}</text>
                {design.elements.map((el, i) => renderElement(el, i))}
                <g transform={`translate(${CANVAS_W - 320}, ${CANVAS_H - 120})`}><rect width="300" height="100" fill="#001a21" stroke={LINE_COLOR} strokeWidth="2" /><text x="10" y="25" fill={LINE_COLOR} fontSize="12" fontWeight="bold">PROJECT: NEURAL_DESIGN_NODE_04</text><text x="10" y="50" fill={LINE_COLOR} fontSize="10">AUTH: BistroConnect Architect v2.5</text></g>
            </svg>
        </div>
    );
};

export const KitchenDesigning: React.FC<KitchenDesigningProps> = ({ user }) => {
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [designs, setDesigns] = useState<KitchenDesignRequest[]>([]);
    const [selectedDesign, setSelectedDesign] = useState<KitchenDesignRequest | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const [formData, setFormData] = useState({ title: '', length: 20, width: 15, cuisine: user.cuisineType || '', reqs: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = () => setDesigns(storageService.getKitchenDesigns(user.id));
        load();
        window.addEventListener(storageEvents.DATA_UPDATED, load);
        return () => window.removeEventListener(storageEvents.DATA_UPDATED, load);
    }, [user.id]);

    const handleCreateDesign = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await generateKitchenDesign(formData.title, formData.length, formData.width, formData.cuisine, formData.reqs);
            const newReq: KitchenDesignRequest = {
                id: `design_${Date.now()}`,
                userId: user.id,
                userName: user.name,
                title: formData.title,
                length: formData.length,
                width: formData.width,
                cuisineType: formData.cuisine,
                specialRequirements: formData.reqs,
                status: 'approved',
                requestDate: new Date().toISOString(),
                designData: { ...result, dimensions: { length: formData.length, width: formData.width, unit: 'ft' } }
            };
            storageService.saveKitchenDesign(user.id, newReq);
            setSelectedDesign(newReq);
            setView('detail');
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const handleOptimize = async () => {
        if (!selectedDesign?.designData || isOptimizing) return;
        
        if (!hasValidApiKey()) {
            await openNeuralGateway();
            return;
        }

        setIsOptimizing(true);
        try {
            const optimizedElements = await optimizeKitchenDesign(selectedDesign.designData);
            if (optimizedElements && optimizedElements.length > 0) {
                const updated = {
                    ...selectedDesign,
                    designData: { ...selectedDesign.designData, elements: optimizedElements }
                };
                setSelectedDesign(updated);
                storageService.saveKitchenDesign(user.id, updated);
                alert("Neural Optimizer: Layout successfully rearranged for peak efficiency.");
            }
        } catch (err: any) {
            alert(`Optimization Failed: ${err.message}`);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAddElement = (type: DesignElement['type'], equipment_type?: DesignElement['equipment_type']) => {
        if (!selectedDesign?.designData) return;
        const length_ft = 3; const width_ft = 2;
        const kitchenDim = selectedDesign.designData.dimensions;
        const newEl: DesignElement = {
            type, equipment_type, label: equipment_type || type,
            x: 40, y: 40, w: (length_ft / kitchenDim.length) * 100, h: (width_ft / kitchenDim.width) * 100,
            length_ft, width_ft, utility_req: {}
        };
        const updated = { ...selectedDesign, designData: { ...selectedDesign.designData, elements: [...selectedDesign.designData.elements, newEl] } };
        setSelectedDesign(updated);
        setSelectedIdx(updated.designData.elements.length - 1);
    };

    const handleUpdateElement = (index: number, updates: Partial<DesignElement>) => {
        if (!selectedDesign?.designData) return;
        const newElements = [...selectedDesign.designData.elements];
        newElements[index] = { ...newElements[index], ...updates };
        setSelectedDesign({ ...selectedDesign, designData: { ...selectedDesign.designData, elements: newElements } });
    };

    const handleSaveLayout = () => {
        if (!selectedDesign) return;
        storageService.saveKitchenDesign(user.id, selectedDesign);
        setEditMode(false);
        alert("Blueprint committed to storage.");
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><PenTool size={24}/></div>
                    <div><h1 className="font-bold text-lg dark:text-white uppercase tracking-tighter">Kitchen Designer Node</h1><p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">// NEURAL_CAD_WORKSPACE</p></div>
                </div>
                <div className="flex gap-3">
                    {view === 'detail' && (
                        <>
                            <button onClick={handleOptimize} disabled={isOptimizing} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg disabled:opacity-50">
                                {isOptimizing ? <Loader2 size={14} className="animate-spin"/> : <Brain size={14}/>} {isOptimizing ? 'OPTIMIZING...' : 'AI_OPTIMIZE_WORKFLOW'}
                            </button>
                            <button onClick={() => { setEditMode(!editMode); setSelectedIdx(null); }} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${editMode ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                                <Move size={14}/> {editMode ? 'EXIT_EDITOR' : 'MANUAL_EDIT'}
                            </button>
                            {editMode && <button onClick={handleSaveLayout} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700"><Save size={14}/> COMMIT</button>}
                        </>
                    )}
                    <button onClick={() => setView('create')} className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 shadow-lg"><Plus size={16}/> New Project</button>
                </div>
            </div>

            {view === 'list' && (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8">Design Vault</h2>
                    {designs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30"><Ruler size={64} className="mb-4" /><p className="text-sm font-bold uppercase tracking-widest">No active blueprints</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {designs.map(d => (
                                <div key={d.id} className="group glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer relative" onClick={() => { setSelectedDesign(d); setView('detail'); }}>
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 mb-4"><FileText size={24}/></div>
                                    <h4 className="font-black dark:text-white uppercase tracking-tight text-lg">{d.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">{d.length}' x {d.width}' // {d.cuisineType}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'detail' && selectedDesign?.designData && (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 px-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-[10px] font-black uppercase"><ArrowLeft size={16}/> RETURN</button>
                            <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded text-[10px] font-mono border border-indigo-500/20">LAYER: WORKFLOW_OPTIMIZED</span>
                        </div>
                        {editMode && (
                            <div className="flex gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                                <button onClick={() => handleAddElement('equipment', 'range')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Range</button>
                                <button onClick={() => handleAddElement('equipment', 'fridge')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Fridge</button>
                                <button onClick={() => handleAddElement('equipment', 'table')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Table</button>
                                <button onClick={() => handleAddElement('door')} className="px-3 py-1.5 bg-indigo-900/40 text-indigo-400 text-[10px] font-black rounded border border-indigo-500/30 uppercase flex items-center gap-1 hover:bg-indigo-800 whitespace-nowrap"><Plus size={10}/> Door</button>
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <BlueprintRenderer design={selectedDesign.designData} editMode={editMode} selectedIdx={selectedIdx} onSelectElement={setSelectedIdx} onUpdateElement={handleUpdateElement} />
                        </div>
                    </div>
                    <div className="w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-2xl">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Settings2 size={16}/> Specifications</h3>
                         {selectedIdx !== null ? (
                             <div className="space-y-4">
                                 <input value={selectedDesign.designData.elements[selectedIdx].label} onChange={e => handleUpdateElement(selectedIdx, { label: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                 <button onClick={() => { const els = [...selectedDesign.designData!.elements]; els.splice(selectedIdx, 1); setSelectedDesign({...selectedDesign, designData: {...selectedDesign.designData!, elements: els}}); setSelectedIdx(null); }} className="w-full py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-lg">Delete Element</button>
                             </div>
                         ) : (
                             <div className="flex-1 flex items-center justify-center opacity-30 text-center"><p className="text-xs font-black uppercase tracking-widest">Select element or use AI Optimizer above</p></div>
                         )}
                         <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800"><button onClick={() => alert('PDF Blueprint Generated')} className="w-full py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Printer size={16}/> EXPORT_CAD_SPEC</button></div>
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div className="max-w-xl mx-auto w-full glass bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-900 mb-8 flex items-center gap-2 text-xs font-bold uppercase"><ArrowLeft size={16}/> Back</button>
                    <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-8 text-center">Initialize Design Node</h2>
                    <form onSubmit={handleCreateDesign} className="space-y-6">
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="Project Title" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" required value={formData.length} onChange={e => setFormData({...formData, length: Number(e.target.value)})} className="w-full p-3 border rounded-xl" placeholder="Length (ft)" />
                            <input type="number" required value={formData.width} onChange={e => setFormData({...formData, width: Number(e.target.value)})} className="w-full p-3 border rounded-xl" placeholder="Width (ft)" />
                        </div>
                        <textarea rows={3} value={formData.reqs} onChange={e => setFormData({...formData, reqs: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-slate-800" placeholder="Special Directives..." />
                        <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] text-xs">
                            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Execute Synthesis
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
