import { describe, expect, it } from 'vitest'
import {
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
