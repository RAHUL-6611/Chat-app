import Message from '../models/Message.js';
import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPEN_ROUTER,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Antigravity Support Agent",
    }
});

// List of free models to rotate between to mitigate rate limits
const FREE_MODELS = [
    'xiaomi/mimo-v2-flash:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'mistralai/devstral-2512:free',
    'arcee-ai/trinity-mini:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'google/gemini-flash-1.5-8b-exp:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free'
];

let modelIndex = 0;

// Simple in-memory cache for chat history
// In production, use Redis or a similar store
const chatCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY = 12; // Keep slightly more than we send for buffer

const getCachedHistory = async (chatId) => {
    const now = Date.now();
    if (chatCache.has(chatId)) {
        const cached = chatCache.get(chatId);
        if (now - cached.timestamp < CACHE_TTL) {
            return cached.messages;
        }
    }

    // Cache miss or expired
    const history = await Message.find({ chatId: chatId || 'default' })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY);
    
    const messages = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    chatCache.set(chatId, { messages, timestamp: now });
    return messages;
};

const updateCache = (chatId, newMessage) => {
    const cached = chatCache.get(chatId);
    let messages = cached ? cached.messages : [];
    
    messages.push({
        role: newMessage.role,
        content: newMessage.content
    });

    // Keep only last MAX_HISTORY
    if (messages.length > MAX_HISTORY) {
        messages = messages.slice(-MAX_HISTORY);
    }

    chatCache.set(chatId, { messages, timestamp: Date.now() });
};

const SYSTEM_PROMPT = {
    role: "system",
    content: `You are an "Ellavox AI Worker", a sophisticated Agentic AI designed to execute business outcomes, not just provide conversation.
    You represent Ellavox, the leader in operational intelligence for Logistics and Real Estate.
    
    CORE TECHNOLOGY:
    - COMPASS System: Your proprietary real-time monitoring and continuous optimization engine.
    - ASH System (Autonomous Self-Healing): Your background testing and verification system that ensures reliability at scale.
    
    SPECIALIZED DOMAINS:
    1. Logistics & Transportation (Dispatcher AI Worker):
       - Goal: Eliminate dispatch chaos, manage driver check-ins, and respond faster than competitors.
       - Focus: Scaling loads without increasing headcount and 24/7 communication coverage.
    2. Real Estate Operations (Leasing AI Worker):
       - Goal: Optimize occupancy, automate collections, and handle maintenance 24/7.
       - Focus: "No Lead Left Behind" policy, scheduling tours instantly, and maximizing cashflow via smart collections.
    
    GUIDELINES:
    - Speak as an "Ellavox AI Worker".
    - Focus on "Business Results" and "Actionable Outcomes".
    - Use technical terms like "COMPASS", "ASH", "Agentic AI", and "Operational Intelligence" where appropriate.
    - Maintain a tone that is highly efficient, professional, and results-oriented.
    - KEEP YOUR RESPONSES RELEVANT AND BELOW 150 WORDS AT ALL TIMES.
    - If asked who you are, state that you are an Ellavox AI Worker powered by the COMPASS and ASH systems.`
};

