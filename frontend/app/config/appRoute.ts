export const appRoute = {
  admin: {
    root: '/admin',
    users: '/admin/user',
    package: '/admin/package',
    pt: '/admin/Pt',
    exercise: '/admin/exercise',
    program: '/admin/program',
    branch: '/admin/branch',
    ptKpi: '/admin/pt-kpi',
  },
  user: {
    root: '/my-packages',
  },
  home: {
    root: '/',
    packages: '/packages',
    coaches: '/coaches',
    profile: '/profile',
    workoutHistory: '/my-workout-history',
    programLearn: (programId: string) => `/programs/${programId}/learn`,
    purchasePackage: '/purchasePackage',
  },
  payment: {
    success: '/payment/success',
    fail: '/payment/fail',
  },
  pt: {
    root: '/pt',
    trainee: '/pt/trainee',
    kpi: '/pt/kpi',
  },
};
