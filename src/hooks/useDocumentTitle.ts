import { useEffect } from 'react';

export const useDocumentTitle = (title: string, fallbackTitle = 'PlexParty') => {
  useEffect(() => {
    document.title = title ? `${title} - ${fallbackTitle}` : fallbackTitle;
    
    // Cleanup on unmount
    return () => {
      document.title = fallbackTitle;
    };
  }, [title, fallbackTitle]);
};
