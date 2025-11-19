import React from 'react';
import { AppState, ProjectConfig } from '../types';
import { BarChart, Activity, DollarSign, Clock, FileText } from 'lucide-react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  state: AppState;
  onRestore: (config: ProjectConfig) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onRestore }) => {
  // Prepare chart data from execution results
  const chartData = state.executionResults.map((res, idx) => ({
    name: res.agentName,
    cost: res.cost * 1000, // Display as pseudo-credits or milli-cents for visibility
    tokens: res.output.length / 4
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">${state.totalCost.toFixed(5)}</div>
            <div className="text-xs text-green-600 mt-1">+0.002 since last run</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Agents Active</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{state.agents.length}</div>
            <div className="text-xs text-slate-400 mt-1">In current pipeline</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Pages Processed</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{state.pages.filter(p => p.selected).length}</div>
            <div className="text-xs text-slate-400 mt-1">Selected for analysis</div>
        </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">History</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{state.configHistory.length}</div>
            <div className="text-xs text-slate-400 mt-1">Saved versions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Analysis Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary-600" />
                Cost Analysis (micro-USD)
            </h3>
            <div className="h-64 w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                cursor={{fill: '#f1f5f9'}}
                            />
                            <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                                ))}
                            </Bar>
                        </ReBarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        No execution data available yet. Run the pipeline to see costs.
                    </div>
                )}
            </div>
        </div>

        {/* Version History */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Version History
            </h3>
            <div className="overflow-y-auto max-h-64 pr-2 space-y-3">
                {state.configHistory.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No saved versions.</p>
                )}
                {state.configHistory.map((config) => (
                    <div key={config.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group cursor-pointer" onClick={() => onRestore(config)}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-slate-700 text-sm">{config.name}</span>
                            <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                {new Date(config.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 flex gap-2">
                            <span>{config.agents.length} Agents</span>
                            <span>•</span>
                            <span>v{config.id.substring(0,4)}</span>
                        </div>
                         <div className="mt-2 text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            Click to Restore
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};