import React, { useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
import { PixiProjectCardsContainer } from '../pixi-ui/PixiProjectCardsContainer';
import { Project } from '../types/game';
import { StaffMember } from '../types/game';

interface PixiProjectCardsBridgeProps {
  projects: Project[];
  animatedProjects?: {
    project: Project;
    progress: number;
    staff: StaffMember[];
    priority: number;
    isAutomated: boolean;
  }[];
  onProjectClick: (project: Project) => void;
  width?: number;
  height?: number;
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
}

const PixiProjectCardsBridge: React.FC<PixiProjectCardsBridgeProps> = ({
  projects,
  animatedProjects = [],
  onProjectClick,
  width = 800,
  height = 200,
  cardWidth = 220,
  cardHeight = 160,
  gap = 20,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const containerRef = useRef<PixiProjectCardsContainer | null>(null);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      width,
      height,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    appRef.current = app;
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create cards container
    const container = new PixiProjectCardsContainer(cardWidth, cardHeight, gap);
    containerRef.current = container;
    app.stage.addChild(container);

    // Handle window resize
    const resizeHandler = () => {
      if (canvasRef.current) {
        app.renderer.resize(canvasRef.current.clientWidth, height);
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      app.destroy(true);
      appRef.current = null;
      containerRef.current = null;
    };
  }, [width, height, cardWidth, cardHeight, gap]);

  // Update projects when props change
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.clearCards();

    // Add regular projects
    projects.forEach(project => {
      container.addProjectCard(project, onProjectClick);
    });

    // Add animated projects
    animatedProjects.forEach(({ project, progress, staff, priority, isAutomated }) => {
      const card = container.addProjectCard(
        project,
        onProjectClick,
        true,
        staff,
        priority,
        isAutomated
      );
      
      if (card instanceof PixiProjectCardsContainer) {
        container.updateAnimatedCard(
          container.children.length - 1,
          progress,
          staff,
          priority,
          isAutomated
        );
      }
    });
  }, [projects, animatedProjects, onProjectClick]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: `${height}px`,
        margin: '0',
        border: 'none',
      }}
    />
  );
};

export default PixiProjectCardsBridge;