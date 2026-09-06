import { GoogleGenAI } from "@google/genai";
import type { IndexEntry } from "./search";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let clientSingleton: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!clientSingleton) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    clientSingleton = new GoogleGenAI({ apiKey });
  }
  return clientSingleton;
}

export async function generateAnswer(question: string, chunks: IndexEntry[]): Promise<string> {
  if (chunks.length === 0) {
    return "I couldn't find anything in the policy documents that relates to this. Try rephrasing, or check with HR/your manager directly.";
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.fileName}, page ${c.pageNumber}]\n${c.text}`
    )
    .join("\n\n");

  const prompt = [
    "You are an internal company policy assistant.",
    "Answer the question ONLY using the excerpts below — do not add outside",
    "knowledge or general assumptions. Every claim must be traceable to one",
    "of these excerpts. Refer to sources by their file name and page number",
    "inline where relevant, e.g. \"(Leave Policy.pdf, p.4)\".",
    "If the excerpts don't actually answer the question, say so plainly",
    "instead of guessing.",
    "Keep the answer concise, direct, and easy to skim.",
    "",
    "--- Policy excerpts ---",
    context,
    "--- End of excerpts ---",
    "",
    `Question: ${question}`,
  ].join("\n");

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text?.trim() || "Something went wrong generating an answer — try again.";
}
