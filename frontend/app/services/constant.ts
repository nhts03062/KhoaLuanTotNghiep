export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    SIGN_UP: string;
    PROFILE: string;
    VERIFY_ACCOUNT: string;
    GET_PROFILE: string;
    UPDATE_PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
    GET_PURCHASE_PACKAGE: string;
    GET_AVAILABLE_PTS: string;
    GET_CHECK_IN_HISTORY: string;
    GET_PT_TRAINING_HISTORY: string;
    GET_TODAY_EXERCISE: string;
    CREATE_WORKOUT_HISTORY: string;
    GET_LIST_WORKOUT_HISTORY: string;
    CREATE_PT_ASSIST_REQUEST: string;
    GET_PT_WEEK_BOOKING_GRID: string;
  };
  PACKAGE: {
    GET_ALL: string;
    UPDATE_PACKAGE: (packageId: string) => string;
    DELETE_PACKAGE: (packageId: string) => string;
  };
  PT: {
    GET_ALL: string;
    CREATE_PT_ACCOUNT: string;
    UPDATE_PT_ACCOUNT: (accountId: string) => string;
    DEACTIVATE_PT_ACCOUNT: (accountId: string) => string;
    GET_REQUESTS_LIST: string;
    GET_ACCEPTED_REQUESTS_LIST: string;
    APPROVE_REQUEST: (requestId: string) => string;
    REJECT_REQUEST: (requestId: string) => string;
    GET_ASSIST_REQUEST: string;
    ACCEPT_ASSIST_REQUEST: (requestId: string) => string;
    REJECT_ASSIST_REQUEST: (requestId: string) => string;
    GET_SCHEDULE: string;
    GET_BOOKING_GRID_DEFINITION: string;
    CREATE_TRAINING_SLOT: string;
    GET_TRAINING_SLOTS: string;
    ASSIGN_PROGRAM_TO_USER: () => string;
    REPORT_USER_SESSION: () => string;
  };
  BRANCH: {
    GET_ALL: string;
    GET_BY_ID: (branchId: string) => string;
    CREATE_BRANCH: string;
    UPDATE_BRANCH: (branchId: string) => string;
    DELETE_BRANCH: (branchId: string) => string;
  };
  ADMIN: {
    GET_ACCOUNT_USER: string;
    UPDATE_USER_ACCOUNT: (accountId: string) => string;
    DEACTIVATE_USER_ACCOUNT: (accountId: string) => string;
    CREATE_PACKAGE: string;
  };
  EXERCISE: {
    GET_ALL: string;
    GET_BY_ID: (exerciseId: string) => string;
    CREATE_EXERCISE: string;
    UPDATE_EXERCISE: (exerciseId: string) => string;
    DELETE_EXERCISE: (exerciseId: string) => string;
  };
  PROGRAM: {
    GET_ALL: string;
    CREATE_PROGRAM: string;
    CREATE_PROGRAM_DAY: (programId: string) => string;
    CREATE_PROGRAM_DAY_EXERCISE: (programId: string, dayId: string) => string;
  };
  AI: {
    RECOMMEND_PROGRAM: string;
    RECOMMEND_NUTRITION: string;
  };
  PT_KPI: {
    ADMIN_GET_POLICY: string;
    ADMIN_UPSERT_POLICY: string;
    ADMIN_GET_MONTHLY_SUMMARY: string;
    ADMIN_UPDATE_PAYOUT: (payoutId: string) => string;
    PT_GET_MONTHLY: string;
  };
  ANALYTICS: {
    OVERVIEW: string;
    REVENUE_TIMESERIES: string;
    REVENUE_BY_BRANCH: string;
    REVENUE_BY_PACKAGE: string;
    OPERATIONS: string;
  };
  PAYMENT: {
    VNPAY_DEMO_CHECKOUT: string;
  };
}

