'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  AppState, Row, loadState, saveState, clone,
  startOfMonthUTC, nextMonthStartFrom,
  resetDemoData, pushEvent
} from '../../lib/state'

const MS30D = 30 * 24 * 60 * 60 * 1000

function fmtLeft(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600).toString().padStart(2,'0')
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2,'0')
  const s = Math.floor(sec % 60).toString().padStart(2,'0')
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}:${m}:${s}`
}

const yourAvatar = 'https://unavatar.io/x/your_handle'
type Tab = 'mutual' | 'await_their' | 'await_ours'

function isVotingDay(ts: number) { const dow = new Date(ts).getDay(); return dow === 2 || dow === 6 }
function canVoteOnRow(r: Row, tab: Tab, now: number) {
  if (tab === 'await_ours') return false
  if ((r.statusMode ?? 'online') !== 'online') return false
  if (!isVotingDay(now)) return false
  if ((r.days ?? 0) < 4) return false
  if (r.myVote) return false
  return true
}
function statusBadge(r: Row) {
  const sm = r.statusMode ?? 'online'
  if (sm === 'online') return { label: 'online', className: 'bg-green-600/25 text-green-300' }
  if (sm === 'short')  return { label: 'шорт',  className: 'bg-red-600/25 text-red-300' }
  return { label: 'лонг', className: 'bg-red-600/25 text-red-300' }
}

/* Один и тот же знак «палец», для down — поворот (визуально идентичные) */
const Thumb = (props:any) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M2 10h4v12H2V10zm8 12h6a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4l.8-4.2A2 2 0 0 0 10 5l-4 7v10z"/>
  </svg>
)

export default function ProfilePage(){
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab]     = useState<Tab>('mutual')
  const [q, setQ]         = useState('')
  const [selected, setSelected] = useState<Row | null>(null)

  const qNorm = q.toLowerCase().replace(/^@/, '')
  const match = (r: Row) => {
    const h = (r.handle || '').toLowerCase().replace(/^@/, '')
    const n = (r.name   || '').toLowerCase()
    return h.includes(qNorm) || n.includes(qNorm)
  }

  // Удаляем центральную верхнюю кнопку "Monad" только на странице профиля
  useEffect(() => {
    const removeCenterMonad = () => {
      const els = Array.from(document.querySelectorAll('a,button')) as HTMLElement[]
      const target = els.find(el => {
        const text = (el.textContent || '').trim().toLowerCase()
        if (text !== 'monad') return false
        const rect = el.getBoundingClientRect()
        const isTop = rect.top < 80            // верхняя кромка экрана (хедер)
        const centerX = (rect.left + rect.right) / 2
        const isCentered = Math.abs(centerX - window.innerWidth / 2) < 120 // по центру
        return isTop && isCentered
      })
      if (target) target.remove() // именно удаляем узел, не скрываем
    }

    removeCenterMonad() // сразу
    const mo = new MutationObserver(removeCenterMonad)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  const lists   = state.lists
  const removed = state.removed

  const rows = useMemo(() => {
    const list = tab === 'mutual' ? lists.mutual : tab === 'await_their' ? lists.await_their : lists.await_ours
    return list.filter(match)
  }, [tab, lists, q])

  const counts = { mutual: lists.mutual.length, await_their: lists.await_their.length, await_ours: lists.await_ours.length }
  const write =
