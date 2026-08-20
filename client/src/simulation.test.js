import { describe, expect, it } from 'vitest'
import {
  createOptimizer,
  createSimulation,
  endEffectorJacobian,
  forwardKinematics,
  jointGradient,
  lossAndGradient,
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
    errorThreshold: 0.1,
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
    expect(finalState.done).toBe(true)
  })

  it('stops when the post-update error meets the threshold', () => {
    const simulation = createSimulation({
      ...baseConfig,
      maxIteration: 500,
      target: [1, 0],
    })

    const state = simulation.step()

    expect(state.iteration).toBe(1)
    expect(state.error).toBe(0)
    expect(state.positions).toEqual([[1, 0]])
    expect(state.done).toBe(true)
  })
})
