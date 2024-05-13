import { createRouter, createWebHistory } from 'vue-router'
import Visualizer from '../components/Visualizer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'visualizer',
      component: Visualizer
    },
  ]
})

export default router
