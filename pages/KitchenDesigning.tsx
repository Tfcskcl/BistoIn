
import React, { useState, useEffect, useRef } from 'react';
import { User, KitchenDesign, KitchenDesignRequest, UserRole, DesignElement } from '../types';
import { storageService, storageEvents } from '../services/storageService';
import { generateKitchenDesign } from '../services/geminiService';
import { PenTool, Download, Plus, Loader2, Sparkles, AlertCircle, Trash2, ArrowLeft, Ruler, Printer, FileText, Settings2, Info, Move, Zap, Droplets, Flame, ShieldAlert, CheckCircle2, Save, Square, XCircle } from 'lucide-react';

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
                {/* Element Representation based on Type */}
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

                {/* Utility Indicators */}
                {el.utility_req?.power && (
                    <circle cx={rectX + 10} cy={rectY + 10} r="4" fill="#fbbf24" />
                )}
                {el.utility_req?.water && (
                    <circle cx={rectX + 22} cy={rectY + 10} r="4" fill="#60a5fa" />
                )}
                {el.utility_req?.gas && (
                    <circle cx={rectX + 34} cy={rectY + 10} r="4" fill="#ef4444" />
                )}

                <text 
                    x={rectX + rectW/2} 
                    y={rectY + rectH/2 + 5} 
                    fill={isSelected ? '#ffffff' : TEXT_COLOR} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="black"
                    style={{ pointerEvents: 'none' }}
                >
                    {el.label.toUpperCase()}
                </text>
                
                {/* Ruler Labels */}
                <g style={{ pointerEvents: 'none' }}>
                    <text x={rectX + rectW/2} y={rectY - 8} fill={isSelected ? "#fff" : LINE_COLOR} textAnchor="middle" fontSize="10" opacity={isSelected ? 1 : 0.6}>{el.length_ft}'</text>
                    <text x={rectX + rectW + 12} y={rectY + rectH/2} fill={isSelected ? "#fff" : LINE_COLOR} textAnchor="start" fontSize="10" transform={`rotate(90, ${rectX + rectW + 12}, ${rectY + rectH/2})`} opacity={isSelected ? 1 : 0.6}>{el.width_ft}'</text>
                </g>
            </g>
        );
    };

    return (
        <div className="relative w-full h-full bg-[#001a21] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 font-mono">
            <div className="absolute top-6 left-6 z-10 flex gap-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-cyan-500/30">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Scale: 1:${(design.dimensions.length / 10).toFixed(1)}</p>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-cyan-500/30">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Unit: {design.dimensions.unit.toUpperCase()}</p>
                </div>
            </div>

            <svg 
                id={id}
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} 
                className={`w-full h-full select-none ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => onSelectElement(null)}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 255, 0.05)" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect x="25" y="25" width={CANVAS_W - 50} height={CANVAS_H - 50} fill="none" stroke={LINE_COLOR} strokeWidth="1" strokeDasharray="10,10" opacity="0.3" />
                <rect x="50" y="70" width={CANVAS_W - 100} height={CANVAS_H - 150} fill="none" stroke={LINE_COLOR} strokeWidth="4" />
                <text x={CANVAS_W/2} y="50" fill={LINE_COLOR} textAnchor="middle" fontSize="18" fontWeight="black" className="uppercase tracking-[0.3em]">
                    {design.title} — {design.dimensions.length}{design.dimensions.unit} x {design.dimensions.width}{design.dimensions.unit}
                </text>

                {design.elements.map((el, i) => renderElement(el, i))}

                <g transform={`translate(${CANVAS_W - 320}, ${CANVAS_H - 120})`}>
                    <rect width="300" height="100" fill="#001a21" stroke={LINE_COLOR} strokeWidth="2" />
                    <text x="10" y="25" fill={LINE_COLOR} fontSize="12" fontWeight="bold">PROJECT: NEURAL_DESIGN_NODE_04</text>
                    <text x="10" y="50" fill={LINE_COLOR} fontSize="10">AUTH: BistroConnect Architect v2.5</text>
                    <text x="10" y="75" fill={LINE_COLOR} fontSize="10">TIMESTAMP: {new Date().toISOString().split('T')[0]}</text>
                </g>
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

    const [formData, setFormData] = useState({
        title: '',
        length: 20,
        width: 15,
        cuisine: user.cuisineType || '',
        reqs: ''
    });
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
            
            const finalDesign: KitchenDesign = {
                ...result,
                id: result.id || `plan_${Date.now()}`,
                title: result.title || formData.title,
                dimensions: result.dimensions || { length: formData.length, width: formData.width, unit: 'ft' }
            };

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
                designData: finalDesign
            };

            storageService.saveKitchenDesign(user.id, newReq);
            setSelectedDesign(newReq);
            setView('detail');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate technical blueprint.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddElement = (type: DesignElement['type'], equipment_type?: DesignElement['equipment_type']) => {
        if (!selectedDesign?.designData) return;
        
        const length_ft = type === 'door' ? 3 : type === 'window' ? 4 : 2;
        const width_ft = type === 'door' ? 1 : type === 'window' ? 1 : 2;
        const kitchenDim = selectedDesign.designData.dimensions;

        const newEl: DesignElement = {
            type,
            equipment_type,
            label: equipment_type ? equipment_type.charAt(0).toUpperCase() + equipment_type.slice(1) : type.charAt(0).toUpperCase() + type.slice(1),
            x: 40,
            y: 40,
            w: (length_ft / kitchenDim.length) * 100,
            h: (width_ft / kitchenDim.width) * 100,
            length_ft,
            width_ft,
            utility_req: {}
        };

        const newElements = [...selectedDesign.designData.elements, newEl];
        const updatedDesign = {
            ...selectedDesign,
            designData: { ...selectedDesign.designData, elements: newElements }
        };
        setSelectedDesign(updatedDesign);
        setSelectedIdx(newElements.length - 1);
    };

    const handleUpdateElement = (index: number, updates: Partial<DesignElement>) => {
        if (!selectedDesign?.designData) return;
        const newElements = [...selectedDesign.designData.elements];
        newElements[index] = { ...newElements[index], ...updates };
        
        const updatedDesign = {
            ...selectedDesign,
            designData: {
                ...selectedDesign.designData,
                elements: newElements
            }
        };
        setSelectedDesign(updatedDesign);
    };

    const handleUpdateSize = (index: number, dimension: 'length_ft' | 'width_ft', value: number) => {
        if (!selectedDesign?.designData) return;
        const kitchenDim = selectedDesign.designData.dimensions;
        const updates: Partial<DesignElement> = { [dimension]: value };
        if (dimension === 'length_ft') {
            updates.w = (value / kitchenDim.length) * 100;
        } else {
            updates.h = (value / kitchenDim.width) * 100;
        }
        handleUpdateElement(index, updates);
    };

    const handleDeleteElement = (index: number) => {
        if (!selectedDesign?.designData) return;
        const newElements = selectedDesign.designData.elements.filter((_, i) => i !== index);
        const updatedDesign = {
            ...selectedDesign,
            designData: { ...selectedDesign.designData, elements: newElements }
        };
        setSelectedDesign(updatedDesign);
        setSelectedIdx(null);
    };

    const handleSaveLayout = () => {
        if (!selectedDesign) return;
        storageService.saveKitchenDesign(user.id, selectedDesign);
        setEditMode(false);
        alert("Layout configurations committed to storage.");
    };

    const handleExportSpec = () => {
        if (!selectedDesign?.designData) return;
        const design = selectedDesign.designData;
        const svgElement = document.getElementById('kitchen-svg-export');
        if (!svgElement) return;

        const win = window.open('', '_blank');
        if (!win) return;

        const date = new Date().toLocaleDateString();

        win.document.write(`
            <html>
                <head>
                    <title>Technical Kitchen Specification - ${design.title}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
                        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; color: #000; }
                        @page { margin: 15mm; size: A4; }
                        .mono { font-family: 'JetBrains Mono', monospace; }
                        .cad-box { border: 2px solid #000; padding: 16px; margin-bottom: 24px; background: #f8fafc; }
                    </style>
                </head>
                <body class="p-8">
                    <div class="max-w-4xl mx-auto">
                        <div class="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
                            <div>
                                <h1 class="text-4xl font-black uppercase tracking-tighter">Kitchen Layout Specification</h1>
                                <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Ref: BC_CAD_NODE_04 // V2.5</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Authenticated Blueprint</p>
                                <p class="text-xl font-bold">${user.restaurantName}</p>
                                <p class="text-[10px] text-slate-400 font-mono">${date}</p>
                            </div>
                        </div>

                        <div class="cad-box">
                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">I. Top-View Schematic</h3>
                            <div class="bg-[#001a21] p-4 rounded-lg overflow-hidden flex items-center justify-center">
                                ${svgElement.outerHTML}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1 border-black">II. Project Parameters</h3>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between border-b border-slate-100 pb-1"><span>Workspace Dimensions:</span><span class="font-bold">${design.dimensions.length}${design.dimensions.unit} x ${design.dimensions.width}${design.dimensions.unit}</span></div>
                                    <div class="flex justify-between border-b border-slate-100 pb-1"><span>Operational Logic:</span><span class="font-bold">${selectedDesign.cuisineType}</span></div>
                                    <div class="flex justify-between border-b border-slate-100 pb-1"><span>Total Unit Count:</span><span class="font-bold">${design.elements.length}</span></div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1 border-black">III. Operational Summary</h3>
                                <p class="text-xs italic leading-relaxed text-slate-700">"${design.summary}"</p>
                            </div>
                        </div>

                        <div class="mb-8">
                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 pb-1 border-black">IV. Schedule of Elements (Equip/Doors/Windows)</h3>
                            <table class="w-full text-left text-[10px] border-collapse">
                                <thead>
                                    <tr class="bg-slate-900 text-white uppercase tracking-wider font-bold">
                                        <th class="p-2 border border-slate-300">ID</th>
                                        <th class="p-2 border border-slate-300">Descriptor</th>
                                        <th class="p-2 border border-slate-300">Type</th>
                                        <th class="p-2 border border-slate-300 text-center">Dimensions (LxW)</th>
                                        <th class="p-2 border border-slate-300">Utility Req</th>
                                        <th class="p-2 border border-slate-300">Technical Specs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${design.elements.map((el, i) => `
                                        <tr>
                                            <td class="p-2 border border-slate-200 font-bold">${i}</td>
                                            <td class="p-2 border border-slate-200 font-bold uppercase">${el.label}</td>
                                            <td class="p-2 border border-slate-200 uppercase">${el.equipment_type || el.type}</td>
                                            <td class="p-2 border border-slate-200 text-center">${el.length_ft}' x ${el.width_ft}'</td>
                                            <td class="p-2 border border-slate-200">
                                                <div class="flex flex-wrap gap-1">
                                                    ${el.utility_req?.power ? '<span class="bg-amber-100 text-amber-700 px-1 rounded font-bold">PWR</span>' : ''}
                                                    ${el.utility_req?.water ? '<span class="bg-blue-100 text-blue-700 px-1 rounded font-bold">WTR</span>' : ''}
                                                    ${el.utility_req?.gas ? '<span class="bg-red-100 text-red-700 px-1 rounded font-bold">GAS</span>' : ''}
                                                </div>
                                            </td>
                                            <td class="p-2 border border-slate-200 italic">${el.specifications || 'Standard spec'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="pt-8 border-t-2 border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex justify-between">
                            <div>Source Node: BistroConnect Intelligence v2.5</div>
                            <div>© TFCS KITCHEN SOLUTIONS LTD.</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => {
            win.focus();
            win.print();
            win.close();
        }, 1500);
    };

    const selectedElement = selectedIdx !== null ? selectedDesign?.designData?.elements[selectedIdx] : null;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            <div className="hidden">
                 {selectedDesign?.designData && (
                     <BlueprintRenderer 
                        design={selectedDesign.designData} 
                        editMode={false} 
                        selectedIdx={null} 
                        onSelectElement={() => {}} 
                        onUpdateElement={() => {}}
                        id="kitchen-svg-export"
                     />
                 )}
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><PenTool size={24}/></div>
                    <div>
                        <h1 className="font-bold text-lg dark:text-white uppercase tracking-tighter">Kitchen Designer Node</h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">// NEURAL_CAD_WORKSPACE // NODE_04</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {view === 'detail' && (
                        <>
                            <button 
                                onClick={() => { setEditMode(!editMode); setSelectedIdx(null); }} 
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${editMode ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                            >
                                <Move size={14}/> {editMode ? 'EXIT_EDITOR' : 'EDIT_LAYOUT'}
                            </button>
                            {editMode && (
                                <button 
                                    onClick={handleSaveLayout}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700"
                                >
                                    <Save size={14}/> COMMIT_CHANGES
                                </button>
                            )}
                        </>
                    )}
                    <button 
                        onClick={() => setView('create')} 
                        className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 shadow-lg transition-all"
                    >
                        <Plus size={16}/> New Project
                    </button>
                </div>
            </div>

            {view === 'list' && (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8">Design Vault</h2>
                    {designs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <Ruler size={64} className="mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">No active blueprints</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {designs.map(d => (
                                <div key={d.id} className="group glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer relative flex flex-col justify-between" onClick={() => { setSelectedDesign(d); setView('detail'); }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner"><FileText size={24}/></div>
                                        <button onClick={(e) => { e.stopPropagation(); storageService.deleteKitchenDesign(user.id, d.id); }} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                    </div>
                                    <div>
                                        <h4 className="font-black dark:text-white uppercase tracking-tight text-lg">{d.title}</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">{d.length}' x {d.width}' // {d.cuisineType}</p>
                                    </div>
                                    <div className="mt-6 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <span>CREATED {new Date(d.requestDate).toLocaleDateString()}</span>
                                        <span className="text-indigo-500">OPEN BLUEPRINT</span>
                                    </div>
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
                            <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-[10px] font-black uppercase transition-colors"><ArrowLeft size={16}/> RETURN_TO_VAULT</button>
                            <div className="flex gap-2">
                                <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded text-[10px] font-mono border border-indigo-500/20">LAYER: EQUIPMENT_LOCATIONS</span>
                            </div>
                        </div>

                        {editMode && (
                            <div className="flex gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
                                <button onClick={() => handleAddElement('equipment', 'range')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Add Range</button>
                                <button onClick={() => handleAddElement('equipment', 'fridge')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Add Fridge</button>
                                <button onClick={() => handleAddElement('equipment', 'sink')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Add Sink</button>
                                <button onClick={() => handleAddElement('equipment', 'table')} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 hover:bg-slate-700 whitespace-nowrap"><Plus size={10}/> Add Table</button>
                                <button onClick={() => handleAddElement('door')} className="px-3 py-1.5 bg-indigo-900/40 text-indigo-400 text-[10px] font-black rounded border border-indigo-500/30 uppercase flex items-center gap-1 hover:bg-indigo-800 whitespace-nowrap"><Plus size={10}/> Add Door</button>
                                <button onClick={() => handleAddElement('window')} className="px-3 py-1.5 bg-indigo-900/40 text-indigo-400 text-[10px] font-black rounded border border-indigo-500/30 uppercase flex items-center gap-1 hover:bg-indigo-800 whitespace-nowrap"><Plus size={10}/> Add Pickup Window</button>
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden">
                            <BlueprintRenderer 
                                design={selectedDesign.designData} 
                                editMode={editMode}
                                selectedIdx={selectedIdx}
                                onSelectElement={setSelectedIdx}
                                onUpdateElement={handleUpdateElement}
                                id="kitchen-svg"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-96 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <h3 className="text-xs font-black dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <Settings2 size={16} className="text-indigo-500"/> {selectedElement ? 'ELEMENT_SPEC' : 'WORKSPACE_META'}
                                </h3>
                                {selectedElement && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDeleteElement(selectedIdx!)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle size={16}/></button>
                                        <span className="text-[10px] font-mono text-emerald-500">ID: {selectedIdx}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {selectedElement ? (
                                    <>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor</label>
                                                <input 
                                                    value={selectedElement.label} 
                                                    onChange={e => handleUpdateElement(selectedIdx!, { label: e.target.value })}
                                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                                                    <select 
                                                        value={selectedElement.type} 
                                                        onChange={e => handleUpdateElement(selectedIdx!, { type: e.target.value as any })}
                                                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                                    >
                                                        <option value="equipment">Equipment</option>
                                                        <option value="door">Door</option>
                                                        <option value="window">Pickup Window</option>
                                                        <option value="wall">Wall</option>
                                                        <option value="zone">Zone</option>
                                                    </select>
                                                </div>
                                                {selectedElement.type === 'equipment' && (
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Type</label>
                                                        <select 
                                                            value={selectedElement.equipment_type} 
                                                            onChange={e => handleUpdateElement(selectedIdx!, { equipment_type: e.target.value as any })}
                                                            className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                                        >
                                                            <option value="range">Range</option>
                                                            <option value="oven">Oven</option>
                                                            <option value="fryer">Fryer</option>
                                                            <option value="sink">Sink</option>
                                                            <option value="table">Table</option>
                                                            <option value="fridge">Fridge</option>
                                                            <option value="dishwasher">Dishwasher</option>
                                                            <option value="storage">Storage</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Length (FT)</label>
                                                    <input 
                                                        type="number"
                                                        value={selectedElement.length_ft} 
                                                        onChange={e => handleUpdateSize(selectedIdx!, 'length_ft', Number(e.target.value))}
                                                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Width (FT)</label>
                                                    <input 
                                                        type="number"
                                                        value={selectedElement.width_ft} 
                                                        onChange={e => handleUpdateSize(selectedIdx!, 'width_ft', Number(e.target.value))}
                                                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Specifications</label>
                                                <textarea 
                                                    rows={3}
                                                    value={selectedElement.specifications || ''} 
                                                    onChange={e => handleUpdateElement(selectedIdx!, { specifications: e.target.value })}
                                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                                    placeholder="e.g. Model X-500, Stainless Steel 304..."
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Utility Connections</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateElement(selectedIdx!, { utility_req: { ...selectedElement.utility_req, power: selectedElement.utility_req?.power ? undefined : '220V' } })}
                                                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedElement.utility_req?.power ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                                                    >
                                                        <Zap size={14}/> {selectedElement.utility_req?.power ? 'POWER_ACTIVE' : 'POWER_OFF'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateElement(selectedIdx!, { utility_req: { ...selectedElement.utility_req, water: !selectedElement.utility_req?.water } })}
                                                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedElement.utility_req?.water ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                                                    >
                                                        <Droplets size={14}/> {selectedElement.utility_req?.water ? 'WATER_ACTIVE' : 'WATER_OFF'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateElement(selectedIdx!, { utility_req: { ...selectedElement.utility_req, gas: !selectedElement.utility_req?.gas } })}
                                                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedElement.utility_req?.gas ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                                                    >
                                                        <Flame size={14}/> {selectedElement.utility_req?.gas ? 'GAS_ACTIVE' : 'GAS_OFF'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                        <Info size={48} className="mb-4 text-slate-500" />
                                        <p className="text-xs font-black uppercase tracking-widest">Workspace Meta</p>
                                        <p className="text-[10px] mt-2 leading-relaxed">Enter Edit Mode to add equipment, doors, or windows. Tap an element to view technical specifications.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 bg-slate-950/80 border-t border-slate-800 text-[10px] font-mono space-y-2">
                                <div className="flex justify-between"><span className="text-slate-500">COORDINATE_SYSTEM</span><span className="text-indigo-400">NORM_PERCENT</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">BOUND_CHECK</span><span className="text-emerald-500">ACTIVE</span></div>
                                {selectedElement && (
                                    <div className="flex justify-between"><span className="text-slate-500">CUR_POS</span><span className="text-white">X:{selectedElement.x.toFixed(1)} Y:{selectedElement.y.toFixed(1)}</span></div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                             <button 
                                onClick={handleExportSpec}
                                className="w-full py-3 bg-white text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl flex items-center justify-center gap-2"
                             >
                                <Printer size={16}/> EXPORT_CAD_SPEC
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div className="max-w-3xl mx-auto w-full glass bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
                    <div className="flex justify-between items-center mb-10">
                        <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-xs font-bold uppercase"><ArrowLeft size={16}/> Back</button>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Initialize Parameters</h2>
                    </div>

                    <form onSubmit={handleCreateDesign} className="space-y-8">
                        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100"><ShieldAlert size={16} className="inline mr-2"/> {error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Identifier</label>
                                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Master Bakehouse Alpha" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Boundary Length (FT)</label>
                                        <input type="number" required value={formData.length} onChange={e => setFormData({...formData, length: Number(e.target.value)})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Boundary Width (FT)</label>
                                        <input type="number" required value={formData.width} onChange={e => setFormData({...formData, width: Number(e.target.value)})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Culinary Logic</label>
                                    <input required value={formData.cuisine} onChange={e => setFormData({...formData, cuisine: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. High-Pressure Asian Wok Station" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Special Directives</label>
                                    <textarea rows={3} value={formData.reqs} onChange={e => setFormData({...formData, reqs: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="e.g. Center-island prep flow, must accommodate 4 burner stove..." />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                            {loading ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Execute Architectural Synthesis
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
