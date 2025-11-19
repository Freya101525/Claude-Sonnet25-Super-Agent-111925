import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onSave: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSave }) => {
    const [keyInput, setKeyInput] = useState(apiKey);

    useEffect(() => {
        setKeyInput(apiKey);
    }, [apiKey, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary-600" />
                        API Configuration
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Secure Local Storage</p>
                            <p className="opacity-90 text-xs leading-relaxed">Your API key is stored locally in your browser's storage. It is never sent to our servers, only directly to Google's Gemini API.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono text-sm"
                            autoComplete="off"
                        />
                        <div className="flex justify-end">
                             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors">
                                Get a key <ExternalLink className="w-3 h-3" />
                             </a>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => { onSave(keyInput); onClose(); }}>Save Configuration</Button>
                </div>
            </div>
        </div>
    );
};