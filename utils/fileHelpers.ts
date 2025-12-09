import JSZip from 'jszip';
import { FileContent } from '../types';
import { SUPPORTED_EXTENSIONS, IGNORED_DIRS } from '../constants';

const isSupportedFile = (path: string): boolean => {
  const parts = path.split('.');
  if (parts.length < 2) return false;
  const ext = parts.pop()?.toLowerCase();
  
  // Check extension
  if (!ext || !SUPPORTED_EXTENSIONS.has(ext)) return false;

  // Check directories
  if (IGNORED_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`))) return false;

  return true;
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const processZipFile = async (file: File): Promise<FileContent[]> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const files: FileContent[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    // Cast to any to handle unknown type inference from Object.entries
    const entry = zipEntry as any;

    if (entry.dir || !isSupportedFile(relativePath)) continue;

    try {
      const content = await entry.async('string');
      files.push({
        path: relativePath,
        content,
        size: content.length
      });
    } catch (err) {
      console.warn(`Failed to read ${relativePath}`, err);
    }
  }

  return files;
};

// For webkitdirectory input
export const processFileList = async (fileList: FileList): Promise<FileContent[]> => {
  const files: FileContent[] = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // webkitRelativePath is available when webkitdirectory is used
    const path = file.webkitRelativePath || file.name;
    
    if (!isSupportedFile(path)) continue;

    try {
      const content = await readFileContent(file);
      files.push({
        path,
        content,
        size: content.length
      });
    } catch (err) {
      console.warn(`Failed to read ${path}`, err);
    }
  }
  return files;
};