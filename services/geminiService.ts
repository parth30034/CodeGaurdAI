
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileContent, AnalysisReport, ModuleType } from '../types';
import { MAX_TOTAL_CONTEXT_CHARS } from '../constants';
import { getModulePrompt } from './promptLibrary';

/**
 * Multi-Module CodeGuard AI Analysis
 */
export const analyzeCodebase = async (
  files: FileContent[], 
  projectName: string, 
  module: ModuleType,
  instructions: string
): Promise<AnalysisReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Prepare Context (Files)
  let totalChars = 0;
  const contextParts: string[] = [];
  
  contextParts.push(`# ANALYSIS CONTEXT\n`);
  contextParts.push(`Project: ${projectName}\n`);
  contextParts.push(`Target Module: ${module.toUpperCase()}\n`);
  contextParts.push(`Total Files: ${files.length}\n\n`);
  contextParts.push(`## SOURCE CODE\n`);

  // Simple heuristic: prioritize larger files for architecture, specific patterns for others
  // For now, we take the top files that fit in context
  const sortedFiles = files.sort((a, b) => b.size - a.size); // Largest first usually contains core logic

  for (const file of sortedFiles) {
    const fileHeader = `\n--- FILE: ${file.path} ---\n`;
    
    if (totalChars + fileHeader.length + file.content.length > MAX_TOTAL_CONTEXT_CHARS) {
      contextParts.push(`\n[...Context limit reached. Remaining files omitted...]\n`);
      break;
    }
    
    contextParts.push(fileHeader);
    contextParts.push(file.content);
    totalChars += fileHeader.length + file.content.length;
  }

  // 2. Get Dynamic Prompt
  const systemInstruction = getModulePrompt(module, instructions);

  // 3. Get Dynamic Schema
  const schema = getModuleSchema(module);

  // 4. Call API
  console.log(`🤖 Sending to Gemini (${module})...`);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: contextParts.join('') }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText);
    
    // Construct final report
    const report: AnalysisReport = {
      projectName,
      totalFilesScanned: files.length,
      timestamp: new Date().toISOString(),
      module,
      ...result
    };

    return report;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Returns the strictly typed JSON schema for the selected module
 */
function getModuleSchema(module: ModuleType): Schema {
  const baseString = { type: Type.STRING };
  const baseNum = { type: Type.NUMBER };
  const baseArrStr = { type: Type.ARRAY, items: baseString };

  switch (module) {
    case 'architecture':
      return {
        type: Type.OBJECT,
        properties: {
          healthScore: baseNum,
          dimensionScores: {
            type: Type.OBJECT,
            properties: {
              reliability: baseNum,
              scalability: baseNum,
              maintainability: baseNum,
              security: baseNum,
              performance: baseNum
            },
            required: ["reliability", "scalability", "maintainability", "security", "performance"]
          },
          topIssues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: baseString,
                severity: { type: Type.STRING, enum: ["Critical", "High", "Medium"] },
                description: baseString
              },
              required: ["title", "severity", "description"]
            }
          },
          recommendations: baseArrStr,
          quickWins: baseArrStr,
          summary: baseString
        },
        required: ["healthScore", "dimensionScores", "topIssues", "recommendations", "quickWins", "summary"]
      };

    case 'impact':
      return {
        type: Type.OBJECT,
        properties: {
          targetSymbol: baseString,
          directDependencies: baseArrStr,
          indirectDependencies: baseArrStr,
          blastRadius: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
          affectedFlows: baseArrStr,
          refactorPlan: baseArrStr,
          requiredTests: baseArrStr,
          summary: baseString
        },
        required: ["targetSymbol", "directDependencies", "indirectDependencies", "blastRadius", "affectedFlows", "refactorPlan", "requiredTests", "summary"]
      };

    case 'cost':
      return {
        type: Type.OBJECT,
        properties: {
          estimatedMonthlyWaste: baseString,
          topSavings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: baseString,
                savings: baseString,
                risk: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
              },
              required: ["item", "savings", "risk"]
            }
          },
          resourceTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                resource: baseString,
                usage: baseString,
                inefficiency: baseString
              },
              required: ["resource", "usage", "inefficiency"]
            }
          },
          implementationRisk: baseString,
          summary: baseString
        },
        required: ["estimatedMonthlyWaste", "topSavings", "resourceTable", "implementationRisk", "summary"]
      };

    case 'security':
      return {
        type: Type.OBJECT,
        properties: {
          vulnerabilities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: baseString,
                severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                file: baseString,
                evidence: baseString,
                remediation: baseString
              },
              required: ["id", "severity", "file", "evidence", "remediation"]
            }
          },
          secretsFound: baseArrStr,
          hardeningChecklist: baseArrStr,
          summary: baseString
        },
        required: ["vulnerabilities", "secretsFound", "hardeningChecklist", "summary"]
      };
      
    default:
      throw new Error("Invalid module");
  }
}
