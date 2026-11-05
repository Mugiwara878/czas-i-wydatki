import { useEffect, useRef, useState } from 'react'
import { hexToHsv, hsvToHex, isValidHex, type Hsv } from '../../lib/color'

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? { h: 231, s: 70, v: 90 })
  const [hexInput, setHexInput] = useState(value)
  const svRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parsed = hexToHsv(value)
    if (parsed) setHsv(parsed)
    setHexInput(value)
  }, [value])

  function commit(next: Hsv) {
    setHsv(next)
    const hex = hsvToHex(next)
    setHexInput(hex)
    onChange(hex)
  }

  function updateFromPointer(e: React.PointerEvent) {
    const rect = svRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp01((e.clientX - rect.left) / rect.width)
    const y = clamp01((e.clientY - rect.top) / rect.height)
    commit({ ...hsv, s: x * 100, v: (1 - y) * 100 })
  }

  function handleSvDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updateFromPointer(e)
  }

  function handleSvMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return
    updateFromPointer(e)
  }

  function handleHexChange(v: string) {
    setHexInput(v)
    if (isValidHex(v)) {
      const hex = v.startsWith('#') ? v : `#${v}`
      const parsed = hexToHsv(hex)
      if (parsed) {
        setHsv(parsed)
        onChange(hex)
      }
    }
  }

  const pureHue = hsvToHex({ h: hsv.h, s: 100, v: 100 })

  return (
    <div className="space-y-3">
      <div
        ref={svRef}
        onPointerDown={handleSvDown}
        onPointerMove={handleSvMove}
        className="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-2xl select-none"
        style={{ backgroundColor: pureHue }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, rgba(0,0,0,0))' }} />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{ left: `${hsv.s}%`, bottom: `${hsv.v}%`, backgroundColor: hsvToHex(hsv) }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={360}
        value={hsv.h}
        onChange={(e) => commit({ ...hsv, h: Number(e.target.value) })}
        className="h-3 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:bg-white"
        style={{
          background:
            'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      />

      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 shrink-0 rounded-xl border border-white/60 dark:border-white/10"
          style={{ backgroundColor: hsvToHex(hsv) }}
        />
        <input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
        />
      </div>
    </div>
  )
}