export const API: API_PROPS = {
  AUTHENTICATION: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/account/sign-up',
    PROFILE: '/auth/profile',
    VERIFY_ACCOUNT: '/account/verify-account',
    GET_PROFILE: '/account/profile',
    UPDATE_PROFILE: '/account/profile',
  },
  USER: {
    PURCHASE_PACKAGE: '/user-package/purchase',
    GET_PURCHASE_PACKAGE: '/user-package/my-packages',
    GET_AVAILABLE_PTS: '/user-package/available-pts',
    GET_CHECK_IN_HISTORY: '/user-package/checkins/grouped',
    GET_PT_TRAINING_HISTORY: '/user-package/pt-training-history',
    GET_TODAY_EXERCISE: '/user-package/today-exercises',
    CREATE_WORKOUT_HISTORY: '/user-package/workout-history',
    GET_LIST_WORKOUT_HISTORY: '/user-package/workout-history',
    CREATE_PT_ASSIST_REQUEST: '/user-package/pt-assist-request',
    GET_PT_WEEK_BOOKING_GRID: '/user-package/pt-week-booking-grid',
  },
  PACKAGE: {
    GET_ALL: '/package',
    UPDATE_PACKAGE: (packageId: string) => `/package/${packageId}`,
    DELETE_PACKAGE: (packageId: string) => `/package/${packageId}`,
  },
  PT: {
    GET_ALL: '/account/pt-accounts',
    CREATE_PT_ACCOUNT: '/account/pt-accounts',
    UPDATE_PT_ACCOUNT: (accountId: string) =>
      `/account/pt-accounts/${accountId}`,
    DEACTIVATE_PT_ACCOUNT: (accountId: string) =>
      `/account/pt-accounts/${accountId}`,
    GET_REQUESTS_LIST: '/pt/requested-packages',
    GET_ACCEPTED_REQUESTS_LIST: '/pt/accepted-packages',
    APPROVE_REQUEST: (requestId: string) => `/pt/accepted-request/${requestId}`,
    REJECT_REQUEST: (requestId: string) => `/pt/rejected-request/${requestId}`,
    GET_ASSIST_REQUEST: '/pt/pt-assist-requests',
    ACCEPT_ASSIST_REQUEST: (requestId: string) =>
      `/pt/pt-assist-requests/${requestId}/accept`,
    REJECT_ASSIST_REQUEST: (requestId: string) =>
      `/pt/pt-assist-requests/${requestId}/reject`,
    GET_SCHEDULE: '/pt/assist-schedule',
    GET_BOOKING_GRID_DEFINITION: '/pt/booking-slot-grid-definition',
    CREATE_TRAINING_SLOT: '/pt/training-slots',
    GET_TRAINING_SLOTS: '/pt/training-slots',
    ASSIGN_PROGRAM_TO_USER: () => `/pt/assign-program-to-user`,
    REPORT_USER_SESSION: () => `/pt/session-reports`,
  },
  BRANCH: {
    GET_ALL: '/branch',
    GET_BY_ID: (branchId: string) => `/branch/${branchId}`,
    CREATE_BRANCH: '/branch',
    UPDATE_BRANCH: (branchId: string) => `/branch/${branchId}`,
    DELETE_BRANCH: (branchId: string) => `/branch/${branchId}`,
  },
  ADMIN: {
    GET_ACCOUNT_USER: '/account/user-accounts',
    UPDATE_USER_ACCOUNT: (accountId: string) =>
      `/account/user-accounts/${accountId}`,
    DEACTIVATE_USER_ACCOUNT: (accountId: string) =>
      `/account/user-accounts/${accountId}`,
    CREATE_PACKAGE: '/package',
  },
  EXERCISE: {
    GET_ALL: '/exercise',
    GET_BY_ID: (exerciseId: string) => `/exercise/${exerciseId}`,
    CREATE_EXERCISE: '/exercise',
    UPDATE_EXERCISE: (exerciseId: string) => `/exercise/${exerciseId}`,
    DELETE_EXERCISE: (exerciseId: string) => `/exercise/${exerciseId}`,
  },
  PROGRAM: {
    GET_ALL: '/program',
    CREATE_PROGRAM: '/program',
    CREATE_PROGRAM_DAY: (programId: string) => `/program/${programId}/days`,
    CREATE_PROGRAM_DAY_EXERCISE: (programId: string, dayId: string) =>
      `/program/${programId}/days/${dayId}/exercises`,
  },
  AI: {
    RECOMMEND_PROGRAM: '/ai/recommend-packages',
    RECOMMEND_NUTRITION: '/ai/recommend-nutrition',
  },
  PT_KPI: {
    ADMIN_GET_POLICY: '/admin/pt-kpi/policies',
    ADMIN_UPSERT_POLICY: '/admin/pt-kpi/policies',
    ADMIN_GET_MONTHLY_SUMMARY: '/admin/pt-kpi/monthly-summary',
    ADMIN_UPDATE_PAYOUT: (payoutId: string) =>
      `/admin/pt-kpi/payouts/${payoutId}`,
    PT_GET_MONTHLY: '/pt/kpi/monthly',
  },
  ANALYTICS: {
    OVERVIEW: '/admin/analytics/overview',
    REVENUE_TIMESERIES: '/admin/analytics/revenue/timeseries',
    REVENUE_BY_BRANCH: '/admin/analytics/revenue/by-branch',
    REVENUE_BY_PACKAGE: '/admin/analytics/revenue/by-package',
    OPERATIONS: '/admin/analytics/operations',
  },
  PAYMENT: {
    VNPAY_DEMO_CHECKOUT: '/payments/vnpay/demo-checkout',
  },
};
