import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExecutionResult } from '../types';
import { Quote, CheckCircle, AlertTriangle } from 'lucide-react';

interface ResultsViewProps {
    results: ExecutionResult[];
    onCopyRef: (text: string, agentName: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onCopyRef }) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {results.map((res, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up" style={{animationDelay: `${idx * 100}ms`}}>
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                {res.agentName.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 text-sm">{res.agentName}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{res.providerUsed}</span>
                                    <span>•</span>
                                    <span>${res.cost.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {res.status === 'fallback_triggered' && (
                               <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                   <AlertTriangle className="w-3 h-3" /> Fallback Active
                               </span>
                           )}
                           {res.status === 'success' && (
                               <CheckCircle className="w-5 h-5 text-green-500" />
                           )}
                        </div>
                    </div>
                    <div className="p-6 prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown>{res.output}</ReactMarkdown>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={() => onCopyRef(res.output, res.agentName)}
                            className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors font-medium"
                        >
                            <Quote className="w-3 h-3" /> Quote in Notes
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};