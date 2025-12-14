/**
 * AI Chat Controller (Placeholder for Ollama Integration)
 * 
 * This controller provides an endpoint for the frontend AI Chat widget.
 * In production, it will call Ollama with context injection.
 * For now, it returns mock responses for testing.
 */

const fs = require('fs');
const path = require('path');

// Load context files (for future Ollama integration)
const CONTEXT_PATH = path.join(__dirname, '../../basic info');

const loadContext = () => {
    try {
        const identity = fs.readFileSync(path.join(CONTEXT_PATH, 'ai-identity.txt'), 'utf8');
        const rules = fs.readFileSync(path.join(CONTEXT_PATH, 'ai-rules.txt'), 'utf8');
        const glossary = fs.readFileSync(path.join(CONTEXT_PATH, 'glossary.json'), 'utf8');
        const schema = fs.readFileSync(path.join(CONTEXT_PATH, 'ai-schema.json'), 'utf8');
        return { identity, rules, glossary, schema };
    } catch (err) {
        console.error('Failed to load AI context:', err);
        return null;
    }
};

// Mock response generator (replace with Ollama call in production)
const generateMockResponse = (message) => {
    const lower = message.toLowerCase();

    if (lower.includes('ticket') || lower.includes('request')) {
        return 'To create a ticket, go to **Service Catalog** and select the service you need. Fill out the form and click Submit.';
    }
    if (lower.includes('approve') || lower.includes('approval')) {
        return 'Check your **Task List** page for pending approvals. You can Approve or Reject with comments.';
    }
    if (lower.includes('status') || lower.includes('track')) {
        return 'Visit **My Tickets** to see all your requests and their current status.';
    }
    if (lower.includes('help') || lower.includes('what can')) {
        return 'I can help you with: creating tickets, tracking requests, understanding approvals, and navigating the system. Just ask!';
    }
    if (lower.includes('hello') || lower.includes('hi')) {
        return 'Hello! I\'m HOTS Copilot. How can I assist you today?';
    }

    return 'I\'m still learning! For now, try visiting the **FAQ** section or contact IT Support directly.';
};

// POST /ai/chat
const chat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Load context (for logging/debugging, actual Ollama call is TODO)
        const context = loadContext();

        // For now, use mock response
        // TODO: Replace with Ollama API call:
        // const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     model: 'llama3',
        //     messages: [
        //       { role: 'system', content: context.identity + context.rules },
        //       { role: 'user', content: message }
        //     ]
        //   })
        // });

        const reply = generateMockResponse(message);

        return res.json({
            success: true,
            reply,
            context_loaded: !!context
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

module.exports = { chat };
