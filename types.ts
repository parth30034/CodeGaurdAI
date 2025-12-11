
export type Category = 'Frontend' | 'Backend' | 'Mixed' | 'Infrastructure' | 'General';
export type ModuleType = 'architecture' | 'impact' | 'cost' | 'security';

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

// --- MODULE SPECIFIC REPORT TYPES ---

export interface ArchitectureReport {
  module: 'architecture';
  healthScore: number;
  dimensionScores: {
    reliability: number;
    scalability: number;
    maintainability: number;
    security: number;
    performance: number;
  };
  topIssues: {
    title: string;
    severity: 'Critical' | 'High' | 'Medium';
    description: string;
  }[];
  recommendations: string[];
  quickWins: string[];
  summary: string;
}

export interface ImpactReport {
  module: 'impact';
  targetSymbol: string;
  directDependencies: string[];
  indirectDependencies: string[];
  blastRadius: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedFlows: string[];
  refactorPlan: string[];
  requiredTests: string[];
  summary: string;
}

export interface CostReport {
  module: 'cost';
  estimatedMonthlyWaste: string;
  topSavings: {
    item: string;
    savings: string;
    risk: 'High' | 'Medium' | 'Low';
  }[];
  resourceTable: {
    resource: string;
    usage: string;
    inefficiency: string;
  }[];
  implementationRisk: string;
  summary: string;
}

export interface SecurityReport {
  module: 'security';
  vulnerabilities: {
    id: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    file: string;
    evidence: string;
    remediation: string;
  }[];
  secretsFound: string[];
  hardeningChecklist: string[];
  summary: string;
}

// Union type for the main app
export type AnalysisReport = {
  projectName: string;
  totalFilesScanned: number;
  timestamp: string;
} & (ArchitectureReport | ImpactReport | CostReport | SecurityReport);

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_FILES = 'PROCESSING_FILES',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
