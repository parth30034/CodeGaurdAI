
export type Category = 'Frontend' | 'Backend' | 'Mixed' | 'Infrastructure' | 'General';

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

export interface Hotspot {
  file: string;
  issue: string;
  impact: string;
  category: Category;
}

export interface Bottleneck {
  location: string;
  pattern: string;
  reason: string;
  suggestion: string;
  category: Category;
}

export interface AnalysisReport {
  projectName: string;
  totalFilesScanned: number;
  timestamp: string;
  highRiskHotspots: Hotspot[];
  bottlenecks: Bottleneck[];
  antiPatterns: string[];
  architecturalObservations: string[];
  optimizedCodeExample: string;
  summary: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_FILES = 'PROCESSING_FILES',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
