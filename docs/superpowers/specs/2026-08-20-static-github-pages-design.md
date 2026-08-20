# Static GitHub Pages Design

## Goal

Turn the inverse-kinematics visualization into a browser-only Vue app that can be built and deployed on GitHub Pages without Flask, Python, PyTorch, or another automatic-differentiation library.

This remains a small, fun educational visualization. The implementation should favor direct formulas and readable code over production-oriented abstractions or defensive infrastructure.

## Preserved Behavior

- Users can select from one to six equal-length links.
- Users can set the learning rate, maximum iterations, error threshold, loss function, and optimizer.
- Squared, absolute, and Huber loss remain available.
- SGD, Adam, Adagrad, and RMSprop remain available with the defaults currently supplied by PyTorch.
- Clicking the canvas selects a target.
- Simulate animates optimization at roughly the current 50 ms cadence.
- Stop cancels the active simulation.

The visual styling and page layout are not being redesigned.

## Architecture

The existing Vue/Vite client becomes the whole application. A small JavaScript simulation module will contain pure numerical functions for forward kinematics, loss calculation, the analytic Jacobian, and optimizer updates. `Visualizer.vue` will own the timer and copy each simulation result into Vue state for drawing.

There will be no HTTP request, event stream, web worker, server process, or runtime dependency beyond the static browser assets. The one-page app does not need Vue Router, so `App.vue` can render the visualizer directly.

## Kinematics and Gradients

For link `i`, the cumulative joint angle is:

```text
phi[i] = theta[0] + ... + theta[i]
```

The end-effector position for `n` links is:

```text
x = sum(l[i] * cos(phi[i]), i = 0..n-1)
y = sum(l[i] * sin(phi[i]), i = 0..n-1)
```

For joint `j`, the analytic end-effector Jacobian is:

```text
dx/dtheta[j] = -sum(l[i] * sin(phi[i]), i = j..n-1)
dy/dtheta[j] =  sum(l[i] * cos(phi[i]), i = j..n-1)
```

Each loss function will return both its scalar loss and its gradient with respect to `(x, y)`. Multiplying that gradient by the Jacobian gives one gradient per joint. This supports the full one-to-six-link selector without automatic differentiation.

The JavaScript loss reductions and optimizer formulas will match the current PyTorch defaults used by the app, including Adam's running moments, Adagrad's accumulated squared gradients, and RMSprop's exponential squared-gradient average. Optimizer state exists only for one simulation run.

## Simulation Flow

1. A canvas click stores the target.
2. Simulate resets the iteration counter and creates optimizer state from the current joint angles.
3. Each 50 ms timer tick calculates the positions, loss, analytic gradient, and one optimizer update.
4. Positions and loss are recalculated after the update so the displayed arm, angles, and loss describe the same state.
5. The next tick is scheduled only while that post-update loss is above the threshold and the maximum iteration count has not been reached.
6. Stop clears the timer and marks the simulation inactive.

Changing the link count recreates link lengths and initial angles as it does today. Starting a new run after a completed or stopped run uses the angles currently shown by the visualization.

## Error Handling

The implementation will stay intentionally small:

- A simulation cannot start until the user has selected a target.
- Starting while a run is active remains disabled.
- Stop is enabled only during an active run.
- Existing HTML numeric limits remain the input constraints.

No logging service, schema framework, retry layer, or generalized validation system will be added.

## Static Build and Deployment

Vite will use `/inverse-kinematics-app/` as its production base path because this repository is deployed as a GitHub project site. A GitHub Actions workflow will run tests, build from `client/`, upload `client/dist`, and deploy the artifact to the `github-pages` environment on pushes to `main` or manual dispatch.

Generated `client/dist` files will no longer be committed. GitHub Actions will produce them for each deployment.

The obsolete server files will be removed:

- `app.py`
- `requirements.txt`
- `Procfile`
- `runtime.txt`
- `client/__init__.py`

Unused client dependencies (`axios`, `p5`, and `vue-router`) and the router module will also be removed.

The README will describe local npm development, the analytic-gradient implementation, and the one-time GitHub Pages setting: choose **GitHub Actions** as the Pages source.

## Testing

Vitest will cover only behavior worth protecting in this educational app:

- Forward kinematics for hand-checked one-, two-, and multi-link poses.
- The analytic Jacobian and each loss gradient using literal expected values.
- The first two updates for SGD, Adam, Adagrad, and RMSprop using fixed literal reference values generated from the current PyTorch implementation before it is removed.
- Termination at the error threshold and maximum iteration count.

The workflow and local verification will run the complete test suite and a production build. The built `index.html` will be checked through Vite's output to ensure assets use the GitHub Pages repository base path.

## Success Criteria

- The visualization runs locally using only Node.js and browser assets.
- Browser simulation supports one through six links and every current loss/optimizer choice.
- No Python, Flask, PyTorch, automatic-differentiation, API, or SSE code remains.
- `npm test` and `npm run build` pass in `client/`.
- The GitHub Pages workflow publishes the built client from `main`.