// Reusable logic for both HTTP and WebSocket
export const processMessageLogic = async ({ content, chatId, user, io }) => {
    const targetChatId = chatId || 'default';
    
    // 1. Get History from Cache (or DB if miss)
    const messageHistory = await getCachedHistory(targetChatId);

    // 2. Save User Message to DB
    const userMessage = await Message.create({
        sender: user._id,
        content,
        role: 'user',
        chatId: targetChatId
    });

    // Update Cache synchronously
    updateCache(targetChatId, userMessage);

    let fullAiResponse = '';
    let streamSuccessful = false;

    // 3. Start Streaming AI Response via OpenRouter (with 1 retry)
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
        const selectedModel = FREE_MODELS[modelIndex];
        console.log(`Attempt ${retryCount + 1}: Using model: ${selectedModel} (Context: ${messageHistory.length} turns)`);
        modelIndex = (modelIndex + 1) % FREE_MODELS.length;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const stream = await openai.chat.completions.create({
                model: selectedModel,
                messages: [
                    SYSTEM_PROMPT,
                    ...messageHistory,
                    { role: 'user', content }
                ],
                stream: true,
            }, { signal: controller.signal });

            for await (const chunk of stream) {
                const chunkContent = chunk.choices[0]?.delta?.content || '';
                if (chunkContent) {
                    fullAiResponse += chunkContent;
                    io.emit(`chat_chunk_${user._id}`, { content: chunkContent, finished: false });
                }
            }
            clearTimeout(timeoutId);
            streamSuccessful = true;
            break; // Success, exit retry loop
        } catch (streamError) {
            clearTimeout(timeoutId);
            const isTimeout = streamError.name === 'AbortError';
            console.error(`Attempt ${retryCount + 1} Failed (${selectedModel}):`, isTimeout ? 'TIMEOUT (15s)' : streamError.message);
            retryCount++;
            
            if (retryCount > maxRetries) {
                streamSuccessful = false;
                const genericMessage = isTimeout 
                    ? "The AI is taking too long to respond. Please try again in a moment."
                    : "I'm having trouble generating a response right now. Please try again soon.";
                
                io.emit(`chat_chunk_${user._id}`, { 
                    finished: true,
                    error: true,
                    fallbackContent: fullAiResponse || genericMessage
                });
                
                fullAiResponse += `\n\n[Issue: Service unavailable after ${retryCount} attempts]`;
            } else {
                // Add a small delay before retry to mitigate rate limit ripples
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    // 4. Save AI Message once stream is finished or partially finished
    try {
        const aiMessage = await Message.create({
            sender: user._id,
            content: fullAiResponse || 'Unable to generate response.',
            role: 'assistant',
            chatId: targetChatId
        });

        // Update Cache with AI response
        updateCache(targetChatId, aiMessage);

        // Only emit if we finished successfully
        if (streamSuccessful) {
            io.emit(`chat_chunk_${user._id}`, { finished: true, aiMessage });
        }
        return { userMessage, aiMessage };
    } catch (dbError) {
        console.error('DB Save Error for AI:', dbError);
        if (streamSuccessful) {
            io.emit(`chat_chunk_${user._id}`, { 
                finished: true, 
                error: true, 
                fallbackContent: fullAiResponse 
            });
        }
        return { userMessage, error: true };
    }
};

export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const io = req.app.get('io');
        const { userMessage } = await processMessageLogic({
            content,
            chatId,
            user: req.user,
            io
        });

        res.status(201).json({ userMessage });
    } catch (error) {
        console.error('Initial Send Error:', error);
        res.status(500).json({ message: "An unexpected error occurred. Please try again." });
    }
};

export const getHistory = async (req, res) => {
    const { chatId } = req.query;
    try {
        const query = { sender: req.user._id };
        if (chatId) {
            query.chatId = chatId;
        }
        
        const messages = await Message.find(query)
            .sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const msg = await Message.findOneAndDelete({ _id: req.params.id, sender: req.user._id });
        if (msg) {
            // Invalidate cache for this chat if a individual message is deleted
            chatCache.delete(msg.chatId);
        }
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getChatSessions = async (req, res) => {
    try {
        // Find unique chatIds for the user by grouping
        const sessions = await Message.aggregate([
            { $match: { sender: req.user._id } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$chatId",
                    lastMessage: { $first: "$content" },
                    lastTimestamp: { $first: "$createdAt" }
                }
            },
            { $sort: { lastTimestamp: -1 } }
        ]);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const clearHistory = async (req, res) => {
    try {
        await Message.deleteMany({ sender: req.user._id });
        // Clear all cache for this user if we were tracking by userId, 
        // but since it's by chatId, we can just clear memory or be more targeted.
        // For simplicity, clear current cache map since we cleared the whole DB history for this user anyway.
        chatCache.clear();
        res.json({ message: 'Chat history cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
