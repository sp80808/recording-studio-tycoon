import { useState, useEffect } from 'react';

const MOBILE_MAX_WIDTH = 768; // Standard breakpoint for mobile devices

/**
 * Custom hook to detect if the current viewport is mobile-sized.
 * @returns {boolean} True if the viewport width is less than or equal to MOBILE_MAX_WIDTH, false otherwise.
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_MAX_WIDTH);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
    };

    window.addEventListener('resize', handleResize);
    // Call handler right away so state is Ccorrect on initial render
    handleResize(); 

    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  return isMobile;
};
