import { useEffect, useRef } from "react";

const FRAME_COUNT = 40;
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;

function frameUrl(index: number) {
  return `/scroll-frames/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ScrollFrameSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameImagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const drawFrameRef = useRef<(() => void) | undefined>(undefined);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    const getViewportWidth = () => Math.min(window.innerWidth, 980);

    const resizeCanvas = () => {
      const viewportWidth = getViewportWidth();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(viewportWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.style.left = `${Math.max((window.innerWidth - 980) / 2, 0)}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawFrameRef.current?.();
    };

    const drawImageCover = (image: HTMLImageElement) => {
      const viewportWidth = getViewportWidth();
      const viewportHeight = window.innerHeight;
      const coverScale = Math.max(
        viewportWidth / FRAME_WIDTH,
        viewportHeight / FRAME_HEIGHT,
      );
      const width = FRAME_WIDTH * coverScale;
      const height = FRAME_HEIGHT * coverScale;
      const x = (viewportWidth - width) / 2;
      const y = (viewportHeight - height) / 2;

      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.drawImage(image, x, y, width, height);
    };

    const drawFrame = () => {
      const image =
        frameImagesRef.current[Math.round(currentFrameRef.current)] ||
        frameImagesRef.current[0];
      if (image?.complete && image.naturalWidth > 0) {
        drawImageCover(image);
      }
    };

    drawFrameRef.current = drawFrame;

    const updateTargetFrame = () => {
      const scrollRange = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const scrollProgress = clamp(window.scrollY / scrollRange, 0, 1);
      targetFrameRef.current = reducedMotionRef.current
        ? 0
        : scrollProgress * (FRAME_COUNT - 1);
    };

    const animate = () => {
      const difference = targetFrameRef.current - currentFrameRef.current;
      currentFrameRef.current +=
        reducedMotionRef.current ? difference : difference * 0.16;

      if (Math.abs(difference) > 0.01) {
        drawFrame();
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      updateTargetFrame();
    };

    const loadFrame = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          frameImagesRef.current[index] = image;
          if (index === 0) drawFrame();
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frameUrl(index);
      });

    resizeCanvas();
    updateTargetFrame();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("scroll", updateTargetFrame, { passive: true });
    mediaQuery.addEventListener("change", handleMotionPreferenceChange);

    void loadFrame(0).then(() => {
      for (let index = 1; index < FRAME_COUNT; index += 1) {
        void loadFrame(index);
      }
    });

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", updateTargetFrame);
      mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      drawFrameRef.current = undefined;
      frameImagesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        objectFit: "cover",
        opacity: 0.18,
        mixBlendMode: "screen",
        filter: "saturate(0.82) contrast(1.05)",
      }}
    />
  );
}