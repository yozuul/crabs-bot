import { Context as ContextTelegraf } from 'telegraf';

export interface SessionContext {
   // path?: 'home' | 'users';
   userId?: number
   userStatus?: string,
   options: any
}

export interface Context extends ContextTelegraf {
  session: SessionContext;
}