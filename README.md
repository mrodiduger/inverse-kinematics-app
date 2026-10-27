# Inverse Kinematics via Gradient Descent Optimization

This is a small, interactive visualization of inverse kinematics solved through gradient-descent optimization. Choose between one and six links, click a target on the grid, and compare how different loss functions and optimizers move the arm. You can step through single iterations with every intermediate value shown, race all four optimizers from the same pose, and, for two links, see the whole loss landscape with the exact solutions marked.

## How it works

For link `i`, the cumulative joint angle is:

$$\phi_i = \sum_{k=0}^{i} \theta_k$$

The end-effector position of an `n`-link planar chain is:

$$x = \sum_{i=0}^{n-1} l_i \cos(\phi_i)$$

$$y = \sum_{i=0}^{n-1} l_i \sin(\phi_i)$$

The application minimizes the selected error between this position and the clicked target. Because the chain structure is known, its Jacobian is calculated directly:

$$\frac{\partial x}{\partial \theta_j} = -\sum_{i=j}^{n-1} l_i \sin(\phi_i)$$

$$\frac{\partial y}{\partial \theta_j} = \sum_{i=j}^{n-1} l_i \cos(\phi_i)$$

The loss gradient is multiplied by this Jacobian to obtain one gradient per joint. The browser then applies SGD, Adam, Adagrad, or RMSprop and redraws the arm after each update.

## Repository structure

```text
client/src/
├── simulation.js        kinematics, losses, Jacobian, optimizers
├── useSolver.js         runs, pauses and steps the solver
├── useRace.js           runs all four optimizers side by side
├── view.js              world to canvas coordinates
├── draw.js              canvas drawing
├── components/          Vue components for the canvas, controls and notes
└── App.vue              page layout
```

## Local development

```sh
git clone https://github.com/mrodiduger/inverse-kinematics-app
cd inverse-kinematics-app/client
npm install
npm run dev
```

Run the numerical tests and production build with:

```sh
npm test
npm run build
```

## License

This project is available under the MIT License.
