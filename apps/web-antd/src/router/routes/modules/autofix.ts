import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:wrench',
      order: 21,
      title: '自动修复',
    },
    name: 'AutoFix',
    path: '/autofix',
    redirect: '/autofix/workflow',
    children: [
      {
        component: () => import('#/views/autofix/AutoFixWorkflow.vue'),
        meta: {
          icon: 'lucide:workflow',
          title: '修复工作流',
        },
        name: 'AutoFixWorkflow',
        path: '/autofix/workflow',
      },
    ],
  },
];

export default routes;
