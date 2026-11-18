import { motion } from 'motion/react';

export interface FlyingItem {
  id: string;
  image: string;
  name: string;
  fromRect: { left: number; top: number; width: number; height: number };
  toRect: { left: number; top: number; width: number; height: number };
}

interface FlyToCartLayerProps {
  flights: FlyingItem[];
  onFlightComplete: (id: string) => void;
}

export function FlyToCartLayer({ flights, onFlightComplete }: FlyToCartLayerProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {flights.map((flight) => {
        const startX = flight.fromRect.left;
        const startY = flight.fromRect.top;
        const endX = flight.toRect.left + flight.toRect.width / 2 - flight.fromRect.width / 2;
        const endY = flight.toRect.top + flight.toRect.height / 2 - flight.fromRect.height / 2;

        // Stage 1: Pop/lift slightly inward & upward in full view (like the reference video)
        const liftX = startX + (endX - startX) * 0.14;
        const liftY = Math.max(48, startY - 36);

        // Stage 2: Smooth curved waypoint kept safely inside the viewport
        const midX = startX + (endX - startX) * 0.62;
        const midY = Math.max(36, startY * 0.35 + endY * 0.65 - 24);

        return (
          <motion.div
            key={flight.id}
            initial={{
              x: startX,
              y: startY,
              scale: 0.92,
              opacity: 1,
              borderRadius: '16px',
            }}
            animate={{
              x: [startX, liftX, midX, endX],
              y: [startY, liftY, midY, endY],
              scale: [0.92, 1.14, 0.56, 0.14],
              opacity: [1, 1, 0.95, 0.25],
              borderRadius: ['16px', '22px', '32px', '999px'],
            }}
            transition={{
              duration: 0.9,
              times: [0, 0.26, 0.64, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => onFlightComplete(flight.id)}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: flight.fromRect.width,
              height: flight.fromRect.height,
            }}
            className="overflow-hidden shadow-2xl ring-2 ring-neutral-950/80 dark:ring-white/90 bg-white dark:bg-[#171719]"
          >
            <img
              src={flight.image}
              alt={flight.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
