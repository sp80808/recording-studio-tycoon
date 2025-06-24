import React, { useRef, useEffect } from 'react';
import { Application, Graphics, Sprite, Texture } from 'pixi.js';

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current || appRef.current) return;

      const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x4c566a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      appRef.current = app;
      canvasRef.current.appendChild(app.view as HTMLCanvasElement);

      const rectangle = new Graphics();
      rectangle.beginFill(0x66ccff);
      rectangle.drawRect(50, 50, 100, 100);
      rectangle.endFill();

      const texture = Texture.from('assets/isometric_room.png');
      const background = new Sprite(texture);

      // Set the position of the background
      background.x = 0;
      background.y = 0;

      // Add the background to the stage
      app.stage.addChild(background);
      app.stage.addChild(rectangle);

      const resizeHandler = () => {
        if (canvasRef.current) {
          const { clientWidth, clientHeight } = canvasRef.current;
          app.renderer.resize(clientWidth, clientHeight);
        }
      };

      window.addEventListener('resize', resizeHandler);
      resizeHandler();

      return () => {
        window.removeEventListener('resize', resizeHandler);
        if (appRef.current) {
          appRef.current.destroy(true, true);
          appRef.current = null;
        }
      };
    };

    const cleanup = init();

    return () => {
      cleanup.then(c => c && c());
    };
  }, []);

  return <div ref={canvasRef} style={{ width: '100%', height: '100vh' }} />;
};

export default WebGLCanvas;
