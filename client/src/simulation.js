export function forwardKinematics(linkLengths, jointAngles) {
  const positions = []
  let angle = 0
  let x = 0
  let y = 0

  for (let index = 0; index < linkLengths.length; index += 1) {
    angle += jointAngles[index]
    x += linkLengths[index] * Math.cos(angle)
    y += linkLengths[index] * Math.sin(angle)
    positions.push([x, y])
  }

  return positions
}

export function endEffectorJacobian(linkLengths, jointAngles) {
  const cumulativeAngles = []
  let angle = 0

  jointAngles.forEach((jointAngle) => {
    angle += jointAngle
    cumulativeAngles.push(angle)
  })

  return jointAngles.map((_, jointIndex) => {
    let dx = 0
    let dy = 0

    for (let linkIndex = jointIndex; linkIndex < linkLengths.length; linkIndex += 1) {
      dx -= linkLengths[linkIndex] * Math.sin(cumulativeAngles[linkIndex])
      dy += linkLengths[linkIndex] * Math.cos(cumulativeAngles[linkIndex])
    }

    return [dx, dy]
  })
}

export function lossAndGradient(position, target, lossFunction) {
  const difference = [position[0] - target[0], position[1] - target[1]]

  if (lossFunction === 0) {
    return {
      loss: (difference[0] ** 2 + difference[1] ** 2) / 2,
      gradient: difference,
    }
  }

  if (lossFunction === 1) {
    return {
      loss: (Math.abs(difference[0]) + Math.abs(difference[1])) / 2,
      gradient: difference.map((value) => Math.sign(value) / 2),
    }
  }

  const delta = 10
  const componentLoss = difference.map((value) => {
    const absoluteValue = Math.abs(value)
    return absoluteValue <= delta
      ? 0.5 * value ** 2
      : delta * (absoluteValue - 0.5 * delta)
  })
  const gradient = difference.map((value) => (
    Math.abs(value) <= delta ? value / 2 : delta * Math.sign(value) / 2
  ))

  return {
    loss: (componentLoss[0] + componentLoss[1]) / 2,
    gradient,
  }
}

export function jointGradient(jacobian, endGradient) {
  return jacobian.map(([dx, dy]) => (
    dx * endGradient[0] + dy * endGradient[1]
  ))
}
