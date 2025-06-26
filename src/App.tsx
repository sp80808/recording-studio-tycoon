import { useEffect } from 'react';
import WebGLCanvas from "./components/WebGLCanvas";
import './App.css'; // Assuming you have some basic CSS for full screen
import { gameAudio } from './utils/audioSystem';

const App = () => {
  useEffect(() => {
    const handleFirstInteraction = () => {
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
