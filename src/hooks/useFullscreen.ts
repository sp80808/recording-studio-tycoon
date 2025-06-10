import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast'; // Assuming use-toast is correctly set up for Sonner

export function useFullscreen(elementId: string = 'root') {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getFullscreenElement = () => {
    return document.fullscreenElement ||
           (document as any).webkitFullscreenElement ||
           (document as any).mozFullScreenElement ||
           (document as any).msFullscreenElement;
  };

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!getFullscreenElement());
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = async () => {
    const element = document.getElementById(elementId) || document.documentElement;

    if (!getFullscreenElement()) {
      try {
        const requestFullscreen =
          element.requestFullscreen ||
          (element as any).webkitRequestFullscreen ||
          (element as any).mozRequestFullScreen ||
          (element as any).msRequestFullscreen;

        if (requestFullscreen) {
          await requestFullscreen.call(element);
          // setIsFullscreen(true); // State will be updated by event listener
        } else {
          toast({
            title: 'Fullscreen Not Supported',
            description: 'Fullscreen mode is not available in this browser.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Failed to enter fullscreen mode:', err);
        toast({
          title: 'Error',
          description: 'Failed to enter fullscreen mode.',
          variant: 'destructive',
        });
      }
    } else {
      try {
        const exitFullscreen =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;

        if (exitFullscreen) {
          await exitFullscreen.call(document);
          // setIsFullscreen(false); // State will be updated by event listener
        }
      } catch (err) {
        console.error('Failed to exit fullscreen mode:', err);
        toast({
          title: 'Error',
          description: 'Failed to exit fullscreen mode.',
          variant: 'destructive',
        });
      }
    }
  };

  return { isFullscreen, toggleFullscreen };
}
