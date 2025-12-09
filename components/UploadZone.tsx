import React, { useCallback, useState } from 'react';
import { UploadCloud, FolderOpen, FileArchive, Loader2 } from 'lucide-react';
import JSZip from 'jszip'; // Ensure JSZip is bundled
import { processZipFile, processFileList } from '../utils/fileHelpers';
import { FileContent } from '../types';

interface UploadZoneProps {
  onFilesProcessed: (files: FileContent[], projectName: string) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesProcessed, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        try {
          const processed = await processZipFile(file);
          onFilesProcessed(processed, file.name.replace('.zip', ''));
        } catch (err) {
          console.error("ZIP Error", err);
          alert("Failed to process ZIP file.");
        }
      } else {
        alert("Please upload a .zip file for drag and drop, or use the folder selector.");
      }
    }
  }, [onFilesProcessed]);

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const processed = await processZipFile(file);
        onFilesProcessed(processed, file.name.replace('.zip', ''));
      } catch (err) {
        console.error(err);
        alert("Error reading ZIP.");
      }
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = e.target.files;
        // Try to determine project name from the first file's path
        const firstPath = files[0].webkitRelativePath;
        const projectName = firstPath ? firstPath.split('/')[0] : "Uploaded Project";
        
        try {
            const processed = await processFileList(files);
            onFilesProcessed(processed, projectName);
        } catch (err) {
            console.error(err);
            alert("Error reading folder.");
        }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 mb-12">
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
              {isProcessing ? 'Processing Project...' : 'Upload Codebase'}
            </h3>
            <p className="text-muted text-sm max-w-sm mx-auto">
              Drag & drop a ZIP file here, or use the buttons below to select your source code.
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
                    // @ts-ignore - webkitdirectory is non-standard but widely supported
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
      
      {!isProcessing && (
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
      )}
    </div>
  );
};

export default UploadZone;
