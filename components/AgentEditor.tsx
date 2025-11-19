import React, { useState } from 'react';
import { AgentConfig, ModelProvider } from '../types';
import { Button } from './Button';
import { Trash2, GripVertical, Plus, Save, Sliders } from 'lucide-react';

interface AgentEditorProps {
    agents: AgentConfig[];
    onUpdate: (agents: AgentConfig[]) => void;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agents, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addAgent = () => {
        const newAgent: AgentConfig = {
            id: Date.now().toString(),
            name: 'New Agent',
            role: 'Analyst',
            model: 'gemini-2.5-flash',
            provider: ModelProvider.GEMINI,
            promptTemplate: 'Analyze the input and provide insights.',
            temperature: 0.5,
            fallbackEnabled: true
        };
        onUpdate([...agents, newAgent]);
        setEditingId(newAgent.id);
    };

    const removeAgent = (id: string) => {
        onUpdate(agents.filter(a => a.id !== id));
    };

    const updateAgent = (id: string, updates: Partial<AgentConfig>) => {
        onUpdate(agents.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const moveAgent = (index: number, direction: -1 | 1) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === agents.length - 1)) return;
        const newAgents = [...agents];
        const temp = newAgents[index];
        newAgents[index] = newAgents[index + direction];
        newAgents[index + direction] = temp;
        onUpdate(newAgents);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* List Column */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Pipeline Order</h3>
                    <Button size="sm" onClick={addAgent} icon={<Plus className="w-4 h-4"/>}>Add Agent</Button>
                </div>
                <div className="overflow-y-auto p-3 space-y-2 flex-1">
                    {agents.map((agent, idx) => (
                        <div 
                            key={agent.id}
                            className={`
                                p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 group
                                ${editingId === agent.id 
                                    ? 'border-primary-500 bg-primary-50 shadow-sm' 
                                    : 'border-slate-200 bg-white hover:border-primary-300'}
                            `}
                            onClick={() => setEditingId(agent.id)}
                        >
                            <div className="flex flex-col gap-0.5 text-slate-400">
                                <button 
                                    className="hover:text-slate-700 disabled:opacity-30" 
                                    onClick={(e) => { e.stopPropagation(); moveAgent(idx, -1); }}
                                    disabled={idx === 0}
                                >▲</button>
                                <button 
                                    className="hover:text-slate-700 disabled:opacity-30" 
                                    onClick={(e) => { e.stopPropagation(); moveAgent(idx, 1); }}
                                    disabled={idx === agents.length - 1}
                                >▼</button>
                            </div>
                            
                            <div className="flex-1">
                                <div className="font-medium text-slate-900 text-sm">{agent.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${agent.provider === ModelProvider.GEMINI ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                    {agent.model}
                                </div>
                            </div>

                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Column */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[calc(100vh-140px)] overflow-y-auto">
                {editingId ? (
                    (() => {
                        const agent = agents.find(a => a.id === editingId);
                        if (!agent) return null;
                        return (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Configure Agent</h3>
                                        <p className="text-slate-500 text-sm">Customize behavior and model parameters.</p>
                                    </div>
                                    <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium border border-primary-100">
                                        Est. Cost: ~$0.0004 / run
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Agent Name</label>
                                        <input 
                                            type="text" 
                                            value={agent.name}
                                            onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Role/Persona</label>
                                        <input 
                                            type="text" 
                                            value={agent.role}
                                            onChange={(e) => updateAgent(agent.id, { role: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Model Provider</label>
                                        <select 
                                            value={agent.provider}
                                            onChange={(e) => updateAgent(agent.id, { provider: e.target.value as ModelProvider })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                        >
                                            <option value={ModelProvider.GEMINI}>Google Gemini (Rec)</option>
                                            <option value={ModelProvider.ANTHROPIC}>Anthropic Claude</option>
                                            <option value={ModelProvider.OPENAI}>OpenAI GPT-4</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Model ID</label>
                                        <select
                                            value={agent.model}
                                            onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                        >
                                             {agent.provider === ModelProvider.GEMINI && (
                                                <>
                                                    <option value="gemini-2.5-flash">gemini-2.5-flash (Fast/Cheap)</option>
                                                    <option value="gemini-2.5-pro">gemini-2.5-pro (Reasoning)</option>
                                                </>
                                             )}
                                             {agent.provider !== ModelProvider.GEMINI && (
                                                 <option value="custom">External Model (Mocked)</option>
                                             )}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex justify-between">
                                        <span>System Prompt</span>
                                        <span className="text-xs text-slate-400 font-normal">Supports jinja2 style variables</span>
                                    </label>
                                    <textarea 
                                        value={agent.promptTemplate}
                                        onChange={(e) => updateAgent(agent.id, { promptTemplate: e.target.value })}
                                        className="w-full h-40 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm leading-relaxed resize-none"
                                    />
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Sliders className="w-4 h-4" /> Advanced Settings
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium text-slate-700">Temperature ({agent.temperature})</div>
                                            <div className="text-xs text-slate-500">Controls randomness</div>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" max="1" step="0.1" 
                                            value={agent.temperature}
                                            onChange={(e) => updateAgent(agent.id, { temperature: parseFloat(e.target.value) })}
                                            className="w-32 accent-primary-600"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium text-slate-700">Auto-Fallback</div>
                                            <div className="text-xs text-slate-500">Switch to Gemini on error</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={agent.fallbackEnabled} onChange={(e) => updateAgent(agent.id, {fallbackEnabled: e.target.checked})} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <GripVertical className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select an agent from the pipeline to configure</p>
                    </div>
                )}
            </div>
        </div>
    );
};