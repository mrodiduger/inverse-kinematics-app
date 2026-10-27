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

// Distances from the base the end effector can reach.
export function workspace(linkLengths) {
  const outer = linkLengths.reduce((sum, length) => sum + length, 0)
  const inner = Math.max(0, 2 * Math.max(...linkLengths) - outer)
  return { inner, outer }
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

export const LOSS_FUNCTIONS = ['Squared error', 'Absolute error', 'Huber']

// Tuned for the normalized problem in createSimulation (total reach 1).
export const OPTIMIZERS = [
  { name: 'SGD', learningRate: 1 },
  { name: 'Adam', learningRate: 0.04 },
  { name: 'Adagrad', learningRate: 0.2 },
  { name: 'RMSprop', learningRate: 0.02 },
]

// A straight arm is singular: targets along it give a zero gradient.
export function restPose(linkCount) {
  return [Math.PI / 3, ...new Array(linkCount - 1).fill(1 / linkCount)]
}

export function lossAndGradient(position, target, lossFunction, huberDelta = 10) {
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

  const delta = huberDelta
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

// Solves a copy scaled to a total reach of 1, so one learning rate works for
// any arm size. Positions and distance are reported in world units; the
// step details stay in the scaled units the solver used.
export function createSimulation(config) {
  const reach = config.linkLengths.reduce((sum, length) => sum + length, 0)
  const linkLengths = config.linkLengths.map((length) => length / reach)
  const huberDelta = config.huberDelta ?? 0.05
  let target = config.target.map((value) => value / reach)
  let angles = config.initialAngles.slice()
  let iteration = 0
  const optimizer = createOptimizer(config.optimizer, angles.length)

  return {
    setTarget(nextTarget) {
      target = nextTarget.map((value) => value / reach)
    },

    step() {
      const positions = forwardKinematics(linkLengths, angles)
      const endPosition = positions[positions.length - 1]
      const { gradient: endGradient } = lossAndGradient(
        endPosition,
        target,
        config.lossFunction,
        huberDelta,
      )
      const jacobian = endEffectorJacobian(linkLengths, angles)
      const gradients = jointGradient(jacobian, endGradient)
      const previousAngles = angles

      angles = optimizer.step(angles, gradients, config.learningRate)
      iteration += 1

      const nextPositions = forwardKinematics(linkLengths, angles)
      const nextEndPosition = nextPositions[nextPositions.length - 1]
      const { loss } = lossAndGradient(nextEndPosition, target, config.lossFunction, huberDelta)
      const distance = Math.hypot(
        nextEndPosition[0] - target[0],
        nextEndPosition[1] - target[1],
      ) * reach
      const converged = distance <= config.tolerance

      return {
        positions: nextPositions.map(([x, y]) => [x * reach, y * reach]),
        angles: angles.slice(),
        details: {
          previousAngles,
          endPosition,
          target,
          endGradient,
          jacobian,
          gradients,
          angleStep: angles.map((angle, index) => angle - previousAngles[index]),
        },
        loss,
        distance,
        iteration,
        converged,
        done: converged || iteration >= config.maxIteration,
      }
    },
  }
}
