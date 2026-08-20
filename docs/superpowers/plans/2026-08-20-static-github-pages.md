# Static GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Flask/PyTorch simulation with a tested analytic JavaScript solver and deploy the Vue app as a static GitHub Pages site.

**Architecture:** Keep the existing one-page Vue visualization and move the numerical work into one focused `simulation.js` module. The module exposes the N-link kinematics, analytic gradients, optimizer state, and a one-step simulation API; `Visualizer.vue` only schedules steps and displays their results. A GitHub Actions workflow builds `client/dist` and publishes it to the repository's Pages project path.

**Tech Stack:** Vue 3, Vite 5, JavaScript, Vitest 1.6, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-20-static-github-pages-design.md`

## Global Constraints

- Preserve the current one-to-six-link selector, three losses, four optimizers, target selection, Simulate, and Stop controls.
- Use direct analytic formulas; do not add an automatic-differentiation or numerical-math dependency.
- Keep the existing page layout and approximate 50 ms animation cadence.
- Keep this as a small educational visualization: no worker, service layer, schema framework, logging system, or generalized validation abstraction.
- Use `/inverse-kinematics-app/` as the production Vite base path.
- Generated `client/dist` files must not remain tracked.

## File Map

- Create `client/src/simulation.js`: kinematics, analytic loss gradients, optimizers, and stateful simulation step.
- Create `client/src/simulation.test.js`: numeric regression tests with literal expected values.
- Modify `client/src/components/Visualizer.vue`: replace EventSource with the local simulation timer.
- Modify `client/src/App.vue`: render the only view directly.
- Modify `client/src/main.js`: stop installing Vue Router.
- Modify `client/index.html`: use the actual application title.
- Modify `client/package.json` and `client/package-lock.json`: add Vitest and remove unused browser dependencies.
- Modify `client/vite.config.js`: set the GitHub Pages base path.
- Modify `client/.gitignore`: ignore generated `dist` output.
- Create `.github/workflows/deploy-pages.yml`: test, build, upload, and deploy the static site.
- Modify `README.md`: explain analytic gradients, npm development, and Pages deployment.
- Delete `client/src/router/index.js`, `client/__init__.py`, `client/dist/`, `app.py`, `requirements.txt`, `Procfile`, and `runtime.txt` because the static app does not consume them.

---

### Task 1: Analytic Kinematics and Loss Gradients

**Files:**
- Create: `client/src/simulation.js`
- Create: `client/src/simulation.test.js`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`

**Interfaces:**
- Produces: `forwardKinematics(linkLengths: number[], jointAngles: number[]): number[][]`
- Produces: `endEffectorJacobian(linkLengths: number[], jointAngles: number[]): number[][]`, with one `[dx, dy]` row per joint
- Produces: `lossAndGradient(position: number[], target: number[], lossFunction: number): { loss: number, gradient: number[] }`
- Produces: `jointGradient(jacobian: number[][], endGradient: number[]): number[]`

- [ ] **Step 1: Install the test runner and add the test script**

Run from `client/`:

```bash
npm install --save-dev vitest@1.6.1
```

