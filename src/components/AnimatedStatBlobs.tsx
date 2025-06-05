
import React, { useEffect, useState } from 'react';

interface StatBlob {
  id: string;
  value: number;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
}

interface AnimatedStatBlobsProps {
  creativityGain: number;
  technicalGain: number;
  onComplete: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const AnimatedStatBlobs: React.FC<AnimatedStatBlobsProps> = ({
  creativityGain,
  technicalGain,
  onComplete,
  containerRef
}) => {
  const [blobs, setBlobs] = useState<StatBlob[]>([]);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if ((creativityGain > 0 || technicalGain > 0) && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newBlobs: StatBlob[] = [];

      // Find target elements
      const creativityTarget = document.getElementById('creativity-points');
      const technicalTarget = document.getElementById('technical-points');

      // Create creativity blobs
      if (creativityGain > 0 && creativityTarget) {
        const targetRect = creativityTarget.getBoundingClientRect();
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

        // Create multiple blobs for better visual effect
        const blobCount = Math.min(creativityGain, 8); // Max 8 blobs
        const valuePerBlob = Math.ceil(creativityGain / blobCount);

        for (let i = 0; i < blobCount; i++) {
          newBlobs.push({
            id: `creativity-${i}`,
            value: i === blobCount - 1 ? creativityGain - (valuePerBlob * (blobCount - 1)) : valuePerBlob,
            color: '#3b82f6',
            startX: Math.random() * 200 + 50,
            startY: Math.random() * 100 + 50,
            targetX,
            targetY,
            delay: i * 100
          });
        }
      }

      // Create technical blobs
      if (technicalGain > 0 && technicalTarget) {
        const targetRect = technicalTarget.getBoundingClientRect();
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

        const blobCount = Math.min(technicalGain, 8);
        const valuePerBlob = Math.ceil(technicalGain / blobCount);

        for (let i = 0; i < blobCount; i++) {
          newBlobs.push({
            id: `technical-${i}`,
            value: i === blobCount - 1 ? technicalGain - (valuePerBlob * (blobCount - 1)) : valuePerBlob,
            color: '#10b981',
            startX: Math.random() * 200 + 50,
            startY: Math.random() * 100 + 50,
            targetX,
            targetY,
            delay: i * 100 + (creativityGain > 0 ? 500 : 0) // Offset technical blobs if both types exist
          });
        }
      }

      setBlobs(newBlobs);
      setAnimating(true);

      // Complete animation after all blobs finish
      const totalDuration = Math.max(...newBlobs.map(b => b.delay)) + 1500; // 1.5s animation + delays
      setTimeout(() => {
        setAnimating(false);
        setBlobs([]);
        onComplete();
      }, totalDuration);
    }
  }, [creativityGain, technicalGain, containerRef, onComplete]);

  if (!animating || blobs.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold animate-blob-float shadow-lg"
          style={{
            backgroundColor: blob.color,
            boxShadow: `0 0 20px ${blob.color}60, inset 0 0 20px rgba(255, 255, 255, 0.3)`,
            border: '2px solid rgba(255, 255, 255, 0.4)',
            left: `${blob.startX}px`,
            top: `${blob.startY}px`,
            animationDelay: `${blob.delay}ms`,
            '--target-x': `${blob.targetX - blob.startX}px`,
            '--target-y': `${blob.targetY - blob.startY}px`,
          } as React.CSSProperties}
        >
          +{blob.value}
        </div>
      ))}
    </div>
  );
};
