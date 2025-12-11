
import React, { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import AnalysisDashboard from './components/AnalysisDashboard';
import { analyzeCodebase } from './services/geminiService';
import { AppState, AnalysisReport, FileContent, ModuleType } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>('');

  const handleFilesProcessed = async (files: FileContent[], projectName: string, module: ModuleType, instructions: string) => {
    setState(AppState.ANALYZING);
    setLoadingMsg(`Running ${module.toUpperCase()} analysis on ${files.length} files...`);
    
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await analyzeCodebase(files, projectName, module, instructions);
      setReport(result);
      setState(AppState.COMPLETE);
    } catch (error) {
      console.error(error);
      setState(AppState.ERROR);
      alert("Analysis failed. Please check your API key and try again.");
    }
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
      <Header />
      
      <main className="relative pt-6">
        {state === AppState.IDLE && (
          <div className="animate-fade-in-up">
            <UploadZone onFilesProcessed={handleFilesProcessed} isProcessing={false} />
            
            {/* Features preview for landing state */}
            <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-8 opacity-60">
                <div className="p-4">
                    <h3 className="text-white font-bold mb-2">Module-Based Analysis</h3>
                    <p className="text-xs text-muted">Select specialized lenses for Architecture, Security, Cost, or Impact.</p>
                </div>
                <div className="p-4">
                    <h3 className="text-white font-bold mb-2">Deep Context</h3>
                    <p className="text-xs text-muted">AI understands the connections between files to predict breaking changes.</p>
                </div>
                <div className="p-4">
                    <h3 className="text-white font-bold mb-2">Actionable Reports</h3>
                    <p className="text-xs text-muted">Get concrete remediation plans, not just generic advice.</p>
                </div>
            </div>
          </div>
        )}

        {state === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-fade-in">
             <div className="relative w-24 h-24">
                 <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
                 <div className="absolute inset-2 border-r-4 border-secondary rounded-full animate-spin reverse"></div>
                 <div className="absolute inset-4 border-b-4 border-accent rounded-full animate-pulse"></div>
             </div>
             <div className="text-center space-y-2">
                 <h2 className="text-2xl font-bold text-white">Scanning Codebase</h2>
                 <p className="text-primary font-mono text-sm animate-pulse">{loadingMsg}</p>
                 <p className="text-xs text-muted max-w-md mx-auto mt-4">This may take up to a minute depending on project size and complexity.</p>
             </div>
          </div>
        )}

        {state === AppState.COMPLETE && report && (
          <AnalysisDashboard report={report} onReset={handleReset} />
        )}

        {state === AppState.ERROR && (
           <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
              <div className="text-danger font-bold text-xl">System Error</div>
              <p className="text-muted">The analysis could not be completed.</p>
              <button onClick={handleReset} className="px-4 py-2 bg-surface border border-surfaceHighlight rounded hover:bg-surfaceHighlight text-white">Try Again</button>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
