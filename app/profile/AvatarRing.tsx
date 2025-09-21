
import React from 'react';

type Props = {
  src: string;
  size?: number;       // px, full diameter of avatar incl. ring
  thickness?: number;  // px, ring stroke width
  negProgress?: number; // 0..1, how much of the ring is "red"
  className?: string;
  alt?: string;
};

/**
 * AvatarRing — минимальный компонент кольца вокруг аватарки.
 * ВАЖНО: Геометрию не меняет — ширина/высота равны `size`.
 * Кольцо рисуется поверх через SVG; «покраснение» — это красная дуга,
 * длина которой пропорциональна `negProgress` (0..1).
 */
export default function AvatarRing({
  src,
  size = 48,
  thickness = 3,
  negProgress = 0,
  className = '',
  alt = 'avatar',
}: Props) {
  const radius = (size - thickness) / 2;      // радиус окружности для stroke
  const circumference = 2 * Math.PI * radius; // длина окружности
  const clamped = Math.max(0, Math.min(1, negProgress));

  // длина дуги красного сегмента
  const dash = clamped * circumference;
  const gap = circumference - dash;

  // Чтобы дуга начиналась сверху (на -90deg), поворачиваем svg-группу.
  // SVG занимает весь size, img находится под ним.
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-block',
      }}
    >
      {/* Аватар */}
      <img
        src={src}
        alt={alt}
        style={{
          width: size - thickness * 2,
          height: size - thickness * 2,
          borderRadius: '9999px',
          objectFit: 'cover',
          position: 'absolute',
          top: thickness,
          left: thickness,
        }}
      />

      {/* SVG-обводка */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <g transform={`rotate(-90 ${size/2} ${size/2})`}>
          {/* Базовое «приглушённое» кольцо */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={thickness}
          />
          {/* Красная дуга негативного прогресса */}
          {clamped > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(220, 38, 38, 0.95)"  // красный
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
