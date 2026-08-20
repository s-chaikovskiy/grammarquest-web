import { useEffect, useState } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

export default function AnimatedBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    const initParticles = async () => {
      const engine = await import('@tsparticles/engine');
      await loadSlim(engine as unknown as Engine);
      setInit(true);
    };
    initParticles();
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#13131A] to-[#0A0A0F]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EC4899]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Particles */}
      {init && (
        <Particles
          id="tsparticles"
          options={{
            fullScreen: false,
            background: { color: 'transparent' },
            particles: {
              number: { value: 50 },
              color: { value: ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6'] },
              shape: { type: 'circle' },
              opacity: { value: { min: 0.1, max: 0.3 } },
              size: { value: { min: 1, max: 3 } },
              move: {
                enable: true,
                speed: 0.5,
                direction: 'none',
                random: true,
                straight: false,
                outModes: 'out',
              },
              links: {
                enable: true,
                distance: 150,
                color: '#6366F1',
                opacity: 0.1,
                width: 1,
              },
            },
            detectRetina: true,
          }}
        />
      )}
    </div>
  );
}