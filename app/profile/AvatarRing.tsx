'use client'
import React from 'react'

type Props = {
  src: string
  size?: number        // внешний размер
  thickness?: number   // ширина кольца
  negProgress?: number // 0..1 — красная дуга (против часовой)
  posProgress?: number // 0..1 — зелёная дуга (по часовой)
}

export default function AvatarRing({
  src,
  size = 64,
  thickness = 4,
  negProgress = 0,
  posProgress = 0,
}: Props) {
  const s = size
  const c = s / 2
  const r = c - thickness / 2

  const neg = Math.max(0, Math.min(1, negProgress))
  const pos = Math.max(0, Math.min(1, posProgress))

  return (
    <div style={{ position: 'relative', width: s, height: s }}>
      {/* аватар */}
      <img
        alt=""
        src={src}
        style={{
          width: s - thickness * 2,
          height: s - thickness * 2,
          borderRadius: '999px',
          objectFit: 'cover',
          position: 'absolute',
          left: thickness,
          top: thickness,
        }}
      />

      {/* кольца */}
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {/* базовое кольцо */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={thickness}
        />

        {/* ЗЕЛЁНАЯ дуга — по часовой, старт из «9 часов» (поворот на 180°) */}
        {pos > 0 && (
          <g transform={`rotate(180 ${c} ${c})`}>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke="hsl(150 70% 50%)"
              strokeWidth={thickness}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${pos} 1`}
              strokeDashoffset={0}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,170,0.35))' }}
            />
          </g>
        )}

        {/* КРАСНАЯ дуга — против часовой от «9 часов» (зеркалим по X и поворачиваем) */}
        {neg > 0 && (
          <g transform={`translate(${s} 0) scale(-1 1) rotate(180 ${c} ${c})`}>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke="hsl(0 75% 55%)"
              strokeWidth={thickness}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${neg} 1`}
              strokeDashoffset={0}
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,60,60,0.35))' }}
            />
          </g>
        )}
      </svg>
    </div>
  )
}
