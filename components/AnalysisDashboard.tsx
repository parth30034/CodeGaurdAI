
import React, { useState, useMemo } from 'react';
import { AnalysisReport, Hotspot, Bottleneck, Category } from '../types';
import { AlertTriangle, Zap, Layers, Code, ShieldAlert, CheckCircle, Server, Monitor, LayoutGrid, Network, ListFilter, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  report: AnalysisReport;
  onReset: () => void;
}

const CategoryBadge = ({ category }: { category: Category }) => {
  const styles = {
    Frontend: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Backend: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Mixed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Infrastructure: 'bg-green-500/10 text-green-400 border-green-500/20',
    General: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${styles[category] || styles.General}`}>
      {category}
    </span>
  );
};

const ScoreCard = ({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) => (
  <div className="bg-surface border border-surfaceHighlight rounded-xl p-5 flex items-center justify-between group hover:border-primary/30 transition-colors">
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted uppercase tracking-wider font-mono">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-surfaceHighlight group-hover:bg-background transition-colors`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  </div>
);

const RiskItem = ({ item }: { item: Hotspot }) => (
  <div className="group p-5 bg-surface border border-surfaceHighlight rounded-xl hover:border-danger/40 transition-all hover:shadow-lg hover:shadow-danger/5">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-danger/10 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5 text-danger" />
        </div>
        <div>
           <h4 className="font-mono text-sm text-gray-200 font-bold break-all">
            {item.file}
           </h4>
           <CategoryBadge category={item.category} />
        </div>
      </div>
    </div>
    <h5 className="text-white font-medium mb-2">{item.issue}</h5>
    <p className="text-sm text-muted leading-relaxed border-t border-surfaceHighlight pt-3 mt-1">
      <span className="text-danger font-bold text-xs uppercase tracking-wide mr-2">Impact:</span>
      {item.impact}
    </p>
  </div>
);

const BottleneckItem = ({ item }: { item: Bottleneck }) => (
    <div className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
        <div className="p-4 bg-surfaceHighlight/10 flex items-center justify-between border-b border-surfaceHighlight">
            <div className="flex items-center gap-3 overflow-hidden">
               <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
               <span className="font-mono text-sm text-primary truncate">{item.location}</span>
            </div>
            <CategoryBadge category={item.category} />
        </div>
        <div className="p-5 space-y-4">
            <div>
               <p className="text-xs text-muted uppercase tracking-wider mb-1">Pattern</p>
               <p className="text-white font-medium">{item.pattern}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-background rounded-lg p-3 border border-surfaceHighlight">
                   <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Problem</p>
                   <p className="text-sm text-muted">{item.reason}</p>
               </div>
               <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                   <p className="text-[10px] text-accent uppercase tracking-wider mb-1">Solution</p>
                   <p className="text-sm text-gray-300">{item.suggestion}</p>
               </div>
            </div>
        </div>
    </div>
);

const AnalysisDashboard: React.FC<DashboardProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'All' | Category>('All');
  const [isExporting, setIsExporting] = useState(false);

  // Filter Data
  const filteredHotspots = useMemo(() => {
    if (activeTab === 'All') return report.highRiskHotspots;
    return report.highRiskHotspots.filter(h => h.category === activeTab);
  }, [report, activeTab]);

  const filteredBottlenecks = useMemo(() => {
    if (activeTab === 'All') return report.bottlenecks;
    return report.bottlenecks.filter(b => b.category === activeTab);
  }, [report, activeTab]);

  const healthScore = Math.max(0, 100 - (report.highRiskHotspots.length * 10) - (report.bottlenecks.length * 5));
  
  const tabs: {id: 'All' | Category, icon: any, label: string}[] = [
    { id: 'All', icon: LayoutGrid, label: 'Overview' },
    { id: 'Frontend', icon: Monitor, label: 'Frontend' },
    { id: 'Backend', icon: Server, label: 'Backend' },
    { id: 'Mixed', icon: Layers, label: 'Mixed' },
    { id: 'Infrastructure', icon: Network, label: 'Infra' },
  ];

  const generatePDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper to add text with wrapping and pagination
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000', indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color);
        
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        const lineHeight = fontSize * 0.5; // Approx points to mm

        if (yPos + (lines.length * lineHeight) > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
        }

        doc.text(lines, margin + indent, yPos);
        yPos += (lines.length * lineHeight) + 2;
      };

      const addDivider = () => {
         yPos += 2;
         doc.setDrawColor(200, 200, 200);
         doc.line(margin, yPos, pageWidth - margin, yPos);
         yPos += 7;
      };

      // HEADER
      doc.setFillColor(10, 10, 15); // Dark background
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(0, 229, 255); // Cyan
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("CodeGuard AI Report", margin, 20);
      
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${report.projectName}`, margin, 30);
      
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(report.timestamp).toLocaleString()}`, pageWidth - margin - 60, 30);

      yPos = 50;

      // SUMMARY
      addText("Executive Summary", 16, true, '#7000ff');
      yPos += 2;
      addText(report.summary, 11, false, '#333333');
      
      yPos += 5;

      // METRICS
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
      let statsY = yPos + 10;
      let colWidth = contentWidth / 4;
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text("Total Files", margin + 5, statsY);
      doc.text("Health Score", margin + colWidth + 5, statsY);
      doc.text("Hotspots", margin + (colWidth * 2) + 5, statsY);
      doc.text("Bottlenecks", margin + (colWidth * 3) + 5, statsY);

      statsY += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(report.totalFilesScanned.toString(), margin + 5, statsY);
      doc.text(`${healthScore}%`, margin + colWidth + 5, statsY);
      doc.setTextColor(220, 20, 60); // Red
      doc.text(report.highRiskHotspots.length.toString(), margin + (colWidth * 2) + 5, statsY);
      doc.setTextColor(218, 165, 32); // Orange/Gold
      doc.text(report.bottlenecks.length.toString(), margin + (colWidth * 3) + 5, statsY);

      yPos += 35;

      // HOTSPOTS
      if (report.highRiskHotspots.length > 0) {
        addText("Critical Security & Logic Hotspots", 14, true, '#ff2a6d');
        addDivider();
        report.highRiskHotspots.forEach((h, i) => {
            addText(`${i + 1}. ${h.file}  [${h.category}]`, 11, true, '#000000');
            addText(`Issue: ${h.issue}`, 10, false, '#444444', 5);
            addText(`Impact: ${h.impact}`, 10, true, '#d32f2f', 5);
            yPos += 4;
        });
      }

      yPos += 5;

      // BOTTLENECKS
      if (report.bottlenecks.length > 0) {
          if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
          addText("Performance Bottlenecks", 14, true, '#e6b800'); // Goldish
          addDivider();
          report.bottlenecks.forEach((b, i) => {
              addText(`${i + 1}. ${b.location}  [${b.category}]`, 11, true, '#000000');
              addText(`Pattern: ${b.pattern}`, 10, false, '#444444', 5);
              addText(`Problem: ${b.reason}`, 10, false, '#444444', 5);
              addText(`Fix: ${b.suggestion}`, 10, true, '#00994d', 5);
              yPos += 4;
          });
      }

      yPos += 5;

      // ARCHITECTURE
      if (report.architecturalObservations.length > 0) {
          if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
          addText("Architectural Observations", 14, true, '#7000ff');
          addDivider();
          report.architecturalObservations.forEach((obs) => {
              addText(`• ${obs}`, 10, false, '#333333');
          });
      }
      
      // OPTIMIZED CODE
      if (report.optimizedCodeExample) {
         doc.addPage();
         yPos = 20;
         addText("Optimized Code Example", 14, true, '#00e5ff');
         addDivider();
         
         doc.setFont('courier', 'normal');
         doc.setFontSize(9);
         doc.setTextColor(50, 50, 50);
         doc.setFillColor(245, 245, 245);
         
         // Simple background calc (rough)
         const lines = doc.splitTextToSize(report.optimizedCodeExample, contentWidth - 10);
         const blockHeight = (lines.length * 4) + 10;
         
         doc.rect(margin, yPos, contentWidth, blockHeight, 'F');
         doc.text(lines, margin + 5, yPos + 7);
      }

      doc.save(`${report.projectName}_CodeGuard_Report.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
      alert("Failed to generate PDF. Please check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-surfaceHighlight pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase border border-accent/20">Audit Successful</span>
               <span className="text-xs text-muted font-mono">{new Date(report.timestamp).toLocaleString()}</span>
           </div>
           <h2 className="text-3xl font-bold text-white mb-2">{report.projectName}</h2>
           <p className="text-muted text-sm max-w-2xl leading-relaxed">{report.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-surface hover:bg-surfaceHighlight border border-surfaceHighlight text-white text-sm rounded-lg transition-colors"
          >
            New Scan
          </button>
          <button 
            onClick={generatePDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-background font-bold text-sm rounded-lg transition-colors shadow-[0_0_15px_rgba(0,229,255,0.3)] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
         <ScoreCard label="Files Scanned" value={report.totalFilesScanned.toString()} color="text-white" icon={Code} />
         <ScoreCard label="Hotspots" value={report.highRiskHotspots.length.toString()} color="text-danger" icon={ShieldAlert} />
         <ScoreCard label="Bottlenecks" value={report.bottlenecks.length.toString()} color="text-yellow-400" icon={Zap} />
         <ScoreCard label="Health Score" value={`${healthScore}%`} color={healthScore > 80 ? "text-accent" : healthScore > 50 ? "text-yellow-400" : "text-danger"} icon={CheckCircle} />
      </div>

      {/* Tabs */}
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-md py-4 mb-6 border-b border-surfaceHighlight/50">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]' 
                  : 'text-muted hover:text-white hover:bg-surfaceHighlight'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: High Risk Items */}
        <div className="space-y-6 lg:col-span-1">
          <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <ShieldAlert className="w-5 h-5 text-danger" />
                   Critical Hotspots
                </h3>
                <span className="text-xs bg-surfaceHighlight text-muted px-2 py-1 rounded-full">{filteredHotspots.length}</span>
            </div>
            
            <div className="space-y-4">
               {filteredHotspots.length > 0 ? (
                 filteredHotspots.map((h, i) => <RiskItem key={i} item={h} />)
               ) : (
                 <div className="p-8 bg-surfaceHighlight/10 border border-surfaceHighlight rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-3" />
                    <p className="text-sm text-gray-300">No critical {activeTab !== 'All' ? activeTab.toLowerCase() : ''} hotspots found.</p>
                 </div>
               )}
            </div>
          </section>

          {activeTab === 'All' && (
             <section className="bg-surface border border-surfaceHighlight rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  System Observations
                </h3>
                <ul className="space-y-3">
                    {report.architecturalObservations.map((obs, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                            {obs}
                        </li>
                    ))}
                </ul>
             </section>
          )}
        </div>

        {/* Right Column: Bottlenecks & Code */}
        <div className="lg:col-span-2 space-y-8">
            
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Performance Bottlenecks
                    </h3>
                    <span className="text-xs bg-surfaceHighlight text-muted px-2 py-1 rounded-full">{filteredBottlenecks.length}</span>
                </div>
                <div className="space-y-4">
                    {filteredBottlenecks.length > 0 ? (
                        filteredBottlenecks.map((b, i) => <BottleneckItem key={i} item={b} />)
                    ) : (
                        <div className="p-12 bg-surfaceHighlight/10 border border-surfaceHighlight rounded-xl text-center">
                             <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-4" />
                             <p className="text-base text-gray-300">Performance is looking good!</p>
                             <p className="text-sm text-muted">No major bottlenecks detected in {activeTab} components.</p>
                        </div>
                    )}
                </div>
            </section>

            {activeTab === 'All' && (
              <section className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-accent" />
                    <h3 className="text-xl font-bold text-white">Recommended Refactor</h3>
                 </div>
                 
                 <div className="bg-[#0d0d12] rounded-xl border border-surfaceHighlight overflow-hidden shadow-2xl">
                    <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                         <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                         </div>
                         <span className="text-[10px] font-mono text-muted uppercase">Gemini 2.5 Optimization</span>
                    </div>
                    <div className="p-6 overflow-x-auto custom-scrollbar">
                         <pre className="font-mono text-sm text-gray-300 leading-relaxed">
                            <code>{report.optimizedCodeExample}</code>
                         </pre>
                    </div>
                 </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
