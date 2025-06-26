import React, { useRef, useEffect } from 'react';
import { Application, Graphics, Sprite, Texture } from 'pixi.js';

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const app = useRef(new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x4c566a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  }));

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.current.view as HTMLCanvasElement);
    }

    const rectangle = new Graphics();
    rectangle.beginFill(0x66ccff);
    rectangle.drawRect(50, 50, 100, 100);
    rectangle.endFill();

    const texture = Texture.from('assets/isometric_room.png');
    const background = new Sprite(texture);

    background.x = 0;
    background.y = 0;

    app.current.stage.addChild(background);
    app.current.stage.addChild(rectangle);

    const resizeHandler = () => {
      if (canvasRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        app.current.renderer.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      app.current.destroy(true, true);
    };
  }, []);

  return <div ref={canvasRef} style={{ width: '100%', height: '100vh' }} />;
};

export default WebGLCanvas;
