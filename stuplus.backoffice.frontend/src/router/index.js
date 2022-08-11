import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */
import componentsRouter from './modules/components'
import chartsRouter from './modules/charts'
import tableRouter from './modules/table'
import nestedRouter from './modules/nested'
import { Role } from '../../enums/enums'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: [Role.Admin,'editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    noCache: true                if set true, the page will no be cached(default is false)
    affix: true                  if set true, the tag will affix in the tags-view
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'Dashboard', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  {
    path: '/users',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/user/index'),
        name: 'Users',
        meta: { title: 'Users', icon: 'el-icon-user', affix: true }
      }
    ],
    meta: {
      roles: [Role.Admin]
    }
  },
  {
    path: '/schools',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/schools/index'),
        name: 'Schools',
        meta: { title: 'Schools', icon: 'el-icon-school', affix: true }
      }
    ],
    meta: {
      roles: [Role.Admin]
    }
  },
  {
    path: '/faculties',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/faculty/index'),
        name: 'Faculties',
        meta: { title: 'Faculties', icon: 'el-icon-school', affix: true }
      }
    ],
    meta: {
      roles: [Role.Admin]
    }
  },
  {
    path: '/departments',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/department/index'),
        name: 'Departments',
        meta: { title: 'Departments', icon: 'el-icon-school', affix: true }
      }
    ],
    meta: {
      roles: [Role.Admin]
    }
  },
  {
    path: '/interests',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/interests/index'),
        name: 'Interests',
        meta: { title: 'Interest', icon: 'el-icon-football', affix: true }
      }
    ],
    meta: {
      roles: [Role.Admin]
    }
  },
  {
    path: '/announcements',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/announcement/index'),
        name: 'Announcements',
        meta: { title: 'Announcements', icon: 'el-icon-school', affix: true }
      }
    ]
  },
  {
    path: '/announcement-likes',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/announcement-like/index'),
        name: 'Announcement Likes',
        meta: { title: 'Announcement Likes', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  {
    path: '/announcement-comments',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/announcement-comment/index'),
        name: 'Announcement Comments',
        meta: { title: 'Announcement Comments', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  {
    path: '/announcement-comment-likes',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/announcement-comment-like/index'),
        name: 'Announcement Comment Likes',
        meta: { title: 'Announcement Comment Likes', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  {
    path: '/questions',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/question/index'),
        name: 'Questions',
        meta: { title: 'Questions', icon: 'el-icon-school', affix: true }
      }
    ]
  },
  {
    path: '/question-likes',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/question-like/index'),
        name: 'Question Likes',
        meta: { title: 'Question Likes', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  {
    path: '/question-comments',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/question-comment/index'),
        name: 'Question Comments',
        meta: { title: 'Question Comments', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  {
    path: '/question-comment-likes',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/question-comment-like/index'),
        name: 'Question Comment Likes',
        meta: { title: 'Question Comment Likes', icon: 'el-icon-user', affix: true }
      }
    ]
  },
  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
