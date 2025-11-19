import React, { useState, useEffect } from 'react';
import { AppState, AppStatus, DEFAULT_AGENTS, PdfPage, AgentConfig, ExecutionResult, ProjectConfig } from './types';
import { extractTextFromImage, executeAgent, calculateEstimatedCost, optimizeNotes } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { PDFWorkspace } from './components/PDFWorkspace';
import { AgentEditor } from './components/AgentEditor';
import { ResultsView } from './components/ResultsView';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';
import ReactMarkdown from 'react-markdown';
import { LayoutDashboard, FileText, Bot, Play, BookOpen, ChevronRight, Save, Settings, AlertCircle, Wand2, Download, Eye, Edit3, Loader2 } from 'lucide-react';

const App: React.FC = () => {
    // Initial State
    const [state, setState] = useState<AppState>({
        pdfFile: null,
        pages: [],
        agents: DEFAULT_AGENTS,
        activeTab: 'upload',
        executionResults: [],
        status: AppStatus.IDLE,
        totalCost: 0,
        configHistory: []
    });

    const [notes, setNotes] = useState<string>("");
    
    // API Key Management
    const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Notes Features State
    const [isOptimizingNotes, setIsOptimizingNotes] = useState(false);
    const [showNotePreview, setShowNotePreview] = useState(false);

    // Save API key to local storage whenever it changes
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }, [apiKey]);

    // Derived state for navigation disabling
    const canRun = state.pages.some(p => p.selected) && state.agents.length > 0;

    const handleFileLoad = (file: File) => {
        setState(prev => ({ ...prev, pdfFile: file }));
    };

    const handlePagesUpdate = (pages: PdfPage[]) => {
        setState(prev => ({ ...prev, pages }));
    };

    const handleAgentsUpdate = (agents: AgentConfig[]) => {
        setState(prev => ({ ...prev, agents }));
    };

    const saveConfiguration = () => {
        const config: ProjectConfig = {
            id: Date.now().toString(),
            name: `Config ${new Date().toLocaleTimeString()}`,
            createdAt: Date.now(),
            agents: state.agents
        };
        setState(prev => ({
            ...prev,
            configHistory: [config, ...prev.configHistory].slice(0, 10) // Keep last 10
        }));
    };

    const restoreConfiguration = (config: ProjectConfig) => {
        setState(prev => ({
            ...prev,
            agents: config.agents
        }));
    };

    const handleExecution = async () => {
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }

        if (!canRun) return;
        
        // Auto-save before run
        saveConfiguration();
        
        setState(prev => ({ ...prev, status: AppStatus.PROCESSING, activeTab: 'run', executionResults: [] }));

        const selectedPages = state.pages.filter(p => p.selected);
        const results: ExecutionResult[] = [];
        let runningCost = state.totalCost;

        try {
            // 1. "OCR" Step (Simulated via Vision model on first selected page for context)
            // In a full app, we'd map over all pages. For demo speed, we aggregate.
            let aggregatedContext = "";
            for (const page of selectedPages) {
                try {
                    const text = await extractTextFromImage(page.thumbnailDataUrl, apiKey);
                    aggregatedContext += `[Page ${page.pageNumber} Content]:\n${text}\n\n`;
                } catch (err) {
                    throw new Error("Failed to extract text. Please check your API Key.");
                }
            }

            // 2. Agent Pipeline Loop
            for (const agent of state.agents) {
                
                // Pass first page image to first agent if it's a vision task (implied capability)
                const visualContext = selectedPages[0]?.thumbnailDataUrl;

                const response = await executeAgent(agent, aggregatedContext, visualContext, apiKey);
                
                // Calculate Cost
                const estimatedCost = calculateEstimatedCost(agent.model, aggregatedContext.length / 4, response.tokens);
                runningCost += estimatedCost;

                results.push({
                    agentId: agent.id,
                    agentName: agent.name,
                    output: response.text,
                    timestamp: Date.now(),
                    cost: estimatedCost,
                    status: 'success', 
                    providerUsed: agent.provider 
                });

                // Update UI progressively
                setState(prev => ({
                    ...prev,
                    executionResults: [...results],
                    totalCost: runningCost
                }));
            }

            setState(prev => ({ ...prev, status: AppStatus.COMPLETED }));

        } catch (e) {
            console.error(e);
            setState(prev => ({ ...prev, status: AppStatus.ERROR }));
            // If error is likely auth related, prompt settings
            if ((e as Error).message.includes("API Key") || (e as Error).message.includes("403")) {
                 setIsSettingsOpen(true);
            }
        }
    };

    const appendReference = (text: string, source: string) => {
        const quote = `\n> ${text.substring(0, 150)}...\n(Source: ${source})\n`;
        setNotes(prev => prev + quote);
    };

    // Notes Actions
    const handleOptimizeNotes = async () => {
        if (!notes.trim()) return;
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }

        setIsOptimizingNotes(true);
        try {
            const optimized = await optimizeNotes(notes, apiKey);
            setNotes(optimized);
            setShowNotePreview(true);
        } catch (e) {
            console.error(e);
            alert("Failed to optimize notes. Please check your API Key.");
        } finally {
            setIsOptimizingNotes(false);
        }
    };

    const handleDownloadNotes = () => {
        if (!notes.trim()) return;
        const element = document.createElement("a");
        const file = new Blob([notes], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `AgentFlow-Notes-${new Date().toISOString().slice(0,10)}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const navItems = [
        { id: 'upload', label: 'Source PDF', icon: FileText },
        { id: 'agents', label: 'Agents Config', icon: Bot },
        { id: 'run', label: 'Results', icon: Play },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                apiKey={apiKey}
                onSave={setApiKey}
            />

            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-lg">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-primary-500/30 shadow-lg">
                        <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                    </div>
                    <span className="font-bold text-slate-800 tracking-tight">AgentFlow</span>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setState(prev => ({ ...prev, activeTab: item.id as any }))}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${state.activeTab === item.id 
                                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <item.icon className={`w-5 h-5 ${state.activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                            {item.label}
                            {item.id === 'run' && state.executionResults.length > 0 && (
                                <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {state.executionResults.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Notes / Scratchpad */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col h-80 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            <BookOpen className="w-3.5 h-3.5" /> Quick Notes
                        </div>
                        <div className="flex gap-1">
                             <button
                                onClick={() => setShowNotePreview(!showNotePreview)}
                                disabled={!notes.trim()}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white hover:shadow-sm transition-all rounded disabled:opacity-30"
                                title={showNotePreview ? "Edit" : "Preview Markdown"}
                            >
                                {showNotePreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={handleOptimizeNotes}
                                disabled={isOptimizingNotes || !notes.trim()}
                                className={`p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white hover:shadow-sm transition-all rounded disabled:opacity-30 ${isOptimizingNotes ? 'animate-spin text-primary-600' : ''}`}
                                title="AI Format (Magic)"
                            >
                                {isOptimizingNotes ? <Loader2 className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={handleDownloadNotes}
                                disabled={!notes.trim()}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white hover:shadow-sm transition-all rounded disabled:opacity-30"
                                title="Download .md"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-shadow">
                         {showNotePreview ? (
                            <div className="absolute inset-0 overflow-y-auto p-3 prose prose-slate prose-xs max-w-none scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                <ReactMarkdown>{notes}</ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type notes here or click 'Quote' on results. Use the Magic Wand to auto-format."
                                className="absolute inset-0 w-full h-full p-3 text-xs resize-none outline-none font-mono leading-relaxed text-slate-600 placeholder:text-slate-300"
                            />
                        )}
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
                    <div className="text-xs text-slate-400">v2.5.0-beta</div>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className={`p-1.5 rounded-md transition-colors ${!apiKey ? 'bg-amber-100 text-amber-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title="API Settings"
                    >
                        {!apiKey ? <AlertCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Project</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-medium">Financial Analysis Q3</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {state.activeTab === 'agents' && (
                             <Button variant="secondary" size="sm" icon={<Save className="w-4 h-4"/>} onClick={saveConfiguration}>
                                Save Version
                             </Button>
                        )}
                        <Button 
                            onClick={handleExecution} 
                            disabled={(!canRun && !!apiKey) || state.status === AppStatus.PROCESSING}
                            isLoading={state.status === AppStatus.PROCESSING}
                            icon={<Play className="w-4 h-4 fill-current" />}
                            className="min-w-[140px]"
                        >
                            {state.status === AppStatus.PROCESSING ? 'Running Pipeline...' : 'Run Analysis'}
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto h-full">
                        {state.activeTab === 'dashboard' && (
                            <Dashboard state={state} onRestore={restoreConfiguration} />
                        )}
                        {state.activeTab === 'upload' && (
                            <PDFWorkspace 
                                pages={state.pages} 
                                onPagesUpdate={handlePagesUpdate}
                                onFileLoad={handleFileLoad}
                            />
                        )}
                        {state.activeTab === 'agents' && (
                            <AgentEditor agents={state.agents} onUpdate={handleAgentsUpdate} />
                        )}
                        {state.activeTab === 'run' && (
                            state.executionResults.length > 0 ? (
                                <ResultsView results={state.executionResults} onCopyRef={appendReference} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Play className="w-8 h-8 text-slate-300 pl-1" />
                                    </div>
                                    <p>No results yet. Configure agents and press Run.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;