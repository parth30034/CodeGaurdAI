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
  
  console.log(`✨ Composed ${systemInstruction.length} char system instruction with ${projectProfile.detectedModules.length} modules`);

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
  // PHASE 6: Execute Analysis with Gemini
  // ===================================================================
  console.log('🤖 Sending to Gemini 2.5 Flash for analysis...');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: contextParts.join('') },
        { text: prompt }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for analytical precision
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText);

    console.log('✅ Analysis complete!');
    console.log(`Found: ${result.highRiskHotspots?.length || 0} hotspots, ${result.bottlenecks?.length || 0} bottlenecks`);

    return {
      projectName,
      totalFilesScanned: files.length,
      timestamp: new Date().toISOString(),
      ...result
    };
  } catch (error) {
    console.error("❌ Gemini Analysis Failed:", error);
    throw error;
  }
};

/**
 * Prioritize files for analysis based on project type
 * Ensures most important files are analyzed first within token limits
 */
function prioritizeFiles(files: FileContent[], profile: ProjectProfile): FileContent[] {
  const prioritized = [...files];

  // Define priority patterns based on detected modules
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

  // Sort files: high priority first, then by size (smaller first for more coverage)
  prioritized.sort((a, b) => {
    const aHighPriority = highPriorityPatterns.some(p => p.test(a.path));
    const bHighPriority = highPriorityPatterns.some(p => p.test(b.path));
    
    if (aHighPriority && !bHighPriority) return -1;
    if (!aHighPriority && bHighPriority) return 1;
    
    // Both same priority, prefer smaller files for better coverage
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
    parts.push(`"${customInstructions}"\n\n`);
    parts.push(`⚠️ Address these user instructions FIRST and ensure they appear in your findings.\n\n`);
  }

  parts.push(`## STANDARD CODEGUARD AI AUDIT\n`);
  parts.push(`Perform comprehensive analysis across these ${profile.detectedModules.length} detected areas:\n`);
  
  profile.detectedModules.forEach((module, idx) => {
    parts.push(`${idx + 1}. ${module.name} (Priority: ${module.priority}/10)\n`);
  });

  parts.push(`\n## ANALYSIS DEPTH: ${profile.estimatedAnalysisDepth.toUpperCase()}\n`);
  
  if (profile.estimatedAnalysisDepth === 'deep') {
    parts.push(`- This is a ${profile.complexity} ${profile.architecture} project with ${profile.totalFiles} files\n`);
    parts.push(`- Perform THOROUGH analysis with detailed reasoning\n`);
    parts.push(`- Include architectural observations about system design\n`);
    parts.push(`- Provide specific quantified metrics for all issues\n`);
  } else if (profile.estimatedAnalysisDepth === 'standard') {
    parts.push(`- Focus on high and critical severity issues\n`);
    parts.push(`- Provide concrete examples for top 3-5 issues\n`);
    parts.push(`- Include key architectural observations\n`);
  } else {
    parts.push(`- Prioritize CRITICAL issues only\n`);
    parts.push(`- Keep findings concise and actionable\n`);
    parts.push(`- Focus on quick wins\n`);
  }

  parts.push(`\n## REQUIRED OUTPUT\n`);
  parts.push(`1. High-Risk Hotspots (security, complexity, fragility)\n`);
  parts.push(`2. Performance Bottlenecks (with quantified impact)\n`);
  parts.push(`3. Anti-Patterns (code quality issues)\n`);
  parts.push(`4. Architectural Observations (system design)\n`);
  parts.push(`5. Optimized Code Example (for most critical issue)\n`);
  parts.push(`6. Executive Summary (2-3 sentences)\n`);
  parts.push(`\n**Return STRICT JSON only, no additional commentary.**\n`);

  return parts.join('');
}

/**
 * Build enhanced JSON schema with quantifiable metrics
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
            file: { 
              type: Type.STRING,
              description: "Exact file path"
            },
            issue: { 
              type: Type.STRING,
              description: "Concise issue description"
            },
            impact: { 
              type: Type.STRING,
              description: "Quantified business/technical impact"
            },
          },
          required: ["file", "issue", "impact"],
        },
        description: "Critical security, complexity, or reliability issues"
      },
      bottlenecks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            location: { 
              type: Type.STRING,
              description: "File:line or function name"
            },
            pattern: { 
              type: Type.STRING,
              description: "Performance anti-pattern identified"
            },
            reason: { 
              type: Type.STRING,
              description: "Why this is slow (O notation, I/O, etc)"
            },
            suggestion: { 
              type: Type.STRING,
              description: "Specific optimization with expected improvement"
            },
          },
          required: ["location", "pattern", "reason", "suggestion"],
        },
        description: "Performance issues with quantified impact"
      },
      antiPatterns: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Code quality issues and architectural smells"
      },
      architecturalObservations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "System design insights and recommendations"
      },
      optimizedCodeExample: {
        type: Type.STRING,
        description: "Working code fix for the most critical issue with comments explaining the optimization"
      },
      summary: {
        type: Type.STRING,
        description: "Executive summary: what's the biggest problem and impact?"
      }
    },
    required: ["highRiskHotspots", "bottlenecks", "antiPatterns", "architecturalObservations", "optimizedCodeExample", "summary"],
  };
}
