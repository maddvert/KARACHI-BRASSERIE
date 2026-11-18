import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  visible: boolean;
  isDark: boolean;
  onComplete: () => void;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
}

export function SplashScreen({ visible, isDark, onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      onComplete();
    }, 1050);
    return () => window.clearTimeout(timer);
  }, [visible, onComplete]);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const colors = isDark
      ? ['#FFFFFF', '#E4E4E7', '#A1A1AA', '#F9F1E3', '#D4D4D8']
      : ['#18181B', '#454340', '#71717A', '#27272A', '#52525B'];
    const particles: FireworkParticle[] = [];

    const spawnBurst = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = 2.2 + Math.random() * 5.2;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.013 + Math.random() * 0.012,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2.2,
        });
      }
    };

    const w = window.innerWidth;
    const h = window.innerHeight;
    spawnBurst(w * 0.5, h * 0.48, 40);
    const t1 = window.setTimeout(() => spawnBurst(w * 0.32, h * 0.36, 26), 280);
    const t2 = window.setTimeout(() => spawnBurst(w * 0.68, h * 0.38, 26), 520);
    const t3 = window.setTimeout(() => spawnBurst(w * 0.5, h * 0.52, 32), 820);

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.065;
        p.vx *= 0.985;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener('resize', resize);
    };
  }, [visible, isDark]);

  const logoSrc = isDark
    ? '/assets/aistudio/logo-dark.webp'
    : '/assets/aistudio/logo-light.webp';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          onClick={onComplete}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-neutral-100 to-neutral-200 dark:from-[#09090A] dark:via-[#121214] dark:to-[#0D0D0E] cursor-pointer select-none"
        >
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-full" />

          {/* Borderless Transparent Logo with Center-Outward Animated Top & Bottom Lines */}
          <div className="relative z-10 flex flex-col items-center px-6">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64">
              {/* Top horizontal line: animates smoothly from center outwards to exact logo width */}
              <motion.img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                initial={{ clipPath: 'inset(13% 50% 81.5% 50%)', opacity: 0 }}
                animate={{ clipPath: 'inset(13% 0% 81.5% 0%)', opacity: 1 }}
                transition={{ duration: 0.95, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Main "KARACHI BRASSERIE" wordmark */}
              <motion.img
                src={logoSrc}
                alt="Karachi Brasserie"
                style={{ clipPath: 'inset(20% 0% 24.5% 0%)' }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />

              {/* Bottom horizontal line: animates smoothly from center outwards to exact logo width */}
              <motion.img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                initial={{ clipPath: 'inset(75% 50% 20% 50%)', opacity: 0 }}
                animate={{ clipPath: 'inset(75% 0% 20% 0%)', opacity: 1 }}
                transition={{ duration: 0.95, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* "ALL DAY EATERY" subtitle inside transparent logo */}
              <motion.img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                style={{ clipPath: 'inset(80.5% 0% 8% 0%)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.55 }}
              className="mt-2 text-xs tracking-[0.22em] uppercase text-neutral-600 dark:text-neutral-300 font-medium text-center"
            >
              Hotel Excelsior · Saddar, Karachi
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
