const PALETTE_VARIABLES = {
  grid: '--canvas-grid',
  axis: '--canvas-axis',
  arm: '--arm',
  joint: '--canvas-background',
  target: '--target',
}

export function readPalette(element) {
  const style = getComputedStyle(element)
  return Object.fromEntries(
    Object.entries(PALETTE_VARIABLES).map(([key, name]) => [key, style.getPropertyValue(name).trim()]),
  )
}

export function drawScene(ctx, view, { positions, target }, palette, pixelRatio = 1) {
  const px = (value) => value * pixelRatio

  ctx.clearRect(0, 0, view.width, view.height)
  drawGrid(ctx, view, palette, px)
  drawArm(ctx, view, positions, palette, px)
  if (target) drawTarget(ctx, view, target, palette, px)
}

function drawGrid(ctx, view, palette, px) {
  const spacing = 0.5
  const [left, top] = view.toWorld([0, 0])
  const [right, bottom] = view.toWorld([view.width, view.height])

  ctx.lineWidth = px(1)
  ctx.strokeStyle = palette.grid
  ctx.beginPath()
  for (let x = Math.ceil(left / spacing) * spacing; x <= right; x += spacing) {
    const [screenX] = view.toScreen([x, 0])
    ctx.moveTo(screenX, 0)
    ctx.lineTo(screenX, view.height)
  }
  for (let y = Math.ceil(bottom / spacing) * spacing; y <= top; y += spacing) {
    const [, screenY] = view.toScreen([0, y])
    ctx.moveTo(0, screenY)
    ctx.lineTo(view.width, screenY)
  }
  ctx.stroke()

  const [originX, originY] = view.toScreen([0, 0])
  ctx.strokeStyle = palette.axis
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(view.width, originY)
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, view.height)
  ctx.stroke()
}

function drawArm(ctx, view, positions, palette, px) {
  const points = [view.toScreen([0, 0]), ...positions.map(view.toScreen)]
  const [baseX, baseY] = points[0]

  ctx.fillStyle = palette.arm
  ctx.fillRect(baseX - px(14), baseY + px(7), px(28), px(4))

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = palette.arm
  ctx.lineWidth = px(6)
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.stroke()

  ctx.fillStyle = palette.joint
  ctx.lineWidth = px(2)
  points.slice(0, -1).forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(x, y, px(5), 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  })

  const [endX, endY] = points[points.length - 1]
  ctx.fillStyle = palette.arm
  ctx.beginPath()
  ctx.arc(endX, endY, px(4), 0, 2 * Math.PI)
  ctx.fill()
}

function drawTarget(ctx, view, target, palette, px) {
  const [x, y] = view.toScreen(target)
  ctx.strokeStyle = palette.target
  ctx.lineWidth = px(2)
  ctx.beginPath()
  ctx.arc(x, y, px(8), 0, 2 * Math.PI)
  ctx.moveTo(x - px(13), y)
  ctx.lineTo(x + px(13), y)
  ctx.moveTo(x, y - px(13))
  ctx.lineTo(x, y + px(13))
  ctx.stroke()
}
