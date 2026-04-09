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
import { createRouter, createWebHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

/**
 * Application routes configuration
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    redirect: '/auth/login',
  },
  {
    path: '/auth',
    name: 'Auth',
    component: {
      render() {
        return h(resolveComponent('router-view'))
      },
    },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login'),
      },
      {
        path: '404',
        name: 'Page404',
        component: () => import('@/views/auth/Page404'),
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/auth/Page500'),
      },
    ],
  },
  {
    path: '/app',
    name: 'App',
    component: DefaultLayout,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () =>
          import(/* webpackChunkName: "dashboard" */ '@/views/dashboard/Dashboard.vue'),
      },
      {
        path: 'appoinments',
        name: 'Appoinments',
        component: () => import('@/views/appointments/AppointmentPage.vue'),
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/services/ServicePage.vue'),
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('@/views/clients/ClientPage.vue'),
      },
      {
        path: 'enterpises',
        name: 'Enterpises',
        component: () => import('@/views/enterprises/EnterprisePage.vue'),
      },
    ],
  },
  // Catch-all para 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/auth/404',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access')
  const isProtectedRoute = to.path.startsWith('/app')
  const isLoginRoute = to.path === '/auth/login'

  if (isProtectedRoute && !token) {
    // Se tentar acessar rota protegida sem token, redireciona para login
    next({ name: 'Login' })
  } else if (isLoginRoute && token) {
    // Se já estiver logado e tentar acessar rota de auth (exceto login), redireciona para dashboard
    next({ name: 'Dashboard' })
  } else {
    // Caso contrário, permite navegação normal
    next()
  }
})
// Error handler para erros de navegação
router.onError((error) => {
  console.error('Erro de navegação:', error)
  router.push({ name: 'Page500' })
})

export default router
