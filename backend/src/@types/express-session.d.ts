declare module 'express-session' {
  interface SessionData {
    initialized?: boolean;
    createdAt?: number;
    lastActivity?: number;
    csrfToken?: string;
    conversationState?: any;
  }
}