import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool.js';
import { runAgent, runAgentStream } from '../agent/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Tất cả chat routes cần auth
router.use(authenticate);

/**
 * GET /api/conversations
 * Danh sách conversations, mới nhất trước.
 */
router.get('/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching conversations:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Lấy messages của 1 conversation.
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat
 * Body: { message, conversationId? }
 * Response: SSE stream
 */
router.post('/chat', async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Setup SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  try {
    // 1. Tạo hoặc lấy conversation
    let convId = conversationId;
    if (!convId) {
      const title = message.slice(0, 60) + (message.length > 60 ? '...' : '');
      const { rows } = await pool.query(
        'INSERT INTO conversations (id, title) VALUES ($1, $2) RETURNING id',
        [uuidv4(), title]
      );
      convId = rows[0].id;
      // Gửi conversationId cho client
      res.write(`data: ${JSON.stringify({ type: 'conversation', conversationId: convId })}\n\n`);
    }

    // 2. Lưu user message
    await pool.query(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES ($1, $2, $3, $4)',
      [uuidv4(), convId, 'user', message]
    );

    // 3. Lấy chat history
    const { rows: history } = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [convId]
    );
    // Bỏ message cuối (vừa insert) vì sẽ truyền qua userMessage
    const previousMessages = history.slice(0, -1);

    // 4. Chạy agent với streaming
    const result = await runAgentStream(message, previousMessages, (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
    });

    // 5. Gửi function calls info (nếu có)
    if (result.functionCalls.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'functionCalls', calls: result.functionCalls })}\n\n`);
    }

    // 6. Lưu assistant message
    await pool.query(
      'INSERT INTO messages (id, conversation_id, role, content, function_calls) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), convId, 'model', result.text, JSON.stringify(result.functionCalls)]
    );

    // 7. Cập nhật conversation timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [convId]
    );

    // 8. Gửi done event
    res.write(`data: ${JSON.stringify({ type: 'done', text: result.text })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * DELETE /api/conversations/:id
 * Xóa conversation + cascade messages.
 */
router.delete('/conversations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting conversation:', err.message);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