Then add this script to `client/package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing kinematics and loss tests**

Create `client/src/simulation.test.js`:

```js
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
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
cd client
npm test -- src/simulation.test.js
```

Expected: FAIL because `./simulation` does not exist.

- [ ] **Step 4: Implement the analytic numerical functions**

Create `client/src/simulation.js` with these functions:

```js
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
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
cd client
npm test -- src/simulation.test.js
```

Expected: all kinematics and loss tests PASS.

- [ ] **Step 6: Commit the numerical foundation**

```bash
git add client/package.json client/package-lock.json client/src/simulation.js client/src/simulation.test.js
git commit -m "feat: add analytic kinematics solver"
```

---

### Task 2: Optimizers and Simulation State

**Files:**
- Modify: `client/src/simulation.js`
- Modify: `client/src/simulation.test.js`

**Interfaces:**
- Consumes: the four numerical functions from Task 1
- Produces: `createOptimizer(optimizerId: number, parameterCount: number): { step(angles: number[], gradients: number[], learningRate: number): number[] }`
- Produces: `createSimulation(config): { step(): { positions: number[][], angles: number[], error: number, iteration: number, done: boolean } }`
- `config` uses the existing keys `learningRate`, `maxIteration`, `errorThreshold`, `lossFunction`, `optimizer`, `linkLengths`, `initialAngles`, and `target`

- [ ] **Step 1: Add failing optimizer reference tests**

Extend the import in `client/src/simulation.test.js` with `createOptimizer`, then append:

```js
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
```

- [ ] **Step 2: Run the optimizer tests and verify RED**

Run:

```bash
cd client
npm test -- src/simulation.test.js
```

Expected: FAIL because `createOptimizer` is not exported.

- [ ] **Step 3: Implement the four optimizers**

Append to `client/src/simulation.js`:

```js
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
```

- [ ] **Step 4: Run the optimizer tests and verify GREEN**

Run:

```bash
cd client
npm test -- src/simulation.test.js
```

Expected: all existing tests and the four optimizer cases PASS.

- [ ] **Step 5: Add failing simulation termination tests**

Extend the import in `client/src/simulation.test.js` with `createSimulation`, then append:

```js
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
```

- [ ] **Step 6: Run the termination tests and verify RED**

Run:

```bash
cd client
npm test -- src/simulation.test.js
```

Expected: FAIL because `createSimulation` is not exported.

- [ ] **Step 7: Implement one-step simulation state**

Append to `client/src/simulation.js`:

```js
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
```

- [ ] **Step 8: Run all numerical tests and verify GREEN**

Run:

```bash
cd client
npm test
```

Expected: all tests PASS with no warnings.

- [ ] **Step 9: Commit optimizer and simulation behavior**

```bash
git add client/src/simulation.js client/src/simulation.test.js
git commit -m "feat: run inverse kinematics in browser"
```

---

### Task 3: Connect the Vue Visualization and Remove the Backend

**Files:**
- Modify: `client/src/components/Visualizer.vue`
- Modify: `client/src/App.vue`
- Modify: `client/src/main.js`
- Modify: `client/index.html`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Modify: `client/.gitignore`
- Delete: `client/src/router/index.js`
- Delete: `client/__init__.py`
- Delete: `client/dist/`
- Delete: `app.py`
- Delete: `requirements.txt`
- Delete: `Procfile`
- Delete: `runtime.txt`

**Interfaces:**
- Consumes: `createSimulation(config)` from Task 2
- The timer calls `simulation.step()` every 50 ms and writes its returned positions, angles, error, iteration, and done flag into existing Vue state.

- [ ] **Step 1: Replace EventSource state with local simulation state**

In `client/src/components/Visualizer.vue`, import `onUnmounted` and the solver:

```js
import { ref, onMounted, onUnmounted, watch, computed, reactive } from 'vue'
import Config from '../components/Config.vue'
import { createSimulation } from '../simulation'
```

Remove `simulatePath`, `url`, `activeEventSource`, `readyState`, and its watcher. Add this state next to `positionsBuffer`:

```js
const isInSimulation = ref(false)
let activeSimulation = null
let simulationTimer = null
```

- [ ] **Step 2: Replace the server-backed simulation functions**

Replace `simulate()` and `stop()` with:

```js
function simulate() {
  if (target.value == null || isInSimulation.value) {
    return
  }

  activeSimulation = createSimulation({
    learningRate: learningRate.value,
    maxIteration: maxIteration.value,
    errorThreshold: errorThreshold.value,
    lossFunction: lossFunction.value,
    optimizer: optimizer.value,
    linkLengths: linkLengths.value,
    initialAngles: initialAngles.value,
    target: target.value,
  })
  iterationCount.value = 0
  isInSimulation.value = true
  simulationTimer = window.setTimeout(runSimulationStep, 50)
}

function runSimulationStep() {
  const state = activeSimulation.step()
  iterationCount.value = state.iteration
  error.value = state.error.toFixed(4)
  initialAngles.value = state.angles
  positionsBuffer.value = state.positions

  if (state.done) {
    activeSimulation = null
    simulationTimer = null
    isInSimulation.value = false
    return
  }

  simulationTimer = window.setTimeout(runSimulationStep, 50)
}

function stop() {
  if (simulationTimer != null) {
    window.clearTimeout(simulationTimer)
  }
  activeSimulation = null
  simulationTimer = null
  isInSimulation.value = false
}

onUnmounted(stop)
```

Update the Simulate button so a target is required:

```vue
:disabled="isInSimulation || target == null"
```

Leave the existing canvas target coordinates, drawing logic, controls, and styling unchanged.

- [ ] **Step 3: Remove the single-route router**

Replace `client/src/App.vue` with:

```vue
<template>
  <Visualizer />
