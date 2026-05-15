import OpenAI from "openai";

export type ResolutionSuggestion = {
  outcomeYes: boolean;
  confidenceYesPct: number;
  deltaBps24h: number;
  signalStrength: 0 | 1 | 2;
  reasoning: string;
};

export async function suggestResolution(question: string): Promise<ResolutionSuggestion> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://darkpool.markets",
      "X-Title": "DarkPool Markets"
    }
  });

  const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const prompt = `You are an AI market resolver for a prediction market platform.

Given the following market question, determine the most likely outcome.

Market question: "${question}"

Consider:
1. Current real-world knowledge about the subject
2. Whether the outcome is objectively determinable
3. Your confidence level in the prediction

Respond with a JSON object:
{
  "outcomeYes": true/false,
  "confidenceYesPct": <number 0-10000 (basis points, e.g. 7500 = 75%)>,
  "deltaBps24h": <number, estimated 24h confidence change in bps>,
  "signalStrength": <0 (LOW) | 1 (MEDIUM) | 2 (HIGH)>,
  "reasoning": "<brief explanation of your reasoning>"
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("AI returned empty response");

  const parsed = JSON.parse(text) as ResolutionSuggestion;

  parsed.confidenceYesPct = Math.max(0, Math.min(10000, Math.round(parsed.confidenceYesPct)));
  parsed.deltaBps24h = Math.round(parsed.deltaBps24h);
  if (parsed.signalStrength < 0) parsed.signalStrength = 0;
  if (parsed.signalStrength > 2) parsed.signalStrength = 2;

  return parsed;
}
