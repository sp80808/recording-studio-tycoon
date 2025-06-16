import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Using lucide-react for icons

/**
 * Interface defining the structure of a tab object.
 */
interface Tab {
  id: string; // Unique identifier for the tab
  name: string; // Display name of the tab
  component?: React.ReactNode; // Optional: The actual component to render for this tab (not used directly by this nav component)
}

/**
 * Props for the MobileArrowNavigation component.
 */
interface MobileArrowNavigationProps {
  tabs: Tab[]; // An array of tab objects to navigate through
  activeTabId: string; // The ID of the currently active tab
  onNavigate: (tabId: string) => void; // Callback function triggered when a navigation arrow is clicked, passing the new target tab ID
}

/**
 * MobileArrowNavigation component.
 * Provides a touch-friendly arrow-based navigation for mobile viewports.
 * It displays the current tab's name and left/right arrows to cycle through tabs.
 * This component is intended to be hidden on desktop viewports via CSS.
 */
const MobileArrowNavigation: React.FC<MobileArrowNavigationProps> = ({ tabs, activeTabId, onNavigate }) => {
  // Find the index of the currently active tab.
  const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);

  // Error handling: if the activeTabId doesn't match any tab, log an error and render nothing.
  if (currentIndex === -1) {
    console.error("MobileArrowNavigation: Active tab ID not found in tabs array.", { activeTabId, tabs });
    return null; 
  }

  /**
   * Handles clicking the 'previous' arrow.
   * Calculates the new index, wraps around if at the beginning of the array.
   * Calls the onNavigate callback with the ID of the new tab.
   */
  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    onNavigate(tabs[newIndex].id);
  };

  /**
   * Handles clicking the 'next' arrow.
   * Calculates the new index, wraps around if at the end of the array.
   * Calls the onNavigate callback with the ID of the new tab.
   */
  const handleNext = () => {
    const newIndex = (currentIndex + 1) % tabs.length;
    onNavigate(tabs[newIndex].id);
  };

  return (
    // Main container for the arrow navigation.
    // Uses flexbox for layout and applies mobile-only styling (md:hidden).
    <div className="flex items-center justify-between p-2 bg-gray-800 text-white md:hidden">
      {/* Previous Arrow Button */}
      <button 
        onClick={handlePrevious} 
        className="p-3 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
        aria-label="Previous Tab" // Accessibility label
      >
        <ChevronLeft size={28} /> {/* Icon for previous */}
      </button>
      {/* Current Tab Name Display */}
      <h2 className="text-xl font-semibold truncate" style={{ minWidth: '120px', textAlign: 'center' }}>
        {tabs[currentIndex].name} {/* Display the name of the active tab */}
      </h2>
      {/* Next Arrow Button */}
      <button 
        onClick={handleNext} 
        className="p-3 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
        aria-label="Next Tab" // Accessibility label
      >
        <ChevronRight size={28} /> {/* Icon for next */}
      </button>
    </div>
  );
};

export default MobileArrowNavigation;
