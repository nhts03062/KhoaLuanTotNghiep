export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    PROFILE: string;
    GET_PROFILE: string;
    UPDATE_PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
    GET_PURCHASE_PACKAGE: string;
    GET_CHECK_IN_HISTORY: string;
    CHECK_IN: string;
    CREATE_REQUEST_PT: string;
    GET_PT_TRAINING_HISTORY: string;
    GET_PT_TRAINING_SLOTS: string;
    GET_AVAILABLE_PTS: string;
    GET_PT_WEEK_BOOKING_GRID: string;
    GET_LIST_WORKOUT_HISTORY: string;
    CREATE_WORKOUT_HISTORY: string;
    GET_TODAY_EXERCISE: string;
  };
  PACKAGE: {
    GET_ALL: string;
  };
  PT: {
    GET_ALL: string;
    GET_REQUESTS_LIST: string;
    GET_ACCEPTED_REQUESTS_LIST: string;
    APPROVE_REQUEST: (requestId: string) => string;
    REJECT_REQUEST: (requestId: string) => string;
    GET_SCHEDULE: string;
    REPORT_USER_SESSION: () => string;
  };
  BRANCH: {
    GET_ALL: string;
  };
  ADMIN: {
    GET_ACCOUNT_USER: string;
    CREATE_PACKAGE: string;
  };
  EXERCISE: {
    GET_ALL: string;
    GET_BY_ID: (exerciseId: string) => string;
  };
  PROGRAM: {
    GET_ALL: string;
  };
  AI: {
    RECOMMEND_PROGRAM: string;
    RECOMMEND_NUTRITION: string;
  };
}

export const API: API_PROPS = {
  AUTHENTICATION: {
    SIGN_IN: "/auth/sign-in",
    PROFILE: "/auth/profile",
    GET_PROFILE: "/account/profile",
    UPDATE_PROFILE: "/account/profile",
  },
  USER: {
    PURCHASE_PACKAGE: "/user-package/purchase",
    GET_PURCHASE_PACKAGE: "/user-package/my-packages",
    GET_CHECK_IN_HISTORY: "/user-package/checkins/grouped",
    CHECK_IN: "/user-package/checkin",
    CREATE_REQUEST_PT: "/user-package/pt-assist-request",
    GET_PT_TRAINING_HISTORY: "/user-package/pt-training-history",
    GET_PT_TRAINING_SLOTS: "/user-package/pt-training-slots",
    GET_AVAILABLE_PTS: "/user-package/available-pts",
    GET_PT_WEEK_BOOKING_GRID: "/user-package/pt-week-booking-grid",
    GET_LIST_WORKOUT_HISTORY: "/user-package/workout-history",
    CREATE_WORKOUT_HISTORY: "/user-package/workout-history",
    GET_TODAY_EXERCISE: "/user-package/today-exercises",
  },
  PACKAGE: {
    GET_ALL: "/package",
  },
  PT: {
    GET_ALL: "/account/pt-accounts",
    GET_REQUESTS_LIST: "/pt/requested-packages",
    GET_ACCEPTED_REQUESTS_LIST: "/pt/accepted-packages",
    APPROVE_REQUEST: (requestId: string) => `/pt/accepted-request/${requestId}`,
    REJECT_REQUEST: (requestId: string) => `/pt/rejected-request/${requestId}`,
    GET_SCHEDULE: "/pt/assist-schedule",
    REPORT_USER_SESSION: () => "/pt/session-reports",
  },
  BRANCH: {
    GET_ALL: "/branch",
  },
  ADMIN: {
    GET_ACCOUNT_USER: "/account/user-accounts",
    CREATE_PACKAGE: "/package",
  },
  EXERCISE: {
    GET_ALL: "/exercise",
    GET_BY_ID: (exerciseId: string) => `/exercise/${exerciseId}`,
  },
  PROGRAM: {
    GET_ALL: "/program",
  },
  AI: {
    RECOMMEND_PROGRAM: "/ai/recommend-packages",
    RECOMMEND_NUTRITION: "/ai/recommend-nutrition",
  },
};
