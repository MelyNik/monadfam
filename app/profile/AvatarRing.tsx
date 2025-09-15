'use client'
import React, { useId } from 'react'

type Props = {
  src: string
  alt?: string
  size?: number        // общий диаметр, px
  thickness?: number   // толщина кольца, px
  rating?: number      // зарезервировано (на будущее)
  negProgress?: number // 0..1 — сколько «покраснело» по дуге
  className?: string
}

/**
 * Базовое кольцо показывает ваш конусный градиент (var(--rating-conic)) из global.css.
 * Это делается HTML-слоем под SVG (без foreignObject, чтобы TS не ругался).
 * Сверху — SVG-дуга покраснения (идёт ПРОТИВ часовой, старт в 9 часов) и фото.
 */
export default function AvatarRing({
  src,
  alt = '',
  size = 72,
  thickness = 4,
  // rating,
  negProgress = 0,
  className = '',
}: Props) {
  const s = size
  const r = (s - thickness) / 2
  const c = 2 * Math.PI * r
  const prog = Math.max(0, Math.min(1, negProgress))
  const inner = s - thickness
  const clipId = useId()

  // Повернуть старт дуги в 9ч и пустить против часовой:
  const gTransform = `translate(${s} 0) scale(-1 1) rotate(180 ${s / 2} ${s / 2})`

  return (
    <div className={className} style={{ width: s, height: s, position: 'relative' }}>
      {/* === Слой 1. Базовое градиентное кольцо (как на главной) === */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'var(--rating-conic)',    // взято из global.css
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: '9999px',
            background: '#0f0f15',
          }}
        />
      </div>

      {/* === Слой 2 и 3. Красная дуга + фото (в одном SVG поверх) === */}
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden={alt ? undefined : true}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={s / 2} cy={s / 2} r={inner / 2} />
          </clipPath>
        </defs>

        {/* Красная дуга «покраснения» */}
        <g transform={gTransform}>
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            fill="none"
            stroke="#dc2626" // red-600
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${prog * c} ${c}`}
            strokeDashoffset="0"
          />
        </g>

        {/* Фото поверх, обрезанное по кругу */}
        <image
          href={src}
          x={thickness / 2}
          y={thickness / 2}
          width={inner}
          height={inner}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>

      {alt ? <span className="sr-only">{alt}</span> : null}
    </div>
  )
}
