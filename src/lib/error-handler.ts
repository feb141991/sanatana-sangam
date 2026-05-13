/**
 * Humanizes database and network errors into user-friendly messages.
 */
export function formatError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  
  const message = error.message || String(error);
  
  // Handle common Supabase/PostgREST errors
  if (message.includes('column') && message.includes('not found')) {
    return 'System sync in progress. Please refresh in a moment 🙏';
  }
  
  if (message.includes('JWT')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection lost. Check your internet and try again.';
  }

  if (message.includes('duplicate key')) {
    return 'This record already exists.';
  }

  if (message.includes('policy')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Default fallback
  return message;
}
