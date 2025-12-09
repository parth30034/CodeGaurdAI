import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileContent, AnalysisReport } from '../types';
import { MAX_TOTAL_CONTEXT_CHARS } from '../constants';

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are CodeGuard AI, a world-class senior software architect and security auditor. 
Your job is to perform a deep static analysis of the provided codebase.
Focus on:
1. Performance bottlenecks (Big O complexity, memory leaks, unoptimized I/O).
2. High-risk hotspots (complex functions, security vulnerabilities, fragile logic).
3. Anti-patterns (DRY violations, tight coupling, magic numbers, poor error handling).
4. Architectural observations (module boundaries, dependency issues).

Provide a concrete optimized code example for the most critical issue found.
Return the response in strict JSON format.
`;

export const analyzeCodebase = async (files: FileContent[], projectName: string): Promise<AnalysisReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare context - truncate if too large
  let totalChars = 0;
  const contextParts = [];
  
  contextParts.push(`Project Name: ${projectName}\n\nFiles:\n`);

  for (const file of files) {
    // Basic heuristic: prioritize smaller/medium files, maybe skip huge generated ones if over limit
    // For this demo, we just append until limit.
    const fileHeader = `\n--- FILE: ${file.path} ---\n`;
    if (totalChars + fileHeader.length + file.content.length > MAX_TOTAL_CONTEXT_CHARS) {
        contextParts.push(`\n[...Warning: Context limit reached, remaining files omitted...]\n`);
        break;
    }
    contextParts.push(fileHeader);
    contextParts.push(file.content);
    totalChars += fileHeader.length + file.content.length;
  }

  const prompt = `
    Analyze the codebase provided above. 
    Perform the standard CodeGuard AI Audit:
    1. Identify High-Risk Hotspots.
    2. Identify Bottlenecks.
    3. List Anti-Patterns.
    4. Provide Architectural Observations.
    5. Write an Optimized Code Example for the most critical section.
    6. Write a short executive summary.
  `;

  const schema: Schema = {
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
          },
          required: ["file", "issue", "impact"],
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
          },
          required: ["location", "pattern", "reason", "suggestion"],
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
        description: "A code snippet showing the fixed version of the worst offender.",
      },
      summary: {
        type: Type.STRING,
      }
    },
    required: ["highRiskHotspots", "bottlenecks", "antiPatterns", "architecturalObservations", "optimizedCodeExample", "summary"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: contextParts.join('') },
        { text: prompt }
      ],
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temp for analytical precision
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText);

    return {
      projectName,
      totalFilesScanned: files.length,
      timestamp: new Date().toISOString(),
      ...result
    };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
