import { useEffect } from 'react';
import WebGLCanvas from "./components/WebGLCanvas";
import './App.css'; // Assuming you have some basic CSS for full screen
import { gameAudio } from './utils/audioSystem';

// Define global for inline-worker
globalThis.global = window;

const App = () => {
  useEffect(() => {
    const handleFirstInteraction = () => {
      console.log('User interaction detected, attempting to resume audio context.');
      gameAudio.userGestureSignal();
      window.removeEventListener('mousedown', handleFirstInteraction);
    };

    window.addEventListener('mousedown', handleFirstInteraction);

    return () => {
      window.removeEventListener('mousedown', handleFirstInteraction);
    };
  }, []);

  return (
    <div className="App">
      <WebGLCanvas />
    </div>
  );
};

export default App;