</template>

<script setup>
import Visualizer from './components/Visualizer.vue'
</script>

<style>
#app {
  margin: 0vw;
  max-width: max-content;
}
</style>
```

In `client/src/main.js`, remove the router import and `app.use(router)`, while leaving the existing Bootstrap import and global error-handler comment untouched. Delete `client/src/router/index.js`.

- [ ] **Step 4: Remove unused client dependencies**

Run from `client/`:

```bash
npm uninstall axios p5 vue-router
```

Expected: `package.json` retains only `bootstrap` and `vue` in `dependencies`, and the lockfile is updated.

- [ ] **Step 5: Remove server and generated artifacts**

Delete the files and tracked build directory that the browser-only app no longer uses:

```bash
git rm app.py requirements.txt Procfile runtime.txt client/__init__.py
git rm -r client/dist
```

Add `/dist` to `client/.gitignore` so local and Actions builds remain generated artifacts.

- [ ] **Step 6: Set the application title**

Change the title in `client/index.html` to:

```html
<title>Inverse Kinematics via Gradient Descent</title>
```

- [ ] **Step 7: Run tests and a local production build**

Run:

```bash
cd client
npm test
npm run build
```

Expected: tests PASS; Vite creates a fresh `client/dist/index.html` and asset bundle without Vue compilation errors. `git status --short` must not list the regenerated `client/dist` directory.

- [ ] **Step 8: Commit the browser-only application**

```bash
git add client/src/components/Visualizer.vue client/src/App.vue client/src/main.js client/index.html client/package.json client/package-lock.json client/.gitignore
git add -u
git commit -m "refactor: remove inverse kinematics backend"
```

---

### Task 4: GitHub Pages Deployment and Documentation

**Files:**
- Modify: `client/vite.config.js`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

**Interfaces:**
- Vite emits assets below `/inverse-kinematics-app/`.
- GitHub Actions runs in `client/`, uploads `client/dist`, and deploys it to the `github-pages` environment.

- [ ] **Step 1: Configure Vite's repository base path**

Add the base property to `client/vite.config.js`:

```js
export default defineConfig({
  base: '/inverse-kinematics-app/',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

- [ ] **Step 2: Create the Pages workflow**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Set up Node
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: client
      - name: Test
        run: npm test
        working-directory: client
      - name: Build
        run: npm run build
        working-directory: client
      - name: Configure Pages
        uses: actions/configure-pages@v6
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: client/dist
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 3: Update the README for the static architecture**

Make only these documentation changes in `README.md`:

- Correct the title to “Inverse Kinematics via Gradient Descent Optimization.”
- Remove Python, Flask, PyTorch, Pydantic, Jinja, SymPy, NumPy, and Heroku-oriented badges and text.
- Replace the automatic-differentiation paragraph with the cumulative-angle Jacobian formulas used in `simulation.js`.
- Replace the repository tree with the Vue client, simulation module, tests, workflow, and design docs.
- Replace Python virtual-environment and `flask run` instructions with:

```bash
cd client
npm install
npm run dev
```

- Add the test and production-build commands:

```bash
npm test
npm run build
```

- Add a GitHub Pages section explaining that repository maintainers choose **Settings → Pages → GitHub Actions** once, after which pushes to `main` deploy automatically.

- [ ] **Step 4: Verify the complete static application**

Run:

```bash
cd client
npm ci
npm test
npm run build
rg -n '/inverse-kinematics-app/' dist/index.html
cd ..
rg -n 'torch|Flask|EventSource|/api/simulate|vue-router|axios|p5' . -g '!docs/superpowers/**' -g '!client/package-lock.json' -g '!client/dist/**'
git diff --check
git status --short
```

Expected:

- Tests and the production build PASS without warnings.
- `dist/index.html` contains the `/inverse-kinematics-app/` asset or favicon prefix.
- The obsolete-dependency search returns no application or README matches.
- `git diff --check` returns no output.
- `client/dist` does not appear in Git status.

- [ ] **Step 5: Commit deployment and documentation**

```bash
git add .github/workflows/deploy-pages.yml client/vite.config.js README.md
git commit -m "ci: deploy static app to GitHub Pages"
```

- [ ] **Step 6: Perform final history and cleanliness checks**

Run:

```bash
git log -5 --oneline
git status --short
```

Expected: the design and four implementation commits are visible, and the worktree is clean.
