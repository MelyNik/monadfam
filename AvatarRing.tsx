'use client'
import React, { useId } from 'react'

type Props = {
  src: string
  alt?: string
  size?: number        // диаметр, px
  thickness?: number   // толщина кольца, px
  negProgress?: number // 0..1 — насколько «покраснело» по дуге
  className?: string
}

/**
 * База: ровное зелёное кольцо.
 * Дуга: красная, растёт ПРОТИВ часовой, старт в 9ч. При 0 — дугу не рисуем (нет «точки»).
 */
export default function AvatarRing({
  src,
  alt = '',
  size = 72,
  thickness = 4,
  negProgress = 0,
  className = '',
}: Props) {
  const s = size
  const r = (s - thickness) / 2
  const c = 2 * Math.PI * r

  // ограничим прогресс
  const prog = Math.max(0, Math.min(1, negProgress))
  const showArc = prog > 0.0001

  const inner = s - thickness
  const clipId = useId()

  // Поворачиваем старт дуги в 9ч и пускаем ПРОТИВ часовой:
  // применяются справа налево (rotate -> scale -> translate)
  const gTransform = `translate(${s} 0) scale(-1 1) rotate(180 ${s / 2} ${s / 2})`

  return (
    <div className={className} style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden={alt ? undefined : true}>
        <defs>
          <clipPath id={clipId}>
            <circle cx={s / 2} cy={s / 2} r={inner / 2} />
          </clipPath>
        </defs>

        {/* База — цельное зелёное кольцо */}
        <circle
          cx={s / 2}
          cy={s / 2}
          r={r}
          fill="none"
          stroke="#22c55e"            // green-500
          strokeWidth={thickness}
        />

        {/* Красная дуга — рисуем только если prog > 0 (чтобы не было «красной точки») */}
        {showArc && (
          <g transform={gTransform}>
            <circle
              cx={s / 2}
              cy={s / 2}
              r={r}
              fill="none"
              stroke="#dc2626"         // red-600
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${prog * c} ${c}`}
              strokeDashoffset="0"
            />
          </g>
        )}

        {/* Фото внутри круга */}
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
