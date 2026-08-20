# Inverse Kinematics via Gradient Descent Optimization

<p align="center">
  <img src="https://img.icons8.com/?size=512&id=55494&format=png" width="100" alt="Robot arm icon" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/mrodiduger/inverse-kinematics-app?style=flat&color=0080ff" alt="license">
  <img src="https://img.shields.io/github/last-commit/mrodiduger/inverse-kinematics-app?style=flat&logo=git&logoColor=white&color=0080ff" alt="last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Vue.js-4FC08D.svg?style=flat&logo=vuedotjs&logoColor=white" alt="Vue.js">
  <img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Bootstrap-7952B3.svg?style=flat&logo=Bootstrap&logoColor=white" alt="Bootstrap">
</p>

This is a small, interactive visualization of inverse kinematics solved through gradient-descent optimization. Choose between one and six links, click a target on the canvas, and compare how different loss functions and optimizers move the arm.

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
inverse-kinematics-app/
├── .github/workflows/deploy-pages.yml
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Config.vue
│   │   │   └── Visualizer.vue
│   │   ├── simulation.js
│   │   ├── simulation.test.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── docs/superpowers/
└── README.md
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
