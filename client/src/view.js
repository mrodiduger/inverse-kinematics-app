// World space has y up and the arm base at the origin; canvas space has y down.
export function createView(width, height, reach, margin = 1.15) {
  const scale = Math.min(width, height) / 2 / (reach * margin)
  const centerX = width / 2
  const centerY = height / 2

  return {
    width,
    height,
    scale,
    toScreen([x, y]) {
      return [centerX + x * scale, centerY - y * scale]
    },
    toWorld([x, y]) {
      return [(x - centerX) / scale, (centerY - y) / scale]
    },
  }
}
