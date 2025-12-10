import React, { useCallback, useState } from 'react';
import { UploadCloud, FolderOpen, FileArchive, Loader2, MessageSquare, X, Play, FileCode } from 'lucide-react';
import { processZipFile, processFileList } from '../utils/fileHelpers';
import { FileContent } from '../types';

interface UploadZoneProps {
  onFilesProcessed: (files: FileContent[], projectName: string, instructions: string) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesProcessed, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | FileList | null>(null);
  const [instructions, setInstructions] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length === 1 && droppedFiles[0].name.endsWith('.zip')) {
         setPendingFile(droppedFiles[0]);
      } else {
         // Assuming folder drop or multiple files, treat as file list
         setPendingFile(droppedFiles);
      }
    }
  }, []);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingFile(e.target.files[0]);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFile(e.target.files);
    }
  };

  const clearSelection = () => {
    setPendingFile(null);
    setInstructions('');
  };

  const getProjectName = (): string => {
    if (!pendingFile) return '';
    if (pendingFile instanceof File) {
      return pendingFile.name.replace('.zip', '');
    }
    // FileList
    if (pendingFile.length > 0) {
       const path = pendingFile[0].webkitRelativePath;
       return path ? path.split('/')[0] : "Uploaded Project";
    }
    return "Project";
  };

  const handleStartAnalysis = async () => {
    if (!pendingFile) return;
    setIsParsing(true);
    const projectName = getProjectName();

    try {
      let processed: FileContent[] = [];
      if (pendingFile instanceof File) {
         processed = await processZipFile(pendingFile);
      } else {
         processed = await processFileList(pendingFile);
      }
      onFilesProcessed(processed, projectName, instructions);
    } catch (err) {
      console.error("Error processing files", err);
      alert("Failed to process files. Please try again.");
      setIsParsing(false);
    }
  };

  // Render the initial Drop Zone
  if (!pendingFile) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 mb-12 animate-fade-in-up">
        <div 
          className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out p-12 text-center
            ${dragActive ? 'border-primary bg-primary/5' : 'border-surfaceHighlight bg-surface/50 hover:border-muted'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 rounded-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-surfaceHighlight flex items-center justify-center shadow-2xl shadow-black/50 group-hover:scale-105 transition-transform duration-300">
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-primary' : 'text-muted group-hover:text-text'}`} />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Upload Codebase
              </h3>
              <p className="text-muted text-sm max-w-sm mx-auto">
                Drag & drop a ZIP file or folder here to begin.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <label className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95">
                  <FileArchive className="w-4 h-4" />
                  <span className="font-medium">Select ZIP</span>
                  <input type="file" accept=".zip" onChange={handleZipChange} className="hidden" disabled={isProcessing} />
              </label>

              <label className="flex items-center gap-2 px-5 py-2.5 bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-text border border-surface rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95">
                  <FolderOpen className="w-4 h-4" />
                  <span className="font-medium">Select Folder</span>
                  <input 
                      type="file" 
                      // @ts-ignore
                      webkitdirectory="" 
                      directory="" 
                      onChange={handleFolderChange} 
                      className="hidden" 
                      disabled={isProcessing} 
                  />
              </label>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
            <p className="text-xs text-muted uppercase tracking-widest font-mono">Supported Languages</p>
            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500 font-mono">
                <span>TS/JS</span>
                <span>Python</span>
                <span>Go</span>
                <span>Rust</span>
                <span>C++</span>
                <span>Java</span>
            </div>
        </div>
      </div>
    );
  }

  // Render the Review & Instructions View
  return (
    <div className="w-full max-w-2xl mx-auto mt-12 mb-12 animate-fade-in">
       <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-surfaceHighlight flex items-center justify-between bg-surfaceHighlight/20">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                   <h3 className="text-white font-bold">{getProjectName()}</h3>
                   <p className="text-xs text-muted font-mono">
                     {pendingFile instanceof File ? 'ZIP Archive' : `${pendingFile.length} Files detected`}
                   </p>
                </div>
             </div>
             <button 
               onClick={clearSelection} 
               className="p-2 hover:bg-white/10 rounded-full text-muted hover:text-white transition-colors"
               disabled={isParsing || isProcessing}
             >
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-accent" />
                   Analysis Instructions <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea 
                   className="w-full h-32 bg-background border border-surfaceHighlight rounded-xl p-4 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none font-mono"
                   placeholder="e.g., Check for SQL injection vulnerabilities in the user controller, or optimize the image processing loop..."
                   value={instructions}
                   onChange={(e) => setInstructions(e.target.value)}
                   disabled={isParsing || isProcessing}
                />
             </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-surfaceHighlight/10 border-t border-surfaceHighlight flex justify-end gap-3">
             <button 
                onClick={clearSelection}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
                disabled={isParsing || isProcessing}
             >
                Cancel
             </button>
             <button 
                onClick={handleStartAnalysis}
                disabled={isParsing || isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-background font-bold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
             >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Files...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start Analysis
                  </>
                )}
             </button>
          </div>
       </div>
    </div>
  );
};

export default UploadZone;