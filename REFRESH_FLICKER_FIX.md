# Page Refresh Flicker Fix

## Problem

When refreshing the browser on an active chat page (e.g., `/chat/abc123`), users experienced a jarring visual flicker:

1. Page loads
2. Welcome screen briefly appears (with suggestions)
3. Loading indicator shows
4. Chat messages finally load
5. Chat UI displays

This created a poor user experience with multiple UI transitions happening in quick succession.

## Root Cause

The issue occurred because of the component lifecycle during page refresh:

1. **Component mounts** → `messages` array is empty `[]`
2. **Conditional rendering** → `messages.length === 0` is `true`
3. **Welcome screen shows** → User sees "Welcome!" and suggestions
4. **`useEffect` triggers** → Calls `fetchHistory(chatId)`
5. **History loads** → `messages` array populates
6. **Re-render** → Welcome screen disappears, chat UI shows

The problem was that there was no way to distinguish between:
- **Truly empty chat** (new chat, should show welcome screen)
- **Loading chat** (fetching history, should show loader)

## Solution

Added a separate `loadingHistory` state to track when chat history is being fetched.

### Changes Made

#### 1. ChatContext.jsx

**Added `loadingHistory` state:**
```javascript
const [loadingHistory, setLoadingHistory] = useState(false);
```

**Updated `fetchHistory` to set loading state:**
```javascript
const fetchHistory = useCallback(async (chatId) => {
    const targetId = chatId || currentChatId;
    
    if (!targetId || targetId === 'default' || targetId.startsWith('new-')) {
        setMessages([]);
        setLoadingHistory(false);
        return;
    }
    
    setLoadingHistory(true); // Start loading
    try {
        const res = await api.get(`/chat/history?chatId=${targetId}`);
        
        if (targetId === currentChatIdRef.current) {
            setMessages(res.data);
        }
    } catch (err) {
        console.error('History fetch error:', err);
    } finally {
        setLoadingHistory(false); // Stop loading
    }
}, [currentChatId]);
```

**Exported `loadingHistory` from context:**
```javascript
<ChatContext.Provider value={{
    messages: optimisticMessages,
    chatSessions,
    loading,
    loadingHistory, // New export
    // ... other values
}}>
```

#### 2. Home.jsx

**Consumed `loadingHistory` from context:**
```javascript
const { 
    messages, 
    chatSessions,
    currentChatId,
    loading,
    loadingHistory, // New
    // ... other values
} = useChat();
```

**Added loading skeleton UI:**
```javascript
{/* Show loading skeleton when fetching history */}
{loadingHistory && messages.length === 0 ? (
    <div className="flex w-full mb-6 animate-fade-in justify-start">
        <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
            <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-surface border border-border rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-4 bg-surface border border-border rounded-lg w-1/2 animate-pulse"></div>
            </div>
        </div>
    </div>
) : messages.length === 0 && !loading ? (
    // Welcome screen
    <div className="h-full flex flex-col items-center justify-center...">
        ...
    </div>
) : null}
```

## How It Works Now

### Scenario 1: Page Refresh on Active Chat

1. **Component mounts** → `messages = []`, `loadingHistory = false`
2. **`useEffect` triggers** → Calls `fetchHistory(chatId)`
3. **`fetchHistory` starts** → Sets `loadingHistory = true`
4. **Conditional rendering** → Shows loading skeleton (not welcome screen)
5. **History loads** → `messages` populates, `loadingHistory = false`
6. **Re-render** → Shows chat messages

**Result:** Smooth transition from loading skeleton to chat UI, no flicker!

### Scenario 2: New Chat (Root URL)

1. **Component mounts** → `messages = []`, `loadingHistory = false`
2. **No chat ID** → `fetchHistory` not called
3. **Conditional rendering** → Shows welcome screen
4. **User sends message** → Chat begins

**Result:** Welcome screen shows correctly for new chats.

### Scenario 3: Switch Between Chats

1. **User clicks different chat** → URL changes
2. **`useEffect` triggers** → Calls `fetchHistory(newChatId)`
3. **`fetchHistory` starts** → Sets `loadingHistory = true`
4. **Old messages clear** → Shows loading skeleton
5. **New history loads** → `messages` populates, `loadingHistory = false`
6. **Re-render** → Shows new chat messages

**Result:** Smooth transition between chats with loading indicator.

## Loading Skeleton Design

The loading skeleton mimics the actual message structure:
- **Bot icon** with pulsing animation
- **Two skeleton lines** representing message content
- **Matching layout** to actual messages for visual continuity
- **Subtle animations** for professional feel

## Benefits

1. **No flicker** - Smooth, professional page refresh experience
2. **Clear feedback** - Users know content is loading
3. **Consistent UX** - Same loading pattern across all scenarios
4. **Better perceived performance** - Loading skeleton feels faster than blank screen
5. **Maintains context** - Users stay oriented on the chat page

## Testing Scenarios

✅ **Refresh on active chat** - Shows loading skeleton, then messages
✅ **Navigate to new chat** - Shows welcome screen
✅ **Switch between chats** - Shows loading skeleton during transition
✅ **Slow network** - Loading skeleton persists until data arrives
✅ **Error case** - Loading skeleton disappears even if fetch fails
