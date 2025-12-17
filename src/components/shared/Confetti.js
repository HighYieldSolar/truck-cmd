"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const colors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
];

function ConfettiPiece({ x, delay, color }) {
  const randomRotation = Math.random() * 360;
  const randomX = (Math.random() - 0.5) * 300;
  const randomDuration = 2.5 + Math.random() * 1.5;

  return (
    <motion.div
      initial={{
        x: x,
        y: -20,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        x: x + randomX,
        y: '100vh',
        rotate: randomRotation + 720,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: delay,
        ease: 'linear',
      }}
      className="fixed top-0 pointer-events-none z-50"
      style={{
        width: Math.random() * 8 + 6,
        height: Math.random() * 8 + 6,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
    />
  );
}

export default function Confetti({ duration = 4000, pieces = 100 }) {
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const generateConfetti = useCallback(() => {
    const newPieces = [];
    for (let i = 0; i < pieces; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
        delay: Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setConfettiPieces(newPieces);
  }, [pieces]);

  useEffect(() => {
    generateConfetti();

    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, generateConfetti]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {confettiPieces.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            x={piece.x}
            delay={piece.delay}
            color={piece.color}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}
