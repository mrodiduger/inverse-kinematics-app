import { describe, expect, it } from 'vitest'
import {
  createOptimizer,
  createSimulation,
  endEffectorJacobian,
  forwardKinematics,
  jointGradient,
  lossAndGradient,
  restPose,
  twoLinkSolutions,
  workspace,
  wrapAngle,
} from './simulation'

function expectVectorClose(actual, expected) {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index], 10)
  })
}

function expectMatrixClose(actual, expected) {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((row, index) => {
    expectVectorClose(row, expected[index])
  })
}

describe('forwardKinematics', () => {
  it('places one horizontal link', () => {
    expectMatrixClose(forwardKinematics([2], [0]), [[2, 0]])
  })

  it('uses cumulative angles for two links', () => {
    expectMatrixClose(
      forwardKinematics([2, 3], [Math.PI / 2, -Math.PI / 2]),
      [[0, 2], [3, 2]],
    )
  })

  it('returns every joint position in a multi-link chain', () => {
    expectMatrixClose(
      forwardKinematics([1, 2, 3], [0, Math.PI / 2, -Math.PI / 2]),
      [[1, 0], [1, 2], [4, 2]],
    )
  })
})

describe('analytic gradients', () => {
  it('computes the end-effector Jacobian for every joint', () => {
    expectMatrixClose(
      endEffectorJacobian([2, 3], [Math.PI / 2, -Math.PI / 2]),
      [[-2, 3], [0, 3]],
    )
  })

  it('computes mean squared error and its end-position gradient', () => {
    const result = lossAndGradient([4, -2], [1, 2], 0)

    expect(result.loss).toBe(12.5)
    expect(result.gradient).toEqual([3, -4])
  })

  it('computes mean absolute error and its end-position gradient', () => {
    const result = lossAndGradient([4, -2], [1, 2], 1)

    expect(result.loss).toBe(3.5)
    expect(result.gradient).toEqual([0.5, -0.5])
  })

  it('uses the linear branch of mean Huber error', () => {
    const result = lossAndGradient([21, -18], [1, 2], 2)

    expect(result.loss).toBe(150)
    expect(result.gradient).toEqual([5, -5])
  })

  it('maps the end-position gradient onto joint angles', () => {
    expect(jointGradient([[-2, 3], [0, 3]], [3, -4])).toEqual([-18, -12])
  })
})

describe('optimizers', () => {
  const cases = [
    {
      name: 'SGD',
      id: 0,
      expected: [[0.9975, -1.995], [0.9965, -1.997]],
    },
    {
      name: 'Adam',
      id: 1,
      expected: [[0.9900000004, -1.9900000002], [0.981014248826313, -1.98654394181165]],
    },
    {
      name: 'Adagrad',
      id: 2,
      expected: [[0.990000000004, -1.990000000002], [0.986286093241838, -1.99371390676485]],
    },
    {
      name: 'RMSprop',
      id: 3,
      expected: [[0.900000039999984, -1.90000002], [0.86269986158341, -1.93730020537309]],
    },
  ]

  cases.forEach(({ name, id, expected }) => {
    it(`matches two reference ${name} updates`, () => {
      const optimizer = createOptimizer(id, 2)
      let angles = [1, -2]

      angles = optimizer.step(angles, [0.25, -0.5], 0.01)
      expectVectorClose(angles, expected[0])

      angles = optimizer.step(angles, [0.1, 0.2], 0.01)
      expectVectorClose(angles, expected[1])
    })
  })
})

