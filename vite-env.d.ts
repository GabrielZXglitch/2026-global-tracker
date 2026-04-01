/// <reference types="vite/client" />

// Use module augmentation to extend NodeJS.ProcessEnv without redeclaring 'process' variable
// which causes conflicts if it's already declared (e.g. by @types/node).
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      [key: string]: string | undefined;
    }
  }
}
