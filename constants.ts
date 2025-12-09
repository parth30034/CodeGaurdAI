// Supported extensions for code analysis to avoid binary files
export const SUPPORTED_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 
  'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp', 
  'go', 'rs', 'swift', 'kt', 'kts', 'css', 'scss', 'html', 'sql', 'sh', 'yaml', 'yml'
]);

export const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'coverage',
  'venv',
  'bin',
  'obj',
  'target'
];

// Token limits rough estimation safe guard (chars)
export const MAX_TOTAL_CONTEXT_CHARS = 800000; 