describe('createSimulation', () => {
  const baseConfig = {
    learningRate: 0.001,
    maxIteration: 2,
    tolerance: 0.1,
    lossFunction: 0,
    optimizer: 0,
    linkLengths: [1],
    initialAngles: [0],
    target: [0, 100],
  }

  it('stops after the configured maximum iteration count', () => {
    const simulation = createSimulation(baseConfig)

    expect(simulation.step().done).toBe(false)
    const finalState = simulation.step()

    expect(finalState.iteration).toBe(2)
    expect(finalState.converged).toBe(false)
    expect(finalState.done).toBe(true)
  })

  it('stops when the end effector is within the tolerance', () => {
    const simulation = createSimulation({
      ...baseConfig,
      maxIteration: 500,
      target: [1, 0],
    })

    const state = simulation.step()

    expect(state.iteration).toBe(1)
    expect(state.distance).toBe(0)
    expect(state.positions).toEqual([[1, 0]])
    expect(state.converged).toBe(true)
    expect(state.done).toBe(true)
  })

  it('reports positions and distance in world units', () => {
    const simulation = createSimulation({
      ...baseConfig,
      linkLengths: [2, 3],
      initialAngles: [0, 0],
      target: [0, 5],
    })

    const state = simulation.step()

    expect(state.positions[1][0]).toBeCloseTo(5, 2)
    expect(state.distance).toBeCloseTo(Math.SQRT2 * 5, 1)
  })

  it('takes the same angle steps regardless of the arm scale', () => {
    const config = {
      ...baseConfig,
      learningRate: 0.5,
      linkLengths: [1, 1],
      initialAngles: restPose(2),
      target: [0.5, 1],
    }
    const small = createSimulation(config).step()
    const large = createSimulation({
      ...config,
      linkLengths: [100, 100],
      target: [50, 100],
    }).step()

    expectVectorClose(large.angles, small.angles)
  })

  it('reports the intermediate values of each step', () => {
    const simulation = createSimulation({
      ...baseConfig,
      learningRate: 0.5,
      linkLengths: [1, 1],
      initialAngles: [0, Math.PI / 2],
      target: [1, 0],
    })

    const { details, angles } = simulation.step()

    expectVectorClose(details.endPosition, [0.5, 0.5])
    expectVectorClose(details.endGradient, [0, 0.5])
    expectMatrixClose(details.jacobian, [[-0.5, 0.5], [-0.5, 0]])
    expectVectorClose(details.gradients, [0.25, 0])
    expectVectorClose(details.angleStep, [-0.125, 0])
    expectVectorClose(angles, [-0.125, Math.PI / 2])
  })

  it('follows a new target set during the run', () => {
    const simulation = createSimulation({
      ...baseConfig,
      maxIteration: 500,
      learningRate: 1,
      target: [0, 1],
    })

    simulation.setTarget([1, 0])
    let state
    do {
      state = simulation.step()
    } while (!state.done)

    expect(state.converged).toBe(true)
  })
})

describe('restPose', () => {
  it('starts bent so the gradient is not zero along the arm', () => {
    const pose = restPose(3)
    const positions = forwardKinematics([1, 1, 1], pose)
    const end = positions[2]
    const target = [end[0] * 0.5, end[1] * 0.5]
    const { gradient } = lossAndGradient(end, target, 0)
    const gradients = jointGradient(endEffectorJacobian([1, 1, 1], pose), gradient)

    expect(Math.max(...gradients.map(Math.abs))).toBeGreaterThan(0.01)
  })
})

describe('workspace', () => {
  it('is a ring for one link', () => {
    expect(workspace([2])).toEqual({ inner: 2, outer: 2 })
  })

  it('reaches the base when no link is longer than the rest combined', () => {
    expect(workspace([1, 1, 1])).toEqual({ inner: 0, outer: 3 })
  })

  it('leaves a hole when one link is longer than the rest combined', () => {
    expect(workspace([3, 1])).toEqual({ inner: 2, outer: 4 })
  })
})

describe('twoLinkSolutions', () => {
  it('returns two poses that both reach the target', () => {
    const target = [0.8, 1.1]
    const solutions = twoLinkSolutions([1, 1], target)

    expect(solutions).toHaveLength(2)
    solutions.forEach((angles) => {
      expectVectorClose(forwardKinematics([1, 1], angles)[1], target)
    })
    expect(solutions[0][1]).toBeCloseTo(-solutions[1][1], 10)
  })

  it('returns nothing for a target out of reach', () => {
    expect(twoLinkSolutions([1, 1], [3, 0])).toEqual([])
  })
})

describe('wrapAngle', () => {
  it('maps angles into [-π, π)', () => {
    expect(wrapAngle(3 * Math.PI / 2)).toBeCloseTo(-Math.PI / 2, 10)
    expect(wrapAngle(-3 * Math.PI / 2)).toBeCloseTo(Math.PI / 2, 10)
    expect(wrapAngle(0.5)).toBe(0.5)
  })
})
