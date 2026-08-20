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

export function createOptimizer(optimizerId, parameterCount) {
  const firstMoment = new Array(parameterCount).fill(0)
  const secondMoment = new Array(parameterCount).fill(0)
  let stepCount = 0

  return {
    step(angles, gradients, learningRate) {
      stepCount += 1

      if (optimizerId === 0) {
        return angles.map((angle, index) => angle - learningRate * gradients[index])
      }

      if (optimizerId === 1) {
        return angles.map((angle, index) => {
          firstMoment[index] = 0.9 * firstMoment[index] + 0.1 * gradients[index]
          secondMoment[index] = 0.999 * secondMoment[index] + 0.001 * gradients[index] ** 2
          const correctedFirst = firstMoment[index] / (1 - 0.9 ** stepCount)
          const correctedSecond = secondMoment[index] / (1 - 0.999 ** stepCount)
          return angle - learningRate * correctedFirst / (Math.sqrt(correctedSecond) + 1e-8)
        })
      }

      if (optimizerId === 2) {
        return angles.map((angle, index) => {
          secondMoment[index] += gradients[index] ** 2
          return angle - learningRate * gradients[index] / (Math.sqrt(secondMoment[index]) + 1e-10)
        })
      }

      return angles.map((angle, index) => {
        secondMoment[index] = 0.99 * secondMoment[index] + 0.01 * gradients[index] ** 2
        return angle - learningRate * gradients[index] / (Math.sqrt(secondMoment[index]) + 1e-8)
      })
    },
  }
}

export function createSimulation(config) {
  let angles = config.initialAngles.slice()
  let iteration = 0
  const optimizer = createOptimizer(config.optimizer, angles.length)

  return {
    step() {
      const positions = forwardKinematics(config.linkLengths, angles)
      const endPosition = positions[positions.length - 1]
      const { gradient: endGradient } = lossAndGradient(
        endPosition,
        config.target,
        config.lossFunction,
      )
      const jacobian = endEffectorJacobian(config.linkLengths, angles)
      const gradients = jointGradient(jacobian, endGradient)

      angles = optimizer.step(angles, gradients, config.learningRate)
      iteration += 1

      const nextPositions = forwardKinematics(config.linkLengths, angles)
      const nextEndPosition = nextPositions[nextPositions.length - 1]
      const { loss } = lossAndGradient(nextEndPosition, config.target, config.lossFunction)

      return {
        positions: nextPositions,
        angles: angles.slice(),
        error: loss,
        iteration,
        done: loss <= config.errorThreshold || iteration >= config.maxIteration,
      }
    },
  }
}
