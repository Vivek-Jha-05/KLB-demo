/**
 * Environment-aware logger for the frontend.
 * Only outputs logs to the console when in development mode.
 */

const isDev = import.meta.env.MODE === 'development';

// Helper to check for debug mode at runtime
const isDebug = () => {
  if (typeof window === 'undefined') return false;
  return (window as any).__DEBUG__ === true || new URLSearchParams(window.location.search).has('debug');
};

export const logger = {
  log: (...args: any[]) => {
    if (isDev || isDebug()) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // In production, never log unless debug mode is explicitly on
    if (!isDev && !isDebug()) return;

    // Filter out full error objects to avoid stack trace exposure
    const safeArgs = args.map(arg => {
      if (arg instanceof Error && !isDebug()) {
        return arg.message; // Only log message, hide stack trace
      }
      return arg;
    });

    console.error(...safeArgs);
  },
  warn: (...args: any[]) => {
    if (isDev || isDebug()) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev || isDebug()) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDev || isDebug()) {
      console.debug(...args);
    }
  },
};

