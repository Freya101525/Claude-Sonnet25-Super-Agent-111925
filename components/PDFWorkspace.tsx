import React, { useRef, useState } from 'react';
import { PdfPage } from '../types';
import { renderPdfToImages } from '../services/pdfService';
import { Button } from './Button';
import { UploadCloud, CheckCircle2, Search } from 'lucide-react';

interface PDFWorkspaceProps {
    pages: PdfPage[];
    onPagesUpdate: (pages: PdfPage[]) => void;
    onFileLoad: (file: File) => void;
}

export const PDFWorkspace: React.FC<PDFWorkspaceProps> = ({ pages, onPagesUpdate, onFileLoad }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsProcessing(true);
            try {
                onFileLoad(file);
                const generatedPages = await renderPdfToImages(file);
                onPagesUpdate(generatedPages);
            } catch (err) {
                console.error("PDF Load error", err);
                alert("Failed to load PDF");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const togglePageSelection = (pageIndex: number) => {
        const newPages = [...pages];
        newPages[pageIndex].selected = !newPages[pageIndex].selected;
        onPagesUpdate(newPages);
    };

    const selectAll = () => {
        const newPages = pages.map(p => ({...p, selected: true}));
        onPagesUpdate(newPages);
    }

    const clearSelection = () => {
        const newPages = pages.map(p => ({...p, selected: false}));
        onPagesUpdate(newPages);
    }

    return (
        <div className="h-full flex flex-col">
            {pages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 m-4">
                    <div className="p-10 text-center">
                        <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                            <UploadCloud className="w-10 h-10 text-primary-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Research PDF</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Drag and drop your document here or click to browse. 
                            We process locally via browser (up to 20 pages).
                        </p>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} isLoading={isProcessing} size="lg">
                            Select PDF Document
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Select Pages</h2>
                            <p className="text-sm text-slate-500">Select the pages you want the agents to analyze.</p>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="secondary" size="sm" onClick={clearSelection}>Clear</Button>
                             <Button variant="secondary" size="sm" onClick={selectAll}>Select All</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
                        {pages.map((page, idx) => (
                            <div 
                                key={page.pageNumber}
                                onClick={() => togglePageSelection(idx)}
                                className={`
                                    group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2
                                    ${page.selected 
                                        ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-lg scale-[1.02]' 
                                        : 'border-transparent hover:border-slate-300 hover:shadow-md shadow-sm bg-white'}
                                `}
                            >
                                <div className="aspect-[3/4] bg-slate-100 relative">
                                    <img 
                                        src={page.thumbnailDataUrl} 
                                        alt={`Page ${page.pageNumber}`} 
                                        className={`w-full h-full object-cover transition-opacity ${page.selected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                    />
                                    {page.selected && (
                                        <div className="absolute inset-0 bg-primary-600/10 flex items-center justify-center backdrop-blur-[1px]">
                                            <CheckCircle2 className="w-10 h-10 text-primary-600 drop-shadow-sm" fill="white" />
                                        </div>
                                    )}
                                    {/* Search Icon Overlay on Hover if not selected */}
                                    {!page.selected && (
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Search className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                                <div className={`
                                    absolute bottom-0 left-0 right-0 py-2 text-center text-xs font-medium
                                    ${page.selected ? 'bg-primary-600 text-white' : 'bg-white/90 text-slate-600 backdrop-blur-sm'}
                                `}>
                                    Page {page.pageNumber}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};