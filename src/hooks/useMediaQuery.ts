import { useState, useEffect } from 'react';

/**
 * Custom React hook to detect if a CSS media query matches.
 * @param {string} query - The media query string (e.g., '(max-width: 768px)').
 * @returns {boolean} - True if the media query matches, false otherwise.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * if (isMobile) {
 *   // Render mobile-specific components or apply mobile styles
 * }
 */
const useMediaQuery = (query: string): boolean => {
  // State to store whether the media query matches or not.
  // Initialized to false, will be updated by the effect.
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Get a MediaQueryList object for the passed query.
    const mediaQueryList = window.matchMedia(query);

    // Handler function to update the state when the media query status changes.
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    // Perform an initial check as soon as the component mounts.
    documentChangeHandler();

    // Subscribe to changes in the media query status.
    // Uses addEventListener for modern browsers.
    // Includes a try-catch block for older Safari versions that use the deprecated addListener.
    try {
      mediaQueryList.addEventListener('change', documentChangeHandler);
    } catch (e) {
      // Fallback for Safari < 14
      mediaQueryList.addListener(documentChangeHandler);
    }

    // Cleanup function to remove the event listener when the component unmounts.
    // This prevents memory leaks.
    return () => {
      try {
        mediaQueryList.removeEventListener('change', documentChangeHandler);
      } catch (e) {
        // Fallback for Safari < 14
        mediaQueryList.removeListener(documentChangeHandler);
      }
    };
  }, [query]); // Re-run the effect only if the query string changes.

  return matches;
};

export default useMediaQuery;
