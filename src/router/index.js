/**
 * router/index.js - Vue Router Configuration
 *
 * This file configures the application routing using Vue Router 5.
 * It defines all routes and navigation structure for the SPA.
 *
 * Routing Features:
 * - Hash-based routing (createWebHashHistory) for static hosting compatibility
 * - Lazy loading for all route components (code splitting)
 * - Nested routes for layout-based navigation
 * - Automatic scroll to top on navigation
 *
 * Route Structure:
 * - Protected routes: Wrapped in DefaultLayout with sidebar and header
 * - Public routes: Login, Register, 404, 500 pages without layout
 *
 * Adding New Routes:
 * 1. Import component (use dynamic import for code splitting)
 * 2. Add route object to appropriate section
 * 3. Update _nav.js for sidebar navigation (if needed)
 *
 * @see https://router.vuejs.org/
 */

import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

/**
 * Application routes configuration
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
          import(
            /* webpackChunkName: "dashboard" */ '@/views/dashboard/Dashboard.vue'
          ),
      },
      {
        path: '/theme',
        name: 'Theme',
        redirect: '/theme/typography',
      },
      {
        path: '/theme/colors',
        name: 'Colors',
        component: () => import('@/views/theme/Colors.vue'),
      },
      {
        path: '/theme/typography',
        name: 'Typography',
        component: () => import('@/views/theme/Typography.vue'),
      },
      {
        path: '/charts',
        name: 'Charts',
        component: () => import('@/views/charts/Charts.vue'),
      },
      {
        path: '/widgets',
        name: 'Widgets',
        component: () => import('@/views/widgets/Widgets.vue'),
      },
    ],
  },
  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Pages',
    component: {
      render() {
        return h(resolveComponent('router-view'))
      },
    },
    children: [
      {
        path: '404',
        name: 'Page404',
        component: () => import('@/views/pages/Page404'),
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/pages/Page500'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/pages/Login'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/pages/Register'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

export default router
