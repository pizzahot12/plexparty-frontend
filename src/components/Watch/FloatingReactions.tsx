import React, { useEffect, useState, useCallback, useRef } from 'react';
import webSocketService from '@/lib/websocket-service';

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100 (starting point)
  duration: number; // animation duration in ms
  size: number; // text size in rem
}

interface FloatingReactionsProps {
  className?: string;
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ className = '' }) => {
  const [particles, setParticles] = useState<ReactionParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addReaction = useCallback((emoji: string, isSelf = false) => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now();
    
    // Self reactions appear slightly to the right, others slightly to the left, 
    // with some randomness
    const basePosition = isSelf ? 70 : 15;
    const xPositions = Math.max(5, Math.min(90, basePosition + (Math.random() * 20 - 10)));
    
    const newParticle: ReactionParticle = {
      id,
      emoji,
      x: xPositions,
      y: 90, // Start near the bottom
      duration: 2000 + Math.random() * 1000, // 2s - 3s
      size: 1.5 + Math.random() * 1, // 1.5rem to 2.5rem
    };

    setParticles((prev) => [...prev, newParticle]);

    // Remove particle after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, newParticle.duration);
  }, []);

  useEffect(() => {
    // Escuchar eventos de reacción del WS
    const unsubscribe = webSocketService.on('reaction', (event: any) => {
      if (event.emoji) {
        // En este simple componente, asumimos que si llega por WS, alguien más lo envió.
        // Podríamos filtrar por userId si quisiéramos distinguirlos perfectamente,
        // pero por ahora el efecto visual principal de "aparecer" es lo importante.
        addReaction(event.emoji, false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addReaction]);

  // Permitir exponer addReaction via Ref o manejador global si es necesario,
  // pero usaremos emit local antes de enviar al WS para feedback inmediato.
  useEffect(() => {
    const handleLocalReaction = (e: CustomEvent<{ emoji: string }>) => {
      const emoji = e.detail?.emoji;
      if (emoji) {
        addReaction(emoji, true);
        webSocketService.sendReaction(emoji);
      }
    };

    window.addEventListener('local_reaction', handleLocalReaction as EventListener);
    return () => {
      window.removeEventListener('local_reaction', handleLocalReaction as EventListener);
    };
  }, [addReaction]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden z-20 ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute will-change-transform animate-float-up drop-shadow-md flex items-center justify-center font-emoji"
          style={{
            left: `${p.x}%`,
            bottom: '0%', // Start exactly at the bottom border
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}ms`,
            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            animationFillMode: 'forwards',
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};
