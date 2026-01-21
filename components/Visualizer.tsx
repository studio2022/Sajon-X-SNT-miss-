import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser?: AnalyserNode | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = 128;
    };
    resize();
    window.addEventListener('resize', resize);

    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(0);

    const draw = () => {
      if (!isPlaying) {
         // Draw idle state
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = '#1f2937'; // Dark gray line
         ctx.fillRect(0, canvas.height / 2, canvas.width, 2);
         return;
      }

      animationRef.current = requestAnimationFrame(draw);

      if (analyser) {
          analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#b026ff'); // Purple
      gradient.addColorStop(1, '#00d4ff'); // Blue

      ctx.fillStyle = gradient;

      // Draw Bars
      const barWidth = (canvas.width / 50); // Show 50 bars
      let x = 0;

      // We focus on the lower/mid frequencies for better visual impact
      const step = Math.floor((bufferLength / 2) / 50); 

      for (let i = 0; i < 50; i++) {
        const dataIndex = i * step;
        const value = dataArray[dataIndex] || 0;
        
        // Scale height
        const barHeight = (value / 255) * canvas.height;

        // Draw rounded top bar
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="h-32 w-full px-4 overflow-hidden bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};