'use client'
import React, { useId } from 'react'

type Props = {
  src: string
  alt?: string
  size?: number        // общий диаметр, px
  thickness?: number   // толщина кольца, px
  rating?: number      // сейчас не влияет на базовый градиент; оставил на будущее
  negProgress?: number // 0..1 — сколько «покраснело» по дуге
  className?: string
}

/**
 * Базовое кольцо теперь рендерится через CSS-конусный градиент var(--rating-conic)
 * (как на главной). Поверх него — SVG-дуга красного «покраснения», растущая ПРОТИВ
 * часовой, начиная с 9 часов (как обсуждали).
 *
 * Замечание по слоям:
 *  - Слой 1: CSS-градиентное кольцо (foreignObject внутри SVG)
 *  - Слой 2: Красная дуга (SVG stroke)
 *  - Слой 3: Фотография (image), обрезанная по кругу
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

  const clipId = useId()

  // Повернуть старт в 9ч и пустить дугу против часовой:
  //   rotate(180) вокруг центра => старт в 9ч
  //   затем зеркалим по X => визуально идёт против часовой
  const gTransform = `translate(${s} 0) scale(-1 1) rotate(180 ${s / 2} ${s / 2})`

  // Внутренний диаметр аватара (под картинку), чтобы он не перекрывал кольцо
  const inner = s - thickness

  return (
    <div className={className} style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden={alt ? undefined : true}>
        <defs>
          {/* Клип для круглой фотки */}
          <clipPath id={clipId}>
            <circle cx={s / 2} cy={s / 2} r={inner / 2} />
          </clipPath>
        </defs>

        {/* === Слой 1. Базовое градиентное кольцо — тот же градиент, что и на главной === */}
        {/* foreignObject позволяет использовать CSS-conic-gradient прямо в SVG */}
        <foreignObject x="0" y="0" width={s} height={s}>
          <div xmlns="http://www.w3.org/1999/xhtml"
               style={{
                 width: s,
                 height: s,
                 borderRadius: '9999px',
                 // ваш градиент: var(--rating-conic) уже определён в global.css
                 background: 'var(--rating-conic)',
                 // создаём толщину кольца через «внутренний круг»
                 display: 'grid',
                 placeItems: 'center',
               }}>
            <div style={{
              width: inner,
              height: inner,
              borderRadius: '9999px',
              background: '#0f0f15'
            }}/>
          </div>
        </foreignObject>

        {/* === Слой 2. Красная дуга «покраснения» поверх градиента === */}
        <g transform={gTransform}>
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            fill="none"
            stroke="#dc2626"                   // red-600
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${prog * c} ${c}`}
            strokeDashoffset="0"
          />
        </g>

        {/* === Слой 3. Фотография, обрезанная по кругу === */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
