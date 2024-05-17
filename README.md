# Inverse Kinematics via Gradien Descent Optimization

<p align="center">
  <img src="https://img.icons8.com/?size=512&id=55494&format=png" width="100" />
</p>
<p align="center">
    <h1 align="center">INVERSE-KINEMATICS-APP</h1>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/mrodiduger/inverse-kinematics-app?style=flat&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/mrodiduger/inverse-kinematics-app?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/mrodiduger/inverse-kinematics-app?style=flat&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/mrodiduger/inverse-kinematics-app?style=flat&color=0080ff" alt="repo-language-count">
<p>
<p align="center">
		<em>Developed with the software and tools below.</em>
</p>
<p align="center">
	<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
	<img src="https://img.shields.io/badge/Pydantic-E92063.svg?style=flat&logo=Pydantic&logoColor=white" alt="Pydantic">
	<img src="https://img.shields.io/badge/HTML5-E34F26.svg?style=flat&logo=HTML5&logoColor=white" alt="HTML5">
	<img src="https://img.shields.io/badge/Jinja-B41717.svg?style=flat&logo=Jinja&logoColor=white" alt="Jinja">
	<img src="https://img.shields.io/badge/Bootstrap-7952B3.svg?style=flat&logo=Bootstrap&logoColor=white" alt="Bootstrap">
	<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
	<br>
	<img src="https://img.shields.io/badge/Vue.js-4FC08D.svg?style=flat&logo=vuedotjs&logoColor=white" alt="Vue.js">
	<img src="https://img.shields.io/badge/SymPy-3B5526.svg?style=flat&logo=SymPy&logoColor=white" alt="SymPy">
	<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
	<img src="https://img.shields.io/badge/NumPy-013243.svg?style=flat&logo=NumPy&logoColor=white" alt="NumPy">
	<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
	<img src="https://img.shields.io/badge/Flask-000000.svg?style=flat&logo=Flask&logoColor=white" alt="Flask">
</p>
<hr>

## 🔗 Quick Links

> - [📍 Overview](#-overview)
> - [📂 Repository Structure](#-repository-structure)
> - [🚀 Getting Started](#-getting-started)
>   - [⚙️ Installation](#️-installation)
>   - [🤖 Running inverse-kinematics-app](#-running-inverse-kinematics-app)
> - [📄 License](#-license)

---

## Some Thoughts

Well, this repository is the kinda-final form of my hobby project. I first got the idea from a [visualization by Matt Henderson](https://x.com/matthen2/status/1520427516997025792) a while ago, and recently decided to implement it to expose myself to web development a bit. I also deployed the application to Heroku but don't want to pay for more resources, so I hope no more than a few users try to use it at the same time :D You can use it locally by following the installation steps, though :) I think it might be a good educational resource for some instructors to use in lectures.

## 📍 Overview

This web application aims to visualize inverse kinematics via gradient descent optimization.

### Inverse Kinematics

Inverse kinematics (IK) deals with finding the joint parameters (angles) that provide a desired position of the robot's end effector. For a robot arm in a 2D plane, this involves calculating the angles of its joints such that the end of the arm reaches a specific point $(x, y)$ in the plane.

### Kinematic Equations

For a simple 2-joint (2-link) robot arm in a 2D plane, the forward kinematics can be expressed as:

$$x = l_1 cos(θ_1) + l_2 cos(θ_1 + θ_2)$$

$$y = l_1 sin(θ_1) + l_2 sin(θ_1 + θ_2)$$

Where:

$l_1$ and $l_2$ are the lengths of the robot arm's links.
$θ_1$ and $θ_2$ are the angles of the joints.
The goal of inverse kinematics is to find the angles $θ_1$ and $θ_2$ given the desired $(x, y)$ position.

### Optimization via Gradient Descent

Gradient descent is an optimization algorithm used to minimize a function by iteratively moving towards the steepest descent, i.e., the negative gradient of the function. In the context of inverse kinematics, the function we want to minimize is the error between the current position of the end effector and the target position.

### Error Function

The error function E can be defined as the squared Euclidean distance between the current end effector position $(x_current, y_current)$ and the target position $(x_target, y_target)$:

$$E(θ_1, θ_2) = 1/2 [(x_current - x_target)^2 + (y_current - y_target)^2]$$

In the application, you can select various error functions and observe the effect of different error functions on the optimization process

### Gradient Calculation

To minimize the error E, we need to compute its gradients with respect to the joint angles $θ_1$ and $θ_2$:

$$∂E/∂θ_1$$

$$∂E/∂θ_2$$

Using the chain rule and the kinematic equations, these gradients can be derived.

We compute the gradients by defining joint angles as parameters and calculating the end effector position as a function of joint angles to leverage automatic differentiation of PyTorch.

## Iterative Update

With the gradients computed, the joint angles are updated iteratively using the gradient descent rule:

$$θ_1 ← θ_1 - α ∂E/∂θ_1$$

$$θ_2 ← θ_2 - α ∂E/∂θ_2$$

Here, $α$ is the learning rate, a small positive value that controls the step size of the update.

### Convergence

The iterative process continues until the error E is minimized to an acceptable level, meaning the end effector is sufficiently close to the target position.

### Summary

Inverse kinematics via gradient descent optimization involves:

Defining the kinematic equations for the robot arm.
Setting up an error function representing the distance between the current and target positions.
Calculating the gradients of the error function with respect to the joint angles.
Iteratively updating the joint angles using gradient descent to minimize the error.

---

## 📂 Repository Structure

```sh
└── inverse-kinematics-app/
    ├── Procfile
    ├── README.md
    ├── app.py
    ├── client
    │   ├── .gitignore
    │   ├── .vscode
    │   │   └── extensions.json
    │   ├── README.md
    │   ├── __init__.py
    │   ├── dist
    │   │   ├── assets
    │   │   │   ├── index-Bw-pKMAr.js
    │   │   │   └── index-CV_YbN5t.css
    │   │   ├── favicon.ico
    │   │   └── index.html
    │   ├── index.html
    │   ├── jsconfig.json
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── public
    │   │   └── favicon.ico
    │   ├── src
    │   │   ├── App.vue
    │   │   ├── assets
    │   │   │   ├── base.css
    │   │   │   ├── logo.svg
    │   │   │   └── main.css
    │   │   ├── components
    │   │   │   ├── Config.vue
    │   │   │   └── Visualizer.vue
    │   │   ├── main.js
    │   │   └── router
    │   │       └── index.js
    │   └── vite.config.js
    ├── requirements.txt
    └── runtime.txt
```

## 🚀 Getting Started

### ⚙️ Installation

1. Clone the inverse-kinematics-app repository:

```sh
git clone https://github.com/mrodiduger/inverse-kinematics-app
```

2. Change to the project directory:

```sh
cd inverse-kinematics-app
```

3. Create a virtual environment and install dependecies:

```sh
npm install
python3 -m venv -venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

### 🤖 Running inverse-kinematics-app

Use the following command to run inverse-kinematics-app:

```sh
flask run
```

## 📄 License

This project is protected under the MIT License.

---
