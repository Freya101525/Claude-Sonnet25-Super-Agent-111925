import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgentConfig, ModelProvider } from "../types";

// Initialize the client with dynamic key support
const getAiClient = (apiKey?: string) => {
    const key = apiKey || process.env.API_KEY || ''; 
    if (!key) {
        throw new Error("API Key is required. Please configure it in Settings.");
    }
    return new GoogleGenAI({ apiKey: key });
};

export const calculateEstimatedCost = (model: string, inputTokens: number, outputTokens: number): number => {
    // Simplified pricing model (per 1M tokens)
    // Rates are illustrative based on public pricing ~2024/2025
    const rates: Record<string, { input: number; output: number }> = {
        'gemini-2.5-flash': { input: 0.10, output: 0.40 },
        'gemini-2.5-pro': { input: 2.50, output: 10.00 },
        'gpt-4o': { input: 5.00, output: 15.00 }, // For comparison logic
        'claude-3.5-sonnet': { input: 3.00, output: 15.00 }
    };

    const rate = rates[model] || rates['gemini-2.5-flash'];
    const cost = (inputTokens / 1000000 * rate.input) + (outputTokens / 1000000 * rate.output);
    return cost;
};

export const executeAgent = async (
    agent: AgentConfig,
    contextText: string,
    visualContext?: string, // Base64 image for vision capabilities
    apiKey?: string
): Promise<{ text: string; tokens: number }> => {
    // Simulate Fallback Logic
    // If provider is NOT Gemini, we simulate a failure and switch to Gemini (since we only have Gemini SDK here)
    if (agent.provider !== ModelProvider.GEMINI && agent.fallbackEnabled) {
        console.log(`Primary provider ${agent.provider} failed (simulated). Switching to Gemini fallback.`);
        // We implicitly continue to use Gemini below as the fallback
    }

    try {
        const ai = getAiClient(apiKey);
        const parts: any[] = [{ text: `${agent.promptTemplate}\n\nContext:\n${contextText}` }];
        
        if (visualContext) {
             // Strip prefix if present for API
             const base64Data = visualContext.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
             parts.unshift({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg'
                }
             });
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Enforce working model for demo
            contents: {
                parts: parts
            },
            config: {
                temperature: agent.temperature,
                maxOutputTokens: 2048, // Reasonable default
            }
        });

        const text = response.text || "No output generated.";
        // Estimate tokens roughly (1 token ~= 4 chars) for cost calc since raw usage metadata isn't always consistent in mock envs
        const totalTokens = (contextText.length + text.length) / 4;

        return { text, tokens: Math.floor(totalTokens) };

    } catch (error) {
        console.error("Agent execution failed", error);
        const msg = (error as Error).message;
        if (msg.includes("API Key")) {
            throw error; // Re-throw API key errors to be handled by UI
        }
        return { text: `Error executing agent ${agent.name}: ${msg}`, tokens: 0 };
    }
};

// Helper to "OCR" a page using Vision model
export const extractTextFromImage = async (imageDataUrl: string, apiKey?: string): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        const base64Data = imageDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: "Transcribe all visible text in this document page exactly as it appears. Return only the text." }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.warn("OCR Failed", e);
        if ((e as Error).message.includes("API Key")) {
            throw e;
        }
        return "[OCR Failed - Could not extract text]";
    }
}

export const optimizeNotes = async (rawNotes: string, apiKey?: string): Promise<string> => {
    if (!rawNotes.trim()) return rawNotes;
    
    try {
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: `You are an expert editor and technical writer. Reformat the following raw notes into a clean, well-structured Markdown document. 
                
                Directives:
                1. Use proper Markdown headers (#, ##) for sections.
                2. Use bullet points for lists.
                3. Bold key terms or numbers.
                4. Fix any typos or grammar issues.
                5. Keep the content concise but do not lose any information.
                
                Raw Notes:
                ${rawNotes}` }]
            }
        });
        return response.text || rawNotes;
    } catch (error) {
        console.error("Note optimization failed", error);
        throw error; // Let UI handle specific error reporting
    }
};