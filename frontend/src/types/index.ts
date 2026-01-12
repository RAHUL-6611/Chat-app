export interface User {
  _id: string;
  username: string;
  email: string;
  token?: string;
}

export interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  chatId: string;
  createdAt: string;
  updatedAt?: string;
  isOptimistic?: boolean;
  isStreaming?: boolean;
  shouldAnimate?: boolean;
  isError?: boolean;
  dbId?: string;
}

export interface ChatSession {
  _id: string;
  lastMessage: string;
  lastTimestamp: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface ChatContextType {
  messages: Message[];
  chatSessions: ChatSession[];
  loading: boolean;
  loadingHistory: boolean;
  typingUser: string | null;
  error: string | null;
  currentChatId: string | null;
  sendMessage: (content: string) => void;
  createNewChat: () => void;
  switchChat: (chatId: string) => void;
  deleteMessage: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
