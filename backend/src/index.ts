// Initializing environment variables
import './config/env.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import connectDB from './config/db.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { IUser } from './models/User.js';

import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { processMessageLogic } from './controllers/chat.controller.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

interface JwtPayload {
  id: string;
}

// Socket.io Middleware for Authentication
io.use(async (socket: any, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error('Authentication error'));
    
    const token = cookies.split('; ').find((row: string) => row.startsWith('token='))?.split('=')[1];
    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return next(new Error('User not found'));
    
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io Logic
io.on('connection', (socket: AuthenticatedSocket) => {
  console.log('User authenticated & connected:', socket.user?.username);

  socket.on('send_message', async (data: { content: string; chatId?: string }) => {
    const { content, chatId } = data;
    if (!content) return;

    try {
      await processMessageLogic({
        content,
        chatId,
        user: socket.user!,
        io,
        socket // Pass socket for immediate user message confirmation
      });
    } catch (error) {
      console.error('Socket Send Error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data: { userId: string; username: string }) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('stop_typing', (data: { userId: string }) => {
    socket.broadcast.emit('stop_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user?.username);
  });
});

// Make io accessible to our router
app.set('io', io);

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Catch-all route for SPA - must be last
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send('API is running...');
  });
}

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
