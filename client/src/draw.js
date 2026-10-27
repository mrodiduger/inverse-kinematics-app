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
  const read = (name) => style.getPropertyValue(name).trim()
  return {
    ...Object.fromEntries(Object.entries(PALETTE_VARIABLES).map(([key, name]) => [key, read(name)])),
    ink: read('--ink'),
    font: read('--font-mono'),
    background: read('--canvas-background'),
    landscapeHigh: read('--landscape-high'),
    optimizers: [0, 1, 2, 3].map((index) => read(`--optimizer-${index}`)),
  }
}

const GHOST_COUNT = 8
const MAX_ARC_SPAN = 1.2

export function drawScene(ctx, view, scene, palette, pixelRatio = 1) {
  const { positions, target, reach, path, jointSteps, racers = [] } = scene
  const px = (value) => value * pixelRatio

  ctx.clearRect(0, 0, view.width, view.height)
  drawWorkspace(ctx, view, reach, palette, px)
  drawGrid(ctx, view, palette, px)

  if (racers.length) {
    ctx.globalAlpha = 0.25
    drawArm(ctx, view, positions, palette, px)
    ctx.globalAlpha = 1
    drawRacers(ctx, view, racers, palette, px)
    if (target) drawTarget(ctx, view, target, palette, px)
    return
  }

  drawGhosts(ctx, view, path, palette, px)
  drawTrail(ctx, view, path, palette.arm, px)
  if (target) drawErrorVector(ctx, view, positions, target, palette, px)
  drawArm(ctx, view, positions, palette, px)
  if (jointSteps) drawJointSteps(ctx, view, positions, jointSteps, palette, px)
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

  ctx.fillStyle = palette.axis
  ctx.font = `${px(10)}px ${palette.font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let x = Math.ceil(left); x <= right; x += 1) {
    if (x !== 0) ctx.fillText(String(x), view.toScreen([x, 0])[0], originY + px(4))
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (let y = Math.ceil(bottom); y <= top; y += 1) {
    if (y !== 0) ctx.fillText(String(y), originX + px(4), view.toScreen([0, y])[1])
  }
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

function drawTrail(ctx, view, path, color, px) {
  if (path.length < 2) return

  ctx.strokeStyle = color
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

function drawRacers(ctx, view, racers, palette, px) {
  racers.forEach(({ path, optimizer }) => drawTrail(ctx, view, path, palette.optimizers[optimizer], px))

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = px(3)
  racers.forEach(({ positions, optimizer }) => {
    ctx.strokeStyle = palette.optimizers[optimizer]
    ctx.beginPath()
    ctx.moveTo(...view.toScreen([0, 0]))
    positions.forEach((point) => ctx.lineTo(...view.toScreen(point)))
    ctx.stroke()
  })

  drawRacerLabels(ctx, view, racers, palette, px)
}

// Optimizer colours are hard to tell apart for some colour-blind readers,
// so every arm is also labelled by name at its tip.
function drawRacerLabels(ctx, view, racers, palette, px) {
  const lineHeight = px(15)
  const labels = racers
    .map(({ positions, name, optimizer }) => {
      const [x, y] = view.toScreen(positions[positions.length - 1])
      return { x: x + px(10), y: y - px(10), name, optimizer }
    })
    .sort((first, second) => first.y - second.y)

  labels.forEach((label, index) => {
    if (index > 0) label.y = Math.max(label.y, labels[index - 1].y + lineHeight)
  })

  ctx.font = `${px(11)}px ${palette.font}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = px(3)
  labels.forEach(({ x, y, name, optimizer }) => {
    ctx.fillStyle = palette.optimizers[optimizer]
    ctx.beginPath()
    ctx.arc(x + px(3), y, px(3.5), 0, 2 * Math.PI)
    ctx.fill()

    ctx.strokeStyle = palette.background
    ctx.strokeText(name.toLowerCase(), x + px(11), y)
    ctx.fillStyle = palette.ink
    ctx.fillText(name.toLowerCase(), x + px(11), y)
  })
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
  ctx.lineWidth = px(5)
  ctx.shadowColor = palette.arm
  ctx.shadowBlur = px(8)
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.stroke()
  ctx.shadowBlur = 0

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

// Arc lengths are relative to the largest step, so they compare joints
// within one iteration rather than show absolute angles.
function drawJointSteps(ctx, view, positions, jointSteps, palette, px) {
  const largest = Math.max(...jointSteps.map(Math.abs))
  if (largest === 0) return

  const joints = [[0, 0], ...positions.slice(0, -1)]
  const radius = px(28)
  ctx.strokeStyle = palette.target
  ctx.fillStyle = palette.target
  ctx.lineWidth = px(1.5)

  jointSteps.forEach((angleStep, index) => {
    const span = MAX_ARC_SPAN * Math.abs(angleStep) / largest
    if (span < 0.05) return

    const [jointX, jointY] = joints[index]
    const [tipX, tipY] = positions[index]
    const linkAngle = Math.atan2(tipY - jointY, tipX - jointX)
    const direction = Math.sign(angleStep)
    const [centerX, centerY] = view.toScreen(joints[index])

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -(linkAngle - direction * span), -linkAngle, direction > 0)
    ctx.stroke()

    const endX = centerX + radius * Math.cos(linkAngle)
    const endY = centerY - radius * Math.sin(linkAngle)
    const tangentX = -Math.sin(linkAngle) * direction
    const tangentY = -Math.cos(linkAngle) * direction
    const size = px(6)
    ctx.beginPath()
    ctx.moveTo(endX + tangentX * size, endY + tangentY * size)
    ctx.lineTo(endX - tangentX * size + tangentY * size * 0.6, endY - tangentY * size - tangentX * size * 0.6)
    ctx.lineTo(endX - tangentX * size - tangentY * size * 0.6, endY - tangentY * size + tangentX * size * 0.6)
    ctx.closePath()
    ctx.fill()
  })
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
