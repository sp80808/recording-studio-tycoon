import React, { useRef, useEffect, useState } from 'react';
import { Application, Container } from 'pixi.js';
import { PixiGameHeader } from '../pixi-ui/PixiGameHeader';

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [gameState, setGameState] = useState({
    money: 1000000,
    reputation: 5000,
    currentDay: 100,
    hiredStaff: [],
    playerData: {
      perkPoints: 0,
      xp: 0,
      xpToNextLevel: 100,
      level: 1,
    },
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    appRef.current = app;
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    const headerHeight = 60;

    const gameHeader = new PixiGameHeader(app.renderer.width, headerHeight);
    gameHeader.y = 0;
    app.stage.addChild(gameHeader);

    // Set up button click handlers
    gameHeader.setOnSettingsClick(() => {
      console.log('Settings clicked from React');
      // TODO: Connect to React settings modal
    });

    gameHeader.setOnFullscreenClick(() => {
      console.log('Fullscreen clicked from React');
      // TODO: Implement fullscreen toggle
    });

    gameHeader.update(gameState);

    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        money: prev.money + 1000,
        reputation: prev.reputation + 10,
        currentDay: prev.currentDay + 1,
      }));
    }, 1000);

    const resizeHandler = () => {
      const parent = canvasRef.current;
      if (parent) {
        app.renderer.resize(parent.clientWidth, parent.clientHeight);
        gameHeader.resize(parent.clientWidth, headerHeight);
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeHandler);
      app.destroy(true);
      appRef.current = null;
    };
  }, [gameState]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100vh', margin: '0', border: 'none' }} />;
};

export default WebGLCanvas;