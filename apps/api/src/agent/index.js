// Agent loop — Gemini + function calling
// Handle loop: send message → receive response → if functionCall → execute → resend

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "./prompt.js";
import { declarations, executeTool } from "../tools/index.js";

const MAX_FUNCTION_CALLS = 5; // Limit function calling loop iterations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Retry wrapper — automatically retry on 503/429 errors.
 */
async function withRetry(fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.message?.match(/\[(\d{3})/)?.[1];
      if ((status === "503" || status === "429") && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(
          `⏳ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms (${status})...`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Create Gemini model instance with function calling config.
 */
function createModel() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: declarations }],
  });
}

/**
 * Convert chat history from DB format to Gemini format.
 * DB: { role: 'user'|'model', content: string }
 * Gemini: { role: 'user'|'model', parts: [{ text: string }] }
 */
export function toGeminiHistory(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "model")
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.content || "" }],
    }));
}

/**
 * Run agent loop: send message + handle repeated function calling.
 *
 * @param {string} userMessage - User question
 * @param {Array} history - Chat history (DB format)
 * @returns {Promise<{ text: string, functionCalls: Array }>}
 */
export async function runAgent(userMessage, history = []) {
  const model = createModel();
  const geminiHistory = toGeminiHistory(history);

  const chat = model.startChat({ history: geminiHistory });

  let response = await withRetry(() => chat.sendMessage(userMessage));
  let result = response.response;
  const allFunctionCalls = [];

  // Agent loop — loop when Gemini requests function call
  for (let i = 0; i < MAX_FUNCTION_CALLS; i++) {
    const candidate = result.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallParts = parts.filter((p) => p.functionCall);

    if (functionCallParts.length === 0) {
      break;
    }

    const functionResponses = [];

    for (const part of functionCallParts) {
      const { name, args } = part.functionCall;
      allFunctionCalls.push({ name, args });

      try {
        const toolResult = await executeTool(name, args);
        functionResponses.push({
          functionResponse: {
            name,
            response: { result: toolResult },
          },
        });
      } catch (err) {
        console.error(`❌ Tool ${name} failed:`, err.message);
        functionResponses.push({
          functionResponse: {
            name,
            response: { error: err.message },
          },
        });
      }
    }

    response = await withRetry(() => chat.sendMessage(functionResponses));
    result = response.response;
  }

  const text =
    result.candidates?.[0]?.content?.parts
      ?.filter((p) => p.text)
      ?.map((p) => p.text)
      ?.join("") || "";

  return {
    text,
    functionCalls: allFunctionCalls,
  };
}

/**
 * Run agent with streaming response.
 * Used for SSE endpoint — call callback on each chunk.
 *
 * @param {string} userMessage
 * @param {Array} history
 * @param {function} onChunk - callback(text) for each chunk
 * @returns {Promise<{ text: string, functionCalls: Array }>}
 */
export async function runAgentStream(userMessage, history = [], onChunk) {
  const model = createModel();
  const geminiHistory = toGeminiHistory(history);

  const chat = model.startChat({ history: geminiHistory });

  // Step 1: send non-streaming message to check function calls
  let response = await withRetry(() => chat.sendMessage(userMessage));
  let result = response.response;
  const allFunctionCalls = [];

  // Agent loop — handle function calls
  for (let i = 0; i < MAX_FUNCTION_CALLS; i++) {
    const candidate = result.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCallParts = parts.filter((p) => p.functionCall);

    if (functionCallParts.length === 0) break;

    const functionResponses = [];
    for (const part of functionCallParts) {
      const { name, args } = part.functionCall;
      allFunctionCalls.push({ name, args });

      try {
        const toolResult = await executeTool(name, args);
        functionResponses.push({
          functionResponse: {
            name,
            response: { result: toolResult },
          },
        });
      } catch (err) {
        console.error(`❌ Tool ${name} failed:`, err.message);
        functionResponses.push({
          functionResponse: {
            name,
            response: { error: err.message },
          },
        });
      }
    }

    // Send function responses to Gemini
    response = await withRetry(() => chat.sendMessage(functionResponses));
    result = response.response;

    // If response still has function call, continue loop
    const nextParts = result.candidates?.[0]?.content?.parts || [];
    if (nextParts.some((p) => p.functionCall)) continue;

    const text = nextParts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join("");

    if (onChunk && text) {
      // Simulate streaming by splitting text into chunks
      const chunkSize = 20;
      for (let j = 0; j < text.length; j += chunkSize) {
        onChunk(text.slice(j, j + chunkSize));
      }
    }

    return { text, functionCalls: allFunctionCalls };
  }

  // Fallback: get text from final response (no function call case)
  const text =
    result.candidates?.[0]?.content?.parts
      ?.filter((p) => p.text)
      ?.map((p) => p.text)
      ?.join("") || "";

  if (onChunk && text) {
    const chunkSize = 20;
    for (let j = 0; j < text.length; j += chunkSize) {
      onChunk(text.slice(j, j + chunkSize));
    }
  }

  return { text, functionCalls: allFunctionCalls };
}
