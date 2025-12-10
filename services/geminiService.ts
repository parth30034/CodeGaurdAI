import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileContent, AnalysisReport } from '../types';
import { MAX_TOTAL_CONTEXT_CHARS } from '../constants';

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are CodeGuard AI, a world-class senior software architect, frontend performance expert, and security auditor.
Your job is to perform deep static analysis of the provided project (often a full codebase).

Always:
- Base your findings only on the code and file headers you receive; do not invent files, APIs, or behavior.
- Prefer precise, concrete issues over generic advice.
- Return the response in strict JSON only, matching the given schema.

Primary focus for ALL projects:
1. Performance bottlenecks (Big-O complexity, N+1 queries, heavy loops, repeated I/O, unnecessary allocations).
2. High-risk hotspots (complex functions, security vulnerabilities, fragile or core logic with weak error handling).
3. Anti-patterns (duplication, tight coupling, magic numbers, poor error handling, inconsistent patterns).
4. Architectural observations (module boundaries, layering, dependency direction, cohesion).

When the codebase is a frontend app (React/Next.js, Vue, Angular, or plain JS/HTML/CSS):
- Frontend best practices: separation of concerns (UI vs state vs data fetching), semantic HTML, basic accessibility, reuse of shared components.
- Frontend performance: unnecessary re-renders, heavy work on render, inefficient list rendering, lack of memoization/virtualization, unoptimized assets.
- Frontend architecture: feature/domain-based structure, clear folder organization, separation of layout/pages/components/hooks/services.

For the single most critical issue you identify (highest impact or risk):
- Make sure it appears clearly in highRiskHotspots and/or bottlenecks.
- Provide a concrete optimized code example that could realistically replace or refactor the problematic section.

You must respond in strict JSON only, with no extra commentary, matching the provided schema exactly.
`;

export const analyzeCodebase = async (files: FileContent[], projectName: string, instructions?: string): Promise<AnalysisReport> => {
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
    ${instructions ? `\nUSER SPECIAL INSTRUCTIONS:\n"${instructions}"\n\nEnsure you address the user's instructions specifically in your analysis (e.g., in hotspots or bottlenecks if relevant).\n` : ''}

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