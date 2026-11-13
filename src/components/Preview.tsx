import { useEffect, useRef } from 'react';
import type { PosterPlan } from '../lib/plan';
import type { LoadedImage } from '../lib/types';

interface PreviewProps {
  image: LoadedImage | null;
  plan: PosterPlan | null;
  background: string;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function Preview({ image, plan, background }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

      const draw = () => {
        const dpr = window.devicePixelRatio || 1;
        const containerW = box.clientWidth;
        const containerH = box.clientHeight;
        if (!containerW || !containerH) return;

        // Calculate scale first
        let scale = 1;
        if (image && plan) {
          const pad = 32;
          const availW = containerW - pad * 2;
          const availH = containerH - pad * 2;
          scale = Math.min(availW / plan.posterW, availH / plan.posterH, 1.5);
        }

        // Apply scale/size only once
        const targetW = Math.round(containerW * dpr);
        const targetH = Math.round(containerH * dpr);
        
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, containerW, containerH);

        if (!image || !plan) return;

        // Poster positioning
        const posterPx = plan.posterW * scale;
        const posterPy = plan.posterH * scale;
        const ox = (containerW - posterPx) / 2;
        const oy = (containerH - posterPy) / 2;

      // Shadow backdrop
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = background;
      ctx.fillRect(ox, oy, posterPx, posterPy);
      ctx.restore();

      // Image (clipped to poster bounds)
      ctx.save();
      ctx.beginPath();
      roundedRect(ctx, ox, oy, posterPx, posterPy, 4);
      ctx.clip();
      const imgR = plan.imageRect;
      ctx.drawImage(
        image.bitmap,
        ox + imgR.x * scale,
        oy + (plan.posterH - imgR.y - imgR.h) * scale,
        imgR.w * scale,
        imgR.h * scale,
      );
      ctx.restore();

      // Grid lines
      const colW = plan.printableW * scale;
      const rowH = plan.printableH * scale;

      ctx.save();
      ctx.lineWidth = 1.5;

      // Outer border
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.strokeRect(ox + 0.5, oy + 0.5, posterPx - 1, posterPy - 1);

      // Dashed inner cuts
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      for (let c = 1; c < plan.cols; c++) {
        const x = ox + c * colW;
        ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + posterPy); ctx.stroke();
      }
      for (let r = 1; r < plan.rows; r++) {
        const y = oy + r * rowH;
        ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + posterPx, y); ctx.stroke();
      }

      // Solid thin inner borders
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.lineWidth = 1;
      for (let c = 1; c < plan.cols; c++) {
        const x = ox + c * colW;
        ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + posterPy); ctx.stroke();
      }
      for (let r = 1; r < plan.rows; r++) {
        const y = oy + r * rowH;
        ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + posterPx, y); ctx.stroke();
      }
      ctx.restore();

      // Page numbers
      ctx.save();
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      for (const page of plan.pages) {
        const px = ox + page.col * colW + 7;
        const py = oy + page.row * rowH + 7;
        const label = String(page.index + 1);
        const tw = ctx.measureText(label).width;
        const bw = Math.max(18, tw + 10);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        roundedRect(ctx, px, py, bw, 18, 9);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(label, px + (bw - tw) / 2, py + 9.5);
      }
      ctx.restore();
    };

    let lastW = 0, lastH = 0;
    const drawIfNeeded = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h;
        draw();
      }
    };

    drawIfNeeded();
    const obs = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      const { contentRect } = entry;
      // Debounce with minimal threshold
      if (Math.abs(contentRect.width - lastW) > 1 || Math.abs(contentRect.height - lastH) > 1) {
        requestAnimationFrame(drawIfNeeded);
      }
    });
    obs.observe(box);
    return () => obs.disconnect();
  }, [image, plan, background]);

  return (
    <div className="preview-wrap" ref={boxRef}>
      <canvas ref={canvasRef} className="preview-canvas" />
    </div>
  );
}
