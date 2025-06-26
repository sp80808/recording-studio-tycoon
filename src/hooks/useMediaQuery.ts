import { useState, useEffect } from 'react';

interface CustomNavigator extends Navigator {
  msMaxTouchPoints?: number;
}

/**
 * Custom React hook to detect mobile devices using user agent and touch capabilities.
 * More reliable than screen size since dev tools can trigger false positives.
 * @returns {boolean} - True if the device is likely mobile, false otherwise.
 */
export const useMobileDetection = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const detectMobile = () => {
      // Check user agent for mobile indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'mobile', 'tablet'
      ];
      
      const hasUserAgentMobile = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );

      // Check for touch capability
      const hasTouchCapability = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as CustomNavigator).msMaxTouchPoints > 0
      );

      // Check screen size as secondary indicator (but not primary)
      const hasSmallScreen = window.innerWidth <= 768;

      // Mobile if user agent indicates mobile OR (touch capable AND small screen)
      const isMobileDevice = hasUserAgentMobile || (hasTouchCapability && hasSmallScreen);
      
      // Additional check: if screen is very large (>1024px), probably not mobile even with touch
      const isLargeScreen = window.innerWidth > 1024;
      
      setIsMobile(isMobileDevice && !isLargeScreen);
    };

    // Initial detection
    detectMobile();

    // Re-detect on resize (but with user agent as primary factor)
    window.addEventListener('resize', detectMobile);
    
    return () => {
      window.removeEventListener('resize', detectMobile);
    };
  }, []);

  return isMobile;
};

/**
 * Legacy media query hook for backwards compatibility
 * @param {string} query - The media query string (e.g., '(max-width: 768px)').
 * @returns {boolean} - True if the media query matches, false otherwise.
 */
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);
    documentChangeHandler();
    
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
