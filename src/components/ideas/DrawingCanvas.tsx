import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  width: number
  erase: boolean
}

export interface DrawingCanvasHandle {
  exportImage: () => string
  clear: () => void
  undo: () => void
  isEmpty: () => boolean
}

interface Props {
  initialImage?: string
  color: string
  brushSize: number
  erase: boolean
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { initialImage, color, brushSize, erase },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const drawingRef = useRef(false)
  const sizedRef = useRef(false)

  function redraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    if (baseImageRef.current) {
      ctx.drawImage(baseImageRef.current, 0, 0, w, h)
    }
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke)
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) return
    ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = stroke.color
    ctx.beginPath()
    const [first, ...rest] = stroke.points
    ctx.moveTo(first.x, first.y)
    if (rest.length === 0) {
      ctx.lineTo(first.x + 0.1, first.y + 0.1)
    } else {
      for (const p of rest) ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    function size() {
      if (sizedRef.current) return
      const rect = container!.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = window.devicePixelRatio || 1
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      sizedRef.current = true

      if (initialImage) {
        const img = new Image()
        img.onload = () => {
          baseImageRef.current = img
          redraw()
        }
        img.src = initialImage
      } else {
        redraw()
      }
    }

    size()
    const ro = new ResizeObserver(size)
    ro.observe(container)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pointFromEvent(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drawingRef.current = true
    strokesRef.current.push({ points: [pointFromEvent(e)], color, width: brushSize, erase })
    redraw()
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return
    e.preventDefault()
    const stroke = strokesRef.current[strokesRef.current.length - 1]
    stroke.points.push(pointFromEvent(e))
    redraw()
  }

  function handlePointerUp() {
    drawingRef.current = false
  }

  useImperativeHandle(ref, () => ({
    exportImage: () => canvasRef.current?.toDataURL('image/png') ?? '',
    clear: () => {
      strokesRef.current = []
      baseImageRef.current = null
      redraw()
    },
    undo: () => {
      strokesRef.current.pop()
      redraw()
    },
    isEmpty: () => strokesRef.current.length === 0 && !baseImageRef.current,
  }))

  return (
    <div ref={containerRef} className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  )
})
