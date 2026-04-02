import { ApiError } from '../lib/api';

/**
 * Extracts a user-friendly error message from an error object.
 * Provides specific messages for client-side errors (4xx) and 
 * generic messages for server-side errors (5xx) in production.
 */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (error instanceof ApiError) {
    // If it's a server error (500) and we're in production, return generic message
    if (error.status >= 500 && import.meta.env.MODE === 'production') {
      return 'Internal Server Error. Our team has been notified.';
    }
    
    // For 4xx errors or development environment, return the specific message from server
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
};
