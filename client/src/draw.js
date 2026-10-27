const PALETTE_VARIABLES = {
  grid: '--canvas-grid',
  axis: '--canvas-axis',
  reach: '--canvas-reach',
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

const GHOST_COUNT = 8

export function drawScene(ctx, view, scene, palette, pixelRatio = 1) {
  const { positions, target, reach, path } = scene
  const px = (value) => value * pixelRatio

  ctx.clearRect(0, 0, view.width, view.height)
  drawWorkspace(ctx, view, reach, palette, px)
  drawGrid(ctx, view, palette, px)
  drawGhosts(ctx, view, path, palette, px)
  drawTrail(ctx, view, path, palette, px)
  if (target) drawErrorVector(ctx, view, positions, target, palette, px)
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

function drawWorkspace(ctx, view, { inner, outer }, palette, px) {
  const [x, y] = view.toScreen([0, 0])

  ctx.fillStyle = palette.reach
  ctx.beginPath()
  ctx.arc(x, y, outer * view.scale + px(1), 0, 2 * Math.PI)
  ctx.arc(x, y, Math.max(0, inner * view.scale - px(1)), 0, 2 * Math.PI, true)
  ctx.fill()

  ctx.strokeStyle = palette.axis
  ctx.lineWidth = px(1)
  ctx.beginPath()
  ctx.arc(x, y, outer * view.scale, 0, 2 * Math.PI)
  ctx.stroke()
}

function drawGhosts(ctx, view, path, palette, px) {
  if (path.length < 2) return

  const spacing = Math.max(1, Math.floor(path.length / GHOST_COUNT))
  ctx.strokeStyle = palette.arm
  ctx.lineWidth = px(2)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let index = 0; index < path.length - 1; index += spacing) {
    ctx.globalAlpha = 0.06 + 0.14 * (index / path.length)
    ctx.beginPath()
    ctx.moveTo(...view.toScreen([0, 0]))
    path[index].forEach((point) => ctx.lineTo(...view.toScreen(point)))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawTrail(ctx, view, path, palette, px) {
  if (path.length < 2) return

  ctx.strokeStyle = palette.arm
  ctx.globalAlpha = 0.55
  ctx.lineWidth = px(1.5)
  ctx.beginPath()
  path.forEach((positions, index) => {
    const [x, y] = view.toScreen(positions[positions.length - 1])
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawErrorVector(ctx, view, positions, target, palette, px) {
  const [startX, startY] = view.toScreen(positions[positions.length - 1])
  const [endX, endY] = view.toScreen(target)

  ctx.strokeStyle = palette.target
  ctx.lineWidth = px(1.5)
  ctx.setLineDash([px(4), px(4)])
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.setLineDash([])
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
