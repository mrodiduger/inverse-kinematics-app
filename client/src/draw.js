export function drawScene(ctx, view, { positions, target }, pixelRatio = 1) {
  const px = (value) => value * pixelRatio

  ctx.clearRect(0, 0, view.width, view.height)

  const base = view.toScreen([0, 0])
  const points = [base, ...positions.map(view.toScreen)]

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1f3a5f'
  ctx.lineWidth = px(6)
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.lineWidth = px(2)
  points.slice(0, -1).forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(x, y, px(5), 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  })

  const [endX, endY] = points[points.length - 1]
  ctx.fillStyle = '#1f3a5f'
  ctx.beginPath()
  ctx.arc(endX, endY, px(4), 0, 2 * Math.PI)
  ctx.fill()

  if (target) {
    const [x, y] = view.toScreen(target)
    ctx.strokeStyle = '#c2410c'
    ctx.lineWidth = px(2)
    ctx.beginPath()
    ctx.arc(x, y, px(8), 0, 2 * Math.PI)
    ctx.moveTo(x - px(12), y)
    ctx.lineTo(x + px(12), y)
    ctx.moveTo(x, y - px(12))
    ctx.lineTo(x, y + px(12))
    ctx.stroke()
  }
}
