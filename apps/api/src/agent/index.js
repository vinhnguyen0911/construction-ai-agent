// Agent loop — Gemini + function calling
// Xử lý vòng lặp: gửi message → nhận response → nếu có functionCall → execute → gửi lại

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_INSTRUCTION } from './prompt.js';
import { declarations, executeTool } from '../tools/index.js';

const MAX_FUNCTION_CALLS = 5; // Giới hạn vòng lặp function calling

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Tạo Gemini model instance với function calling config.
 */
function createModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: declarations }],
  });
}

/**
 * Chuyển đổi chat history từ DB format sang Gemini format.
 * DB: { role: 'user'|'model', content: string }
 * Gemini: { role: 'user'|'model', parts: [{ text: string }] }
 */
export function toGeminiHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'model')
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.content || '' }],
    }));
}

/**
 * Chạy agent loop: gửi message + xử lý function calling lặp lại.
 *
 * @param {string} userMessage - Câu hỏi của người dùng
 * @param {Array} history - Chat history (DB format)
 * @returns {Promise<{ text: string, functionCalls: Array }>}
 */
export async function runAgent(userMessage, history = []) {
  const model = createModel();
  const geminiHistory = toGeminiHistory(history);

  const chat = model.startChat({ history: geminiHistory });

  let response = await chat.sendMessage(userMessage);
  let result = response.response;
  const allFunctionCalls = [];

  // Agent loop — lặp khi Gemini yêu cầu function call
  for (let i = 0; i < MAX_FUNCTION_CALLS; i++) {
    const candidate = result.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Tìm function calls trong response
    const functionCallParts = parts.filter((p) => p.functionCall);

    if (functionCallParts.length === 0) {
      // Không có function call → trả về text response
      break;
    }

    // Execute từng function call
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

    // Gửi function responses về Gemini để nhận text response
    response = await chat.sendMessage(functionResponses);
    result = response.response;
  }

  // Lấy text từ response cuối cùng
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    ?.map((p) => p.text)
    ?.join('') || '';

  return {
    text,
    functionCalls: allFunctionCalls,
  };
}

/**
 * Chạy agent với streaming response.
 * Dùng cho SSE endpoint — gọi callback mỗi khi có chunk.
 *
 * @param {string} userMessage
 * @param {Array} history
 * @param {function} onChunk - callback(text) cho mỗi chunk
 * @returns {Promise<{ text: string, functionCalls: Array }>}
 */
export async function runAgentStream(userMessage, history = [], onChunk) {
  const model = createModel();
  const geminiHistory = toGeminiHistory(history);

  const chat = model.startChat({ history: geminiHistory });

  // Bước 1: gửi message không stream để check function calls
  let response = await chat.sendMessage(userMessage);
  let result = response.response;
  const allFunctionCalls = [];

  // Agent loop — xử lý function calls
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

    // Gửi function responses về Gemini
    response = await chat.sendMessage(functionResponses);
    result = response.response;

    // Nếu response vẫn có function call, tiếp tục loop
    const nextParts = result.candidates?.[0]?.content?.parts || [];
    if (nextParts.some((p) => p.functionCall)) continue;

    // Không còn function call → stream text response
    const text = nextParts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join('');

    if (onChunk && text) {
      // Simulate streaming bằng cách chia nhỏ text
      const chunkSize = 20;
      for (let j = 0; j < text.length; j += chunkSize) {
        onChunk(text.slice(j, j + chunkSize));
      }
    }

    return { text, functionCalls: allFunctionCalls };
  }

  // Fallback: lấy text từ response cuối (trường hợp không có function call)
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    ?.map((p) => p.text)
    ?.join('') || '';

  if (onChunk && text) {
    const chunkSize = 20;
    for (let j = 0; j < text.length; j += chunkSize) {
      onChunk(text.slice(j, j + chunkSize));
    }
  }

  return { text, functionCalls: allFunctionCalls };
}
