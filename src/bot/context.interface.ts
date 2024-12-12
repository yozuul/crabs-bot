import { Context as ContextTelegraf } from 'telegraf';

export interface SessionContext {
  userId?: number;
  userStatus?: string;
  options: any;
  match?: RegExpExecArray; // Добавляем match
}

export interface Context extends ContextTelegraf {
  session: SessionContext;
}