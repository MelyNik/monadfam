'use client'
import React from 'react'

type Props = {
  src: string
  alt?: string
  size?: number        // общий диаметр, px
  thickness?: number   // толщина кольца, px
  negProgress?: number // 0..1 — доля покраснения (net)
  className?: string
}

/**
 * База: ровное зелёное кольцо.
 * Красная дуга: растёт ПРОТИВ часовой от 9ч.
 * Реализовано без foreignObject/SVG-математики — чистым HTML/CSS (conic-gradient + mask),
 * чтобы избежать "красной точки" и проблем с типами.
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
  const t = thickness
  const inner = s - t
  const prog = Math.max(0, Math.min(1, negProgress))
  const showArc = prog > 0.0001
  const deg = prog * 360 // угол покраснения

  return (
    <div className={className} style={{ width: s, height: s, position: 'relative' }}>
      {/* БАЗОВОЕ КОЛЬЦО: зелёный обод + тёмная внутренняя "пробка" */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: '#22c55e',          // зелёная база
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

      {/* КРАСНАЯ ДУГА: против часовой от 9ч */}
      {showArc && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            // conic-gradient всегда растёт ПО часовой; чтобы получить ПРОТИВ —
            // зеркалим по X и стартуем "с 3ч" (90deg), что после зеркала = 9ч
            transform: 'scaleX(-1)',
            background: `conic-gradient(from 90deg, #dc2626 0deg, #dc2626 ${deg}deg, transparent ${deg}deg)`,
            // маска: превращаем заливку в "обод" нужной толщины
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent ${inner/2}px, #000 ${inner/2 + 0.5}px)`,
            mask: `radial-gradient(circle at 50% 50%, transparent ${inner/2}px, #000 ${inner/2 + 0.5}px)`,
          }}
        />
      )}

      {/* ФОТО */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          left: t / 2,
          top: t / 2,
          width: inner,
          height: inner,
          borderRadius: '9999px',
          objectFit: 'cover',
          background: '#1a1a1f',
          border: '2px solid #fff',
        }}
      />
      {alt ? <span className="sr-only">{alt}</span> : null}
    </div>
  )
}
