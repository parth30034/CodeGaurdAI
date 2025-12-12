
import React from 'react';
import { AnalysisReport, ArchitectureReport, ImpactReport, CostReport, SecurityReport } from '../types';
import { ShieldAlert, Zap, Layers, Code, CheckCircle, AlertTriangle, Target, Network, DollarSign, Lock, Download } from 'lucide-react';

interface DashboardProps {
  report: AnalysisReport;
  onReset: () => void;
}

// --- SUB-COMPONENTS FOR MODULES ---

const ArchitectureView: React.FC<{ report: ArchitectureReport }> = ({ report }) => (
  <div className="space-y-8">
    {/* Dimensions Grid */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(report.dimensionScores).map(([key, score]) => (
        <div key={key} className="bg-surface border border-surfaceHighlight p-4 rounded-xl text-center">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{key}</div>
          <div className={`text-2xl font-bold ${(score as number) > 80 ? 'text-accent' : (score as number) > 50 ? 'text-yellow-400' : 'text-danger'}`}>{score as number}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Top Issues */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" /> Top Issues
        </h3>
        {report.topIssues.map((issue, i) => (
          <div key={i} className="bg-surface border border-surfaceHighlight p-5 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-200">{issue.title}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                issue.severity === 'Critical' ? 'bg-danger/10 text-danger border-danger/20' : 
                'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
              }`}>{issue.severity}</span>
            </div>
            <p className="text-sm text-muted">{issue.description}</p>
          </div>
        ))}
      </div>

      {/* Recommendations & Quick Wins */}
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Strategic Recommendations</h3>
          <ul className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Wins</h3>
          <ul className="space-y-3">
            {report.quickWins.map((win, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                {win}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const ImpactView: React.FC<{ report: ImpactReport }> = ({ report }) => (
  <div className="space-y-8">
    <div className="bg-surfaceHighlight/10 border border-surfaceHighlight p-6 rounded-xl flex items-center justify-between">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider mb-1">Target Component</div>
        <div className="text-xl font-mono text-primary">{report.targetSymbol}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted uppercase tracking-wider mb-1">Blast Radius</div>
        <div className={`text-xl font-bold ${
          report.blastRadius === 'Critical' ? 'text-danger' : 
          report.blastRadius === 'High' ? 'text-orange-400' : 'text-accent'
        }`}>{report.blastRadius}</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Network className="w-4 h-4" /> Affected User Flows</h3>
        <div className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden">
          {report.affectedFlows.map((flow, i) => (
            <div key={i} className="p-3 border-b border-surfaceHighlight last:border-0 text-sm text-gray-300">
              {flow}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Code className="w-4 h-4" /> Required Tests</h3>
        <div className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden">
          {report.requiredTests.map((test, i) => (
            <div key={i} className="p-3 border-b border-surfaceHighlight last:border-0 text-sm text-gray-300">
              {test}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-white mb-4">Safe Refactor Plan</h3>
      <div className="space-y-2">
        {report.refactorPlan.map((step, i) => (
          <div key={i} className="flex gap-4 items-start p-4 bg-surface border border-surfaceHighlight rounded-lg">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </div>
            <p className="text-sm text-gray-300">{step}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CostView: React.FC<{ report: CostReport }> = ({ report }) => (
  <div className="space-y-8">
    <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 p-8 rounded-2xl text-center">
      <div className="text-sm text-green-400 uppercase tracking-widest mb-2">Estimated Monthly Waste</div>
      <div className="text-5xl font-bold text-white mb-2">{report.estimatedMonthlyWaste}</div>
      <p className="text-xs text-muted">Potential savings if recommended optimizations are applied</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h3 className="text-xl font-bold text-white mb-4">Resource Inefficiencies</h3>
        <div className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceHighlight text-muted font-mono uppercase text-xs">
              <tr>
                <th className="p-4">Resource</th>
                <th className="p-4">Usage Pattern</th>
                <th className="p-4">Inefficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceHighlight">
              {report.resourceTable.map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-4 font-medium text-gray-200">{row.resource}</td>
                  <td className="p-4 text-gray-400">{row.usage}</td>
                  <td className="p-4 text-danger">{row.inefficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Top Savings Opportunities</h3>
        <div className="space-y-3">
          {report.topSavings.map((item, i) => (
            <div key={i} className="bg-surface border border-surfaceHighlight p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-green-400">{item.savings}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                  item.risk === 'High' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                }`}>{item.risk} Risk</span>
              </div>
              <p className="text-sm text-gray-300">{item.item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SecurityView: React.FC<{ report: SecurityReport }> = ({ report }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-danger" /> Vulnerabilities Found
        </h3>
        {report.vulnerabilities.length > 0 ? (
          report.vulnerabilities.map((vuln, i) => (
            <div key={i} className="bg-surface border border-surfaceHighlight rounded-xl p-5 hover:border-danger/40 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-muted">{vuln.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                        vuln.severity === 'Critical' ? 'bg-danger/20 text-danger border-danger/40' : 
                        vuln.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>{vuln.severity}</span>
                   </div>
                   <div className="font-mono text-sm text-primary break-all">{vuln.file}</div>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div className="bg-background p-3 rounded border border-surfaceHighlight">
                  <div className="text-[10px] text-muted uppercase mb-1">Evidence</div>
                  <code className="text-xs text-danger block overflow-x-auto">{vuln.evidence}</code>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase mb-1">Remediation</div>
                  <p className="text-sm text-gray-300">{vuln.remediation}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 border border-surfaceHighlight rounded-xl text-center bg-surfaceHighlight/5">
            <CheckCircle className="w-8 h-8 text-green-500 mb-3 mx-auto"/>
            <p>No critical vulnerabilities detected.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {report.secretsFound.length > 0 && (
          <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-xl">
             <h4 className="text-danger font-bold mb-3 flex items-center gap-2"><Lock className="w-4 h-4"/> Secrets Exposed</h4>
             <ul className="space-y-2">
               {report.secretsFound.map((secret, i) => (
                 <li key={i} className="text-sm text-red-200 font-mono bg-red-900/20 px-2 py-1 rounded truncate">{secret}</li>
               ))}
             </ul>
          </div>
        )}

        <div className="bg-surface border border-surfaceHighlight p-5 rounded-xl">
           <h4 className="text-white font-bold mb-3">Hardening Checklist</h4>
           <ul className="space-y-2">
             {report.hardeningChecklist.map((item, i) => (
               <li key={i} className="flex gap-2 text-sm text-gray-400">
                 <div className="mt-0.5 w-4 h-4 border border-gray-600 rounded flex items-center justify-center shrink-0"></div>
                 {item}
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD SWITCHER ---

const AnalysisDashboard: React.FC<DashboardProps> = ({ report, onReset }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-surfaceHighlight pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase border border-accent/20">Analysis Complete</span>
               <span className="text-xs text-muted font-mono">{new Date(report.timestamp).toLocaleString()}</span>
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">{report.module} MODULE</span>
           </div>
           <h2 className="text-3xl font-bold text-white mb-2">{report.projectName}</h2>
           <p className="text-muted text-sm max-w-2xl leading-relaxed">{report.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="px-4 py-2 bg-surface hover:bg-surfaceHighlight border border-surfaceHighlight text-white text-sm rounded-lg transition-colors">
            New Scan
          </button>
        </div>
      </div>

      {/* Render Module Specific View */}
      {report.module === 'architecture' && <ArchitectureView report={report} />}
      {report.module === 'impact' && <ImpactView report={report} />}
      {report.module === 'cost' && <CostView report={report} />}
      {report.module === 'security' && <SecurityView report={report} />}
      
    </div>
  );
};

export default AnalysisDashboard;
