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
    console.log('🎨 AnimatedStatBlobs effect triggered:', { creativityGain, technicalGain });
    let animationTimeoutId: NodeJS.Timeout | null = null;

    if ((creativityGain > 0 || technicalGain > 0) && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newBlobs: StatBlob[] = [];

      console.log('📦 Container rect:', containerRect);

      // Find target elements with more specific selectors
      const creativityTarget = document.querySelector('[data-creativity-target]') || document.getElementById('creativity-points');
      const technicalTarget = document.querySelector('[data-technical-target]') || document.getElementById('technical-points');

      console.log('🎯 Target elements found:', { 
        creativityTarget: !!creativityTarget, 
        technicalTarget: !!technicalTarget,
        creativitySelector: creativityTarget?.id || creativityTarget?.getAttribute('data-creativity-target'),
        technicalSelector: technicalTarget?.id || technicalTarget?.getAttribute('data-technical-target')
      });

      // Create creativity blobs
      if (creativityGain > 0 && creativityTarget) {
        const targetRect = creativityTarget.getBoundingClientRect();
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

        console.log('💙 Creating creativity blobs at target:', { targetX, targetY, targetRect, containerRect });

        // Create multiple blobs for better visual effect
        const blobCount = Math.min(creativityGain, 12); // Increased from 8 to 12 for more impressive effect
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
            delay: i * 80 // Faster sequence timing
          });
        }
      } else if (creativityGain > 0) {
        console.log('❌ Creativity target not found for creativity gain:', creativityGain);
      }

      // Create technical blobs
      if (technicalGain > 0 && technicalTarget) {
        const targetRect = technicalTarget.getBoundingClientRect();
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

        console.log('💚 Creating technical blobs at target:', { targetX, targetY, targetRect, containerRect });

        const blobCount = Math.min(technicalGain, 12); // Increased from 8 to 12 for more impressive effect
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
            delay: i * 80 + (creativityGain > 0 ? 600 : 0) // Faster sequence, longer offset
          });
        }
      } else if (technicalGain > 0) {
        console.log('❌ Technical target not found for technical gain:', technicalGain);
      }

      console.log(`✨ Created ${newBlobs.length} blobs:`, newBlobs.map(b => `${b.id}: +${b.value}`));

      if (newBlobs.length > 0) {
        setBlobs(newBlobs);
        setAnimating(true);

        // Complete animation after all blobs finish
        const totalDuration = Math.max(...newBlobs.map(b => b.delay)) + 1800; // Updated for new animation timing
        animationTimeoutId = setTimeout(() => {
          console.log('🏁 Animation complete');
          setAnimating(false);
          setBlobs([]);
          onComplete();
        }, totalDuration);
      } else {
        console.log('❌ No blobs created, calling onComplete immediately');
        onComplete();
      }
    } else {
      console.log('❌ Animation conditions not met:', {
        hasGains: creativityGain > 0 || technicalGain > 0,
        hasContainer: !!containerRef.current,
        creativityGain,
        technicalGain
      });
      // Ensure onComplete is called if no animation is triggered but was expected
      // This prevents the parent component from waiting indefinitely if gains are 0 or container is missing
      if (creativityGain === 0 && technicalGain === 0) {
        onComplete();
      }
    }

    // Cleanup function
    return () => {
      if (animationTimeoutId) {
        clearTimeout(animationTimeoutId);
        console.log('🧹 Animation timeout cleared on unmount/re-effect');
        // If unmounting during animation, ensure onComplete is called
        // and state is reset to prevent updates on unmounted component.
        // Check if animating to avoid calling onComplete multiple times if it already ran.
        if (animating) {
            setAnimating(false);
            setBlobs([]);
            onComplete(); 
            console.log('🧹 Called onComplete and reset state during cleanup as animation was active.');
        }
      }
    };
  }, [creativityGain, technicalGain, containerRef, onComplete, animating]); // Added animating to dependency array

  if (!animating || blobs.length === 0) {
    console.log('❌ Not animating or no blobs:', { animating, blobCount: blobs.length });
    return null;
  }

  console.log('🎬 Rendering blobs:', blobs.length);

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
