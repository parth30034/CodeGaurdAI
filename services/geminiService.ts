
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileContent, AnalysisReport } from '../types';
import { MAX_TOTAL_CONTEXT_CHARS } from '../constants';
import { analyzeProject, composeSystemInstruction, ProjectProfile } from './promptLibrary';

/**
 * Enhanced CodeGuard AI Analysis with Runtime Module Detection
 * Automatically detects project complexity and applies specialized prompts
 */
export const analyzeCodebase = async (files: FileContent[], projectName: string, instructions?: string): Promise<AnalysisReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // ===================================================================
  // PHASE 1: Project Analysis & Module Detection
  // ===================================================================
  console.log('🔍 Analyzing project structure...');
  const projectProfile: ProjectProfile = analyzeProject(files);
  
  console.log('📊 Project Profile:', {
    complexity: projectProfile.complexity,
    totalFiles: projectProfile.totalFiles,
    primaryLanguage: projectProfile.primaryLanguage,
    architecture: projectProfile.architecture,
    detectedModules: projectProfile.detectedModules.map(m => m.name),
    analysisDepth: projectProfile.estimatedAnalysisDepth
  });

  // ===================================================================
  // PHASE 2: Dynamic Prompt Composition
  // ===================================================================
  const systemInstruction = composeSystemInstruction(projectProfile);
  
  // ===================================================================
  // PHASE 3: Context Preparation with Smart Truncation
  // ===================================================================
  let totalChars = 0;
  const contextParts: string[] = [];
  
  contextParts.push(`# PROJECT ANALYSIS REQUEST\n`);
  contextParts.push(`Project: ${projectName}\n`);
  contextParts.push(`Complexity: ${projectProfile.complexity}\n`);
  contextParts.push(`Architecture: ${projectProfile.architecture}\n`);
  contextParts.push(`Primary Language: ${projectProfile.primaryLanguage}\n`);
  contextParts.push(`Total Files: ${projectProfile.totalFiles}\n\n`);
  contextParts.push(`Detected Analysis Modules:\n`);
  projectProfile.detectedModules.forEach(m => {
    contextParts.push(`- ${m.name} (Priority: ${m.priority})\n`);
  });
  contextParts.push(`\n# CODEBASE FILES\n\n`);

  // Prioritize files for analysis based on project type
  const prioritizedFiles = prioritizeFiles(files, projectProfile);

  for (const file of prioritizedFiles) {
    const fileHeader = `\n--- FILE: ${file.path} (${file.size} bytes) ---\n`;
    
    if (totalChars + fileHeader.length + file.content.length > MAX_TOTAL_CONTEXT_CHARS) {
      contextParts.push(`\n[...Context limit reached. ${files.length - prioritizedFiles.indexOf(file)} files omitted...]\n`);
      break;
    }
    
    contextParts.push(fileHeader);
    contextParts.push(file.content);
    totalChars += fileHeader.length + file.content.length;
  }

  // ===================================================================
  // PHASE 4: Build Analysis Prompt
  // ===================================================================
  const prompt = buildAnalysisPrompt(projectProfile, instructions);

  // ===================================================================
  // PHASE 5: Enhanced JSON Schema with Quantifiable Metrics
  // ===================================================================
  const schema: Schema = buildEnhancedSchema(projectProfile);

  // ===================================================================
  // PHASE 6: Execute Analysis with Gemini (with Quality Validation)
  // ===================================================================
  console.log('🤖 Sending to Gemini 2.5 Flash for analysis...');
  
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add quality requirements to prompt on retry
      const finalPrompt = attempt > 1 
        ? enhancePromptForQuality(prompt, attempt)
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: contextParts.join('') },
          { text: finalPrompt }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: attempt > 1 ? 0.1 : 0.2, // Lower temp on retry for precision
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response from AI");

      const result = JSON.parse(jsonText);
      
      const rawReport: AnalysisReport = {
        projectName,
        totalFilesScanned: files.length,
        timestamp: new Date().toISOString(),
        ...result
      };

      // Basic validation for categorization
      if (rawReport.highRiskHotspots.length > 0 && !rawReport.highRiskHotspots[0].category) {
        // Fallback if AI forgot category despite schema
        rawReport.highRiskHotspots.forEach(h => h.category = 'General');
        rawReport.bottlenecks.forEach(b => b.category = 'General');
      }

      return rawReport;
      
    } catch (error) {
      console.error(`❌ Analysis attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      }
    }
  }
  
  // All retries failed
  console.error("❌ Gemini Analysis Failed after all retries");
  throw lastError || new Error("Analysis failed");
};

/**
 * Enhance prompt with quality requirements on retry
 */
function enhancePromptForQuality(originalPrompt: string, attempt: number): string {
  const qualityReminders = `

## ⚠️  QUALITY REQUIREMENTS (Retry Attempt ${attempt})

**CRITICAL - Your previous response had quality issues. Follow these STRICTLY:**

1. **CATEGORIZATION IS MANDATORY:**
   - You MUST categorize every finding as "Frontend", "Backend", "Mixed", or "Infrastructure".
   - Do not use "General" unless absolutely necessary.

2. **QUANTIFICATION IS MANDATORY:**
   - Every hotspot impact MUST include numbers: "2.5s", "$2,040/year", "47 re-renders", "55x faster"
   - Every bottleneck reason MUST include complexity: "O(n²)", "1+N queries", "500ms per request"

3. **SPECIFICITY IS REQUIRED:**
   - Locations MUST be exact: "routes/users.ts:45"
   - Pattern names MUST be technical: "N+1 Query Problem"

**Now retry the analysis with these quality standards.**
`;

  return originalPrompt + qualityReminders;
}

/**
 * Prioritize files for analysis based on project type
 */
function prioritizeFiles(files: FileContent[], profile: ProjectProfile): FileContent[] {
  const prioritized = [...files];

  const highPriorityPatterns: RegExp[] = [];
  
  if (profile.detectedModules.some(m => m.id === 'backend_api')) {
    highPriorityPatterns.push(/routes|controllers|api/i);
  }
  if (profile.detectedModules.some(m => m.id === 'backend_database')) {
    highPriorityPatterns.push(/models|repositories|schema|prisma/i);
  }
  if (profile.detectedModules.some(m => m.id === 'backend_security')) {
    highPriorityPatterns.push(/auth|security|middleware/i);
  }
  if (profile.detectedModules.some(m => m.id === 'frontend_react')) {
    highPriorityPatterns.push(/components|pages|app\.tsx|index\.tsx/i);
  }
  if (profile.detectedModules.some(m => m.id === 'frontend_state')) {
    highPriorityPatterns.push(/store|state|context|redux|zustand/i);
  }

  prioritized.sort((a, b) => {
    const aHighPriority = highPriorityPatterns.some(p => p.test(a.path));
    const bHighPriority = highPriorityPatterns.some(p => p.test(b.path));
    
    if (aHighPriority && !bHighPriority) return -1;
    if (!aHighPriority && bHighPriority) return 1;
    return a.size - b.size;
  });

  return prioritized;
}

/**
 * Build analysis prompt with module-specific focus areas
 */
function buildAnalysisPrompt(profile: ProjectProfile, customInstructions?: string): string {
  const parts: string[] = [];

  parts.push(`# ANALYSIS REQUEST\n\n`);
  
  if (customInstructions) {
    parts.push(`## USER-SPECIFIC INSTRUCTIONS (HIGHEST PRIORITY)\n`);
    parts.push(`The user has provided the following context/instructions. Ensure your analysis addresses these points explicitly:\n`);
    parts.push(`"${customInstructions}"\n\n`);
    parts.push(`⚠️ Address these user instructions FIRST and ensure they appear in your findings.\n\n`);
  }

  parts.push(`## STANDARD CODEGUARD AI AUDIT\n`);
  parts.push(`Perform comprehensive analysis across these ${profile.detectedModules.length} detected areas:\n`);
  
  profile.detectedModules.forEach((module, idx) => {
    parts.push(`${idx + 1}. ${module.name} (Priority: ${module.priority}/10)\n`);
  });

  parts.push(`\n## ANALYSIS DEPTH: ${profile.estimatedAnalysisDepth.toUpperCase()}\n`);
  
  parts.push(`\n## REQUIRED OUTPUT\n`);
  parts.push(`1. High-Risk Hotspots (security, complexity, fragility)\n`);
  parts.push(`2. Performance Bottlenecks (with quantified impact)\n`);
  parts.push(`3. Anti-Patterns (code quality issues)\n`);
  parts.push(`4. Architectural Observations (system design)\n`);
  parts.push(`5. Optimized Code Example (for most critical issue)\n`);
  parts.push(`6. Executive Summary (2-3 sentences)\n`);
  parts.push(`\n**IMPORTANT: Categorize each finding as "Frontend", "Backend", "Mixed", or "Infrastructure".**\n`);
  parts.push(`\n**Return STRICT JSON only, no additional commentary.**\n`);

  return parts.join('');
}

/**
 * Build enhanced JSON schema with quantifiable metrics and categorization
 */
function buildEnhancedSchema(profile: ProjectProfile): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      highRiskHotspots: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            file: { type: Type.STRING },
            issue: { type: Type.STRING },
            impact: { type: Type.STRING },
            category: { 
              type: Type.STRING, 
              enum: ["Frontend", "Backend", "Mixed", "Infrastructure", "General"],
              description: "The architectural layer this issue belongs to."
            },
          },
          required: ["file", "issue", "impact", "category"],
        },
      },
      bottlenecks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            pattern: { type: Type.STRING },
            reason: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            category: { 
              type: Type.STRING, 
              enum: ["Frontend", "Backend", "Mixed", "Infrastructure", "General"],
              description: "The architectural layer this issue belongs to."
            },
          },
          required: ["location", "pattern", "reason", "suggestion", "category"],
        },
      },
      antiPatterns: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      architecturalObservations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      optimizedCodeExample: {
        type: Type.STRING,
      },
      summary: {
        type: Type.STRING,
      }
    },
    required: ["highRiskHotspots", "bottlenecks", "antiPatterns", "architecturalObservations", "optimizedCodeExample", "summary"],
  };
}
