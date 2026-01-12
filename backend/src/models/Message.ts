import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  role: 'user' | 'assistant';
  chatId: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    default: 'user'
  },
  chatId: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
