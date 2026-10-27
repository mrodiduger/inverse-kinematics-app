<template>
  <article class="notes">
    <h2>The problem</h2>
    <p>
      The arm is a chain of rigid links joined by hinges. Choosing the joint angles and working out
      where the tip ends up is <em>forward kinematics</em>, and it is easy. Going the other way,
      from a desired tip position to the angles that reach it, is <em>inverse kinematics</em>.
      With more than one link there is usually no single answer, and with more than two there is
      rarely a neat formula.
    </p>
    <p>
      The shaded disc is everything the tip can reach. During a run the faint copies show where the
      arm was, the thin line traces the tip, and the dashed line is the remaining error.
    </p>

    <h2>Forward kinematics</h2>
    <p>
      Each joint angle <TexMath expression="\theta_i" /> is measured relative to the previous link,
      so the direction of link <TexMath expression="i" /> is the running sum
      <TexMath expression="\varphi_i = \theta_0 + \dots + \theta_i" />.
      The tip is the sum of the link vectors:
    </p>
    <TexMath display expression="x = \sum_i l_i \cos\varphi_i, \qquad y = \sum_i l_i \sin\varphi_i" />

    <h2>Turning it into a minimization</h2>
    <p>
      Instead of solving for the angles directly, measure how far the tip is from the target and
      make that number small. The loss options are three ways of measuring that distance. Squared
      error punishes large misses heavily, absolute error treats every millimetre the same, and
      Huber is squared close to the target and absolute far away.
    </p>

    <h2>Following the gradient</h2>
    <p>
      Nudging joint <TexMath expression="j" /> swings everything beyond it around that joint, so the
      tip moves at right angles to the line from the joint to the tip. Collecting those directions
      for every joint gives the Jacobian:
    </p>
    <TexMath
      display
      expression="J_{:,j} = \begin{bmatrix} -\sum_{i \ge j} l_i \sin\varphi_i \\ \phantom{-}\sum_{i \ge j} l_i \cos\varphi_i \end{bmatrix}"
    />
    <p>
      The chain rule turns the loss gradient at the tip into one number per joint,
      <TexMath expression="g = J^\top \nabla_p L" />, and each step moves the angles a little
      against it. Press <strong>Step</strong> to see every one of these values for the current pose.
      The arcs at the joints show which way each one turned, and by how much compared with the others.
    </p>
    <p>
      The optimizers differ only in how big each step is. SGD scales the raw gradient. Adagrad,
      RMSprop and Adam divide by a running measure of past gradients, so they take steps of roughly
      the learning rate in radians, whatever the size of the gradient.
    </p>
    <p>
      The solver works on a copy of the arm scaled to a total reach of 1. Without that, the gradient
      grows with the arm's length and a learning rate that works for two links would throw a
      six-link arm around.
    </p>

    <h2>The landscape</h2>
    <p>
      With two links, every pose is a point on a square map: shoulder angle across, elbow angle up.
      Shading each point by its distance to the target gives the surface gradient descent is walking
      on. Most reachable targets have two exact solutions, elbow one way and elbow the other, marked
      with crosses. Which one the arm finds depends only on where it starts, so click the map to try
      other starting poses.
    </p>
    <p>
      The horizontal lines through elbow 0 and ±π are the straight and folded arm. Along them the
      Jacobian loses a column's worth of information and the gradient can vanish for targets in line
      with the arm.
    </p>
    <p>
      <strong>Race all four optimizers</strong> runs SGD, Adam, Adagrad and RMSprop from the same pose
      to the same target, each with its default learning rate, and draws all four paths on the arm,
      the plot and the map.
    </p>

    <h2>Things to try</h2>
    <ul>
      <li>Compare runs: press Reset, run, change a setting, reset and run again. Earlier runs stay in the plot in grey.</li>
      <li>Place a target outside the arm's reach and watch it settle on pointing straight at it.</li>
      <li>Push the SGD learning rate past 3 and watch the arm overshoot and swing back and forth.</li>
      <li>Compare absolute error with squared error. Its gradient never shrinks, so near the target it keeps stepping past.</li>
      <li>With three or more links, run to the same target from different poses. Each run finds a different solution.</li>
    </ul>
  </article>
</template>

<script setup>
import TexMath from './TexMath.vue'
</script>

<style scoped>
.notes {
  max-width: 62ch;
}

.notes h2 {
  margin: 1.75rem 0 0.5rem;
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 600;
}

.notes h2:first-child {
  margin-top: 0;
}

.notes p,
.notes li {
  margin: 0 0 0.75rem;
}

.notes ul {
  padding-left: 1.2rem;
}

</style>
