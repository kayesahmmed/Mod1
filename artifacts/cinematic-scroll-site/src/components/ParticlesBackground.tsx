import { useEffect, useRef } from "react";

interface FireEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  flickerSpeed: number;
  flickerOffset: number;
  // Base color hue: 0 = Red, 20 = Orange, 40 = Gold/Yellow
  hue: number;
}

export default function ParticlesBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Spawn an ember at or below the bottom, or randomly on initial screen setup
    const createEmber = (startY?: number): FireEmber => {
      const isYellowHot = Math.random() < 0.3;
      return {
        x: Math.random() * width,
        y: startY !== undefined ? startY : height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.5 + 0.5), // Slower Upward speed
        radius: Math.random() * 1.8 + 0.6,
        opacity: Math.random() * 0.7 + 0.3,
        swayFreq: Math.random() * 0.02 + 0.01,
        swayAmp: Math.random() * 1.2 + 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        flickerSpeed: Math.random() * 0.1 + 0.05,
        flickerOffset: Math.random() * Math.PI * 2,
        // Richer colors for light mode to maintain contrast
        hue: isDark ? (isYellowHot ? Math.random() * 20 + 30 : Math.random() * 20 + 5) 
                    : (isYellowHot ? Math.random() * 15 + 15 : Math.random() * 10), // Richer red/orange in light mode
      };
    };

    // Calculate particle count according to screen size (reduced)
    const particleCount = Math.min(60, Math.max(20, Math.floor(width / 30)));
    const embers: FireEmber[] = Array.from({ length: particleCount }).map(() =>
      createEmber(Math.random() * height)
    );

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      embers.forEach((p, idx) => {
        // Move upward with thermal drift
        p.y += p.vy;
        p.x += p.vx + Math.sin(frame * p.swayFreq + p.swayPhase) * p.swayAmp * 0.3;

        // Calculate height progress (1 = bottom of screen, 0 = top of screen)
        const heightProgress = Math.max(0, Math.min(1, p.y / height));

        // As ember floats higher up the screen, it cools down and fades out (extinguishes)
        // Fade out smoothly in the top 50% of the screen or when going off-screen
        let verticalFade = 1;
        if (heightProgress < 0.5) {
          verticalFade = heightProgress / 0.5; // 1.0 down at 50% height, 0.0 at top
        }

        // Natural fire flicker effect
        const flicker = Math.sin(frame * p.flickerSpeed + p.flickerOffset) * 0.2 + 0.8;
        const currentOpacity = Math.max(0, p.opacity * verticalFade * flicker * (isDark ? 0.95 : 0.85));

        // Respawn if completely faded, reached top, or drifted far horizontally
        if (currentOpacity <= 0.01 || p.y < -10 || p.x < -20 || p.x > width + 20) {
          embers[idx] = createEmber();
          return;
        }

        // Temperature cooling hue shift: shift towards deeper red as it rises
        const currentHue = Math.max(0, p.hue * (0.4 + 0.6 * heightProgress));
        // Shrink slightly as it burns out
        const currentRadius = Math.max(0.4, p.radius * (0.5 + 0.5 * heightProgress));

        // Render soft glow halo (No shadowBlur to prevent GPU glitching)
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * (isDark ? 3.5 : 2.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentHue}, 100%, ${isDark ? 50 : 50}%, ${currentOpacity * (isDark ? 0.25 : 0.12)})`;
        ctx.fill();

        // Render core spark dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentHue}, 100%, ${isDark ? 60 + 30 * heightProgress : 45}%, ${currentOpacity})`;
        ctx.fill();

        // White-hot center dot for fresh/hot embers lower down
        if (heightProgress > 0.4 && currentRadius > (isDark ? 1.4 : 1.0)) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * (isDark ? 0.4 : 0.5), 0, Math.PI * 2);
          // In light mode, yellow/white disappears into the background. Use a vibrant orange/red center.
          ctx.fillStyle = `rgba(${isDark ? '255, 255, 240' : '255, 90, 0'}, ${currentOpacity * (isDark ? 0.85 : 0.95)})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full transition-opacity duration-500"
      style={{ opacity: isDark ? 0.95 : 0.7 }}
    />
  );
}

