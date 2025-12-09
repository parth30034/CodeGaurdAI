import React from 'react';
import { AnalysisReport, Hotspot, Bottleneck } from '../types';
import { AlertTriangle, Zap, Layers, Code, CheckCircle, Cpu, ShieldAlert, ArrowRight } from 'lucide-react';

interface DashboardProps {
  report: AnalysisReport;
  onReset: () => void;
}

const ScoreCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-surface border border-surfaceHighlight rounded-xl p-5 flex flex-col gap-2">
    <span className="text-xs text-muted uppercase tracking-wider font-mono">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
  </div>
);

const RiskItem = ({ item }: { item: Hotspot }) => (
  <div className="group p-4 bg-surfaceHighlight/30 rounded-lg border-l-4 border-danger hover:bg-surfaceHighlight/50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-mono text-sm text-danger font-bold flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        {item.file}
      </h4>
      <span className="text-[10px] bg-danger/10 text-danger px-2 py-1 rounded uppercase tracking-wider">High Risk</span>
    </div>
    <p className="text-sm text-white mb-1 font-medium">{item.issue}</p>
    <p className="text-xs text-muted leading-relaxed">{item.impact}</p>
  </div>
);

const BottleneckItem = ({ item }: { item: Bottleneck }) => (
    <tr className="border-b border-surfaceHighlight last:border-0 hover:bg-surfaceHighlight/20">
        <td className="p-4 font-mono text-xs text-primary">{item.location}</td>
        <td className="p-4 text-sm text-white">{item.pattern}</td>
        <td className="p-4 text-sm text-muted hidden md:table-cell">{item.reason}</td>
        <td className="p-4 text-sm text-accent">{item.suggestion}</td>
    </tr>
);

const AnalysisDashboard: React.FC<DashboardProps> = ({ report, onReset }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 animate-fade-in">
      {/* Overview Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-surfaceHighlight pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">Audit Complete</span>
               <span className="text-xs text-muted font-mono">{new Date(report.timestamp).toLocaleString()}</span>
           </div>
           <h2 className="text-3xl font-bold text-white mb-1">{report.projectName}</h2>
           <p className="text-muted text-sm">{report.summary}</p>
        </div>
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-surface hover:bg-surfaceHighlight border border-surfaceHighlight text-white text-sm rounded-lg transition-colors"
        >
          Scan Another Project
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
         <ScoreCard label="Files Scanned" value={report.totalFilesScanned.toString()} color="text-white" />
         <ScoreCard label="Hotspots Found" value={report.highRiskHotspots.length.toString()} color="text-danger" />
         <ScoreCard label="Bottlenecks" value={report.bottlenecks.length.toString()} color="text-yellow-400" />
         <ScoreCard label="Health Score" value={Math.max(0, 100 - (report.highRiskHotspots.length * 10) - (report.bottlenecks.length * 5)).toString() + '%'} color="text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Hotspots & Architecture */}
        <div className="space-y-8 lg:col-span-1">
          <section>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
               <AlertTriangle className="w-5 h-5 text-danger" />
               High-Risk Hotspots
            </h3>
            <div className="space-y-3">
               {report.highRiskHotspots.length > 0 ? (
                 report.highRiskHotspots.map((h, i) => <RiskItem key={i} item={h} />)
               ) : (
                 <div className="p-4 bg-surfaceHighlight/30 rounded-lg text-sm text-muted text-center">No critical hotspots detected.</div>
               )}
            </div>
          </section>

          <section>
             <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
               <Layers className="w-5 h-5 text-purple-400" />
               Architecture
            </h3>
            <ul className="space-y-2">
                {report.architecturalObservations.map((obs, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        {obs}
                    </li>
                ))}
            </ul>
          </section>
        </div>

        {/* Middle/Right Column: Bottlenecks & Code */}
        <div className="lg:col-span-2 space-y-8">
            
            <section className="bg-surface rounded-xl border border-surfaceHighlight overflow-hidden">
                <div className="p-6 border-b border-surfaceHighlight flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Performance Bottlenecks
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surfaceHighlight/50 text-xs uppercase tracking-wider text-muted font-mono">
                                <th className="p-4">Location</th>
                                <th className="p-4">Pattern</th>
                                <th className="p-4 hidden md:table-cell">Why it's slow</th>
                                <th className="p-4">Optimization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.bottlenecks.length > 0 ? (
                                report.bottlenecks.map((b, i) => <BottleneckItem key={i} item={b} />)
                            ) : (
                                <tr><td colSpan={4} className="p-6 text-center text-muted">No major bottlenecks found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

             <section>
                <div className="flex items-center gap-2 mb-4">
                     <Cpu className="w-5 h-5 text-accent" />
                     <h3 className="text-xl font-bold text-white">Anti-Patterns Detected</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                    {report.antiPatterns.map((ap, i) => (
                        <span key={i} className="px-3 py-1 bg-surfaceHighlight rounded-full text-xs text-gray-300 border border-surfaceHighlight/50">
                            {ap}
                        </span>
                    ))}
                    {report.antiPatterns.length === 0 && <span className="text-sm text-muted">Clean code practices observed.</span>}
                </div>
             </section>

             <section className="bg-[#0d0d12] rounded-xl border border-surfaceHighlight overflow-hidden">
                <div className="p-4 bg-surfaceHighlight/20 border-b border-surfaceHighlight flex justify-between items-center">
                     <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                        <Code className="w-4 h-4 text-accent" />
                        Suggested Optimization
                     </h3>
                     <span className="text-[10px] font-mono text-muted uppercase">Gemini Generated</span>
                </div>
                <div className="p-6 overflow-x-auto">
                     <pre className="font-mono text-sm text-gray-300 leading-relaxed">
                        <code>{report.optimizedCodeExample}</code>
                     </pre>
                </div>
             </section>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
