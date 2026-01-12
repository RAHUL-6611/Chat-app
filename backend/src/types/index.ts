import { Request } from 'express';
import { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface ChatMessage {
  content: string;
  chatId?: string;
}

export interface SocketData {
  userId: string;
  username: string;
}

export interface MessageData {
  content: string;
  chatId: string;
  user: IUser;
  io: any;
  socket: any;
}

