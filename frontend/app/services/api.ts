import {
  FILTER_PACKAGE_PROPS,
  FILTER_PROPS,
  FILTER_PT_ASSIST_SCHEDULE_PROPS,
} from '../types/filters';
import {
  AcceptedTraineeRequestsResponse,
  AcceptPTAssistRequestResponse,
  ApproveTraineeRequestRequest,
  ApproveTraineeRequestResponse,
  AssignProgramToUserRequest,
  AssignProgramToUserResponse,
  AvailablePtResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsQuery,
  AdminAnalyticsRevenueByBranchResponse,
  AdminAnalyticsRevenueByPackageResponse,
  AdminAnalyticsRevenueTimeseriesResponse,
  AdminUpdatePtRequest,
  AdminUpdatePtResponse,
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  DeactivatePtAccountResponse,
  AdminOperationsResponse,
  DeactivateUserAccountResponse,
  BranchDetailResponse,
  BranchesResponse,
  CheckInHistoryResponse,
  CreateBranchRequest,
  CreateBranchResponse,
  CreateExerciseRequest,
  CreateExerciseResponse,
  DeleteExerciseResponse,
  PtKpiMonthlySummaryResponse,
  PtKpiPolicyResponse,
  PtMonthlyKpiResponse,
  UpdatePtKpiPayoutRequest,
  UpdatePtKpiPayoutResponse,
  UpsertPtKpiPolicyRequest,
  UpdatePackageRequest,
  UpdatePackageResponse,
  VnpayDemoCheckoutRequest,
  VnpayDemoCheckoutResponse,
  UpsertPtKpiPolicyResponse,
  CreatePackageRequest,
  CreatePackageResponse,
  DeletePackageResponse,
  CreateProgramDayExerciseRequest,
  CreateProgramDayExerciseResponse,
  CreateProgramDayRequest,
  CreateProgramDayResponse,
  CreatePtAssistRequestRequest,
  CreatePtAssistRequestResponse,
  CreatePtAccountRequest,
  CreatePtAccountResponse,
  CreatePTTrainingSlotRequest,
  CreateProgramResponse,
  CreateWorkoutHistoryRequest,
  CreateWorkoutHistoryResponse,
  DeleteBranchResponse,
  ExerciseDetailResponse,
  ExercisesResponse,
  ListWorkoutHistoryResponse,
  MyPurchasePackagesResponse,
  PackagesResponse,
  ProfileResponse,
  ProgramRequest,
  ProgramsResponse,
  PtAccountsResponse,
  PTAssistRequestsResponse,
  PTAssistSchedulesResponse,
  PtAvailabilityWindowsResponse,
  PtBookingGridDefinitionResponse,
  PtWeekBookingGridResponse,
  PTTrainingHistoriesResponse,
  PurchasePackageRequest,
  PurchasePackageResponse,
  RecommendNutritionRequest,
  RecommendNutritionResponse,
  RecommendProgramRequest,
  RecommendProgramResponse,
  RejectPTAssistRequestResponse,
  RejectTraineeRequestRequest,
  RejectTraineeRequestResponse,
  ReportUserSessionRequest,
  ReportUserSessionResponse,
  SignUpRequest,
  SignUpResponse,
  TodayExcerciseResponse,
  TraineeRequestsResponse,
  UpdateBranchResponse,
  UpdateExerciseRequest,
  UpdateExerciseResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserAccountsResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
} from '../types/types';
import axios from './axios.customize';
import { API } from './constant';

export const signin = async (
  email: string,
  password: string,
): Promise<{ access_token: string }> => {
  const res = await axios.post(API.AUTHENTICATION.SIGN_IN, {
    email,
    password,
  });
  return res as unknown as { access_token: string };
};

export const signUp = async (request: SignUpRequest): Promise<any> => {
  const res = await axios.post<SignUpResponse>(
    API.AUTHENTICATION.SIGN_UP,
    request,
  );
  return res;
};

export const verifyAccount = async (
  request: VerifyAccountRequest,
): Promise<any> => {
  const res = await axios.post<VerifyAccountResponse>(
    API.AUTHENTICATION.VERIFY_ACCOUNT,
    request,
  );
  return res;
};

export const getProfile = async (): Promise<any> => {
  const res = await axios.get<ProfileResponse>(API.AUTHENTICATION.GET_PROFILE);
  return res;
};

export const getMe = async (): Promise<{
  userId: string;
  role: string;
  email: string;
}> => {
  const res = await axios.get(API.AUTHENTICATION.PROFILE);
  return res as unknown as { userId: string; role: string; email: string };
};

export const getAccountUser = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<UserAccountsResponse>(
    API.ADMIN.GET_ACCOUNT_USER,
    {
      params: {
        page: filter.page,
        itemsPerPage: filter.itemsPerPage,
        search: filter.search,
      },
    },
  );
  return res;
};

export const updateUserAccountByAdmin = async (
  accountId: string,
  payload: AdminUpdateUserRequest,
): Promise<AdminUpdateUserResponse> => {
  const res = await axios.patch<AdminUpdateUserResponse>(
    API.ADMIN.UPDATE_USER_ACCOUNT(accountId),
    payload,
  );
  return res as unknown as AdminUpdateUserResponse;
};

export const deactivateUserAccountByAdmin = async (
  accountId: string,
): Promise<DeactivateUserAccountResponse> => {
  const res = await axios.delete<DeactivateUserAccountResponse>(
    API.ADMIN.DEACTIVATE_USER_ACCOUNT(accountId),
  );
  return res as unknown as DeactivateUserAccountResponse;
};

export const getPtAccounts = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<PtAccountsResponse>(API.PT.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const createPtAccount = async (
  payload: CreatePtAccountRequest,
): Promise<CreatePtAccountResponse> => {
  const res = await axios.post<CreatePtAccountResponse>(
    API.PT.CREATE_PT_ACCOUNT,
    payload,
  );
  return res as unknown as CreatePtAccountResponse;
};

export const updatePtAccountByAdmin = async (
  accountId: string,
  payload: AdminUpdatePtRequest,
): Promise<AdminUpdatePtResponse> => {
  const res = await axios.patch<AdminUpdatePtResponse>(
    API.PT.UPDATE_PT_ACCOUNT(accountId),
    payload,
  );
  return res as unknown as AdminUpdatePtResponse;
};

export const deactivatePtAccountByAdmin = async (
  accountId: string,
): Promise<DeactivatePtAccountResponse> => {
  const res = await axios.delete<DeactivatePtAccountResponse>(
    API.PT.DEACTIVATE_PT_ACCOUNT(accountId),
  );
  return res as unknown as DeactivatePtAccountResponse;
};

export const getPackages = async (
  filter: FILTER_PACKAGE_PROPS,
): Promise<any> => {
  const res = await axios.get<PackagesResponse>(API.PACKAGE.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      unit: filter.unit,
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
    },
  });
  return res;
};

export const createPackage = async (
  request: CreatePackageRequest,
): Promise<any> => {
  const res = await axios.post<CreatePackageResponse>(
    API.ADMIN.CREATE_PACKAGE,
    request,
  );
  return res;
};

export const updatePackage = async (
  packageId: string,
  request: UpdatePackageRequest,
): Promise<any> => {
  const res = await axios.put<UpdatePackageResponse>(
    API.PACKAGE.UPDATE_PACKAGE(packageId),
    request,
  );
  return res;
};

export const deletePackage = async (
  packageId: string,
): Promise<any> => {
  const res = await axios.delete<DeletePackageResponse>(
    API.PACKAGE.DELETE_PACKAGE(packageId),
  );
  return res;
};

export const getBranches = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<BranchesResponse>(API.BRANCH.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const purchasePackage = async (
  request: PurchasePackageRequest,
): Promise<any> => {
  const res = await axios.post<PurchasePackageResponse>(
    API.USER.PURCHASE_PACKAGE,
    request,
  );
  return res;
};

export const createVnpayDemoCheckout = async (
  request: VnpayDemoCheckoutRequest,
): Promise<VnpayDemoCheckoutResponse> => {
  const res = await axios.post<VnpayDemoCheckoutResponse>(
    API.PAYMENT.VNPAY_DEMO_CHECKOUT,
    request,
  );
  return res as unknown as VnpayDemoCheckoutResponse;
};

export const getMyPurchasePackages = async (): Promise<any> => {
  const res = await axios.get<MyPurchasePackagesResponse>(
    API.USER.GET_PURCHASE_PACKAGE,
  );
  return res;
};

export const getAvailablePTs = async (filter: {
  branchId: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<any> => {
  const res = await axios.get<AvailablePtResponse>(API.USER.GET_AVAILABLE_PTS, {
    params: filter,
  });
  return res as unknown as AvailablePtResponse;
};

export const getPtWeekBookingGrid = async (params: {
  branchId: string;
  ptAccountId: string;
  weekStart: string;
}): Promise<PtWeekBookingGridResponse> => {
  const res = await axios.get<PtWeekBookingGridResponse>(
    API.USER.GET_PT_WEEK_BOOKING_GRID,
    { params },
  );
  return res as unknown as PtWeekBookingGridResponse;
};

// legacy (PT duyệt cấp gói) - flow mới đã chuyển sang duyệt theo từng buổi
export const getTraineeRequests = async (): Promise<any> => {
  const res = await axios.get<TraineeRequestsResponse>(
    API.PT.GET_REQUESTS_LIST,
  );
  return res;
};

export const getAcceptedTraineeRequests = async (): Promise<any> => {
  const res = await axios.get<AcceptedTraineeRequestsResponse>(
    API.PT.GET_ACCEPTED_REQUESTS_LIST,
  );
  return res;
};

// legacy (PT duyệt cấp gói)
export const approveTraineeRequest = async (
  request: ApproveTraineeRequestRequest,
): Promise<any> => {
  const res = await axios.post<ApproveTraineeRequestResponse>(
    API.PT.APPROVE_REQUEST(request.requestId),
    request,
  );
  return res;
};

// legacy (PT duyệt cấp gói)
export const rejectTraineeRequest = async (
  request: RejectTraineeRequestRequest,
): Promise<any> => {
  const res = await axios.post<RejectTraineeRequestResponse>(
    API.PT.REJECT_REQUEST(request.requestId),
    request,
  );
  return res;
};

export const getExercises = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<ExercisesResponse>(API.EXERCISE.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const getExerciseById = async (exerciseId: string): Promise<any> => {
  const res = await axios.get<ExerciseDetailResponse>(
    API.EXERCISE.GET_BY_ID(exerciseId),
  );
  return res;
};

export const createProgram = async (request: ProgramRequest): Promise<any> => {
  const res = await axios.post<CreateProgramResponse>(
    API.PROGRAM.CREATE_PROGRAM,
    request,
  );
  return res;
};

export const createProgramDay = async (
  request: CreateProgramDayRequest,
): Promise<any> => {
  const res = await axios.post<CreateProgramDayResponse>(
    API.PROGRAM.CREATE_PROGRAM_DAY(request.programId),
    request,
  );
  return res;
};

export const createProgramDayExercise = async (
  request: CreateProgramDayExerciseRequest,
): Promise<any> => {
  const res = await axios.post<CreateProgramDayExerciseResponse>(
    API.PROGRAM.CREATE_PROGRAM_DAY_EXERCISE(request.programId, request.dayId),
    request,
  );
  return res;
};

export const getPrograms = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<ProgramsResponse>(API.PROGRAM.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const getCheckInHistory = async (): Promise<any> => {
  const res = await axios.get<CheckInHistoryResponse>(
    API.USER.GET_CHECK_IN_HISTORY,
  );
  return res as unknown as CheckInHistoryResponse;
};

export const getPTTrainingHistory = async (params?: {
  from?: string;
  to?: string;
}): Promise<any> => {
  const res = await axios.get<PTTrainingHistoriesResponse>(
    API.USER.GET_PT_TRAINING_HISTORY,
    { params },
  );
  return res as unknown as PTTrainingHistoriesResponse;
};

export const getPTAssistRequests = async (): Promise<any> => {
  const res = await axios.get<PTAssistRequestsResponse>(
    API.PT.GET_ASSIST_REQUEST,
  );
  return res;
};

export const acceptPTAssistRequest = async (
  requestId: string,
): Promise<any> => {
  const res = await axios.post<AcceptPTAssistRequestResponse>(
    API.PT.ACCEPT_ASSIST_REQUEST(requestId),
  );
  return res;
};

export const rejectPTAssistRequest = async (
  requestId: string,
): Promise<any> => {
  const res = await axios.post<RejectPTAssistRequestResponse>(
    API.PT.REJECT_ASSIST_REQUEST(requestId),
  );
  return res;
};

export const getPTAssistSchedule = async (
  filter: FILTER_PT_ASSIST_SCHEDULE_PROPS,
): Promise<any> => {
  const res = await axios.get<PTAssistSchedulesResponse>(API.PT.GET_SCHEDULE, {
    params: {
      from: filter.from,
      to: filter.to,
    },
  });
  return res;
};

export const createPTTrainingSlot = async (
  request: CreatePTTrainingSlotRequest,
): Promise<any> => {
  const res = await axios.post(API.PT.CREATE_TRAINING_SLOT, request);
  return res;
};

export const getPTTrainingSlots = async (filter?: {
  from?: string;
  to?: string;
}): Promise<PtAvailabilityWindowsResponse> => {
  const res = await axios.get<PtAvailabilityWindowsResponse>(
    API.PT.GET_TRAINING_SLOTS,
    {
      params: filter,
    },
  );
  return res as unknown as PtAvailabilityWindowsResponse;
};

export const getPtBookingGridDefinition =
  async (): Promise<PtBookingGridDefinitionResponse> => {
    const res = await axios.get<PtBookingGridDefinitionResponse>(
      API.PT.GET_BOOKING_GRID_DEFINITION,
    );
    return res as unknown as PtBookingGridDefinitionResponse;
  };

export const createBranch = async (
  request: CreateBranchRequest,
): Promise<any> => {
  const res = await axios.post<CreateBranchResponse>(
    API.BRANCH.CREATE_BRANCH,
    request,
  );
  return res;
};

export const updateBranch = async (
  branchId: string,
  request: CreateBranchRequest,
): Promise<any> => {
  const res = await axios.put<UpdateBranchResponse>(
    API.BRANCH.UPDATE_BRANCH(branchId),
    request,
  );
  return res;
};

export const deleteBranch = async (branchId: string): Promise<any> => {
  const res = await axios.delete<DeleteBranchResponse>(
    API.BRANCH.DELETE_BRANCH(branchId),
  );
  return res;
};

export const getBranchById = async (branchId: string): Promise<any> => {
  const res = await axios.get<BranchDetailResponse>(
    API.BRANCH.GET_BY_ID(branchId),
  );
  return res;
};

export const createExercise = async (
  request: CreateExerciseRequest,
): Promise<any> => {
  const res = await axios.post<CreateExerciseResponse>(
    API.EXERCISE.CREATE_EXERCISE,
    request,
  );
  return res;
};

export const updateExercise = async (
  exerciseId: string,
  request: UpdateExerciseRequest,
): Promise<any> => {
  const res = await axios.put<UpdateExerciseResponse>(
    API.EXERCISE.UPDATE_EXERCISE(exerciseId),
    request,
  );
  return res;
};

export const deleteExercise = async (exerciseId: string): Promise<any> => {
  const res = await axios.delete<DeleteExerciseResponse>(
    API.EXERCISE.DELETE_EXERCISE(exerciseId),
  );
  return res;
};

export const assignProgramToUser = async (
  request: AssignProgramToUserRequest,
): Promise<any> => {
  const res = await axios.post<AssignProgramToUserResponse>(
    API.PT.ASSIGN_PROGRAM_TO_USER(),
    request,
  );
  return res;
};

export const reportUserSession = async (
  request: ReportUserSessionRequest,
): Promise<any> => {
  const res = await axios.post<ReportUserSessionResponse>(
    API.PT.REPORT_USER_SESSION(),
    request,
  );
  return res;
};

export const recommendProgram = async (
  request: RecommendProgramRequest,
): Promise<any> => {
  const res = await axios.post<RecommendProgramResponse>(
    API.AI.RECOMMEND_PROGRAM,
    request,
  );
  return res;
};

export const recommendNutrition = async (
  request: RecommendNutritionRequest,
): Promise<any> => {
  const res = await axios.post<RecommendNutritionResponse>(
    API.AI.RECOMMEND_NUTRITION,
    request,
  );
  return res;
};

export const updateProfile = async (
  request: UpdateProfileRequest,
): Promise<any> => {
  const res = await axios.patch<UpdateProfileResponse>(
    API.AUTHENTICATION.UPDATE_PROFILE,
    request,
  );
  return res;
};

export const getTodayExercise = async (): Promise<any> => {
  const res = await axios.get<TodayExcerciseResponse>(
    API.USER.GET_TODAY_EXERCISE,
  );
  return res;
};

export const createWorkoutHistory = async (
  request: CreateWorkoutHistoryRequest,
): Promise<any> => {
  const res = await axios.post<CreateWorkoutHistoryResponse>(
    API.USER.CREATE_WORKOUT_HISTORY,
    request,
  );
  return res;
};

export const getListWorkoutHistory = async (
  filter?: { from?: string; to?: string },
): Promise<any> => {
  const res = await axios.get<ListWorkoutHistoryResponse>(
    API.USER.GET_LIST_WORKOUT_HISTORY,
    { params: { from: filter?.from, to: filter?.to } },
  );
  return res;
};

export const createPtAssistRequest = async (
  request: CreatePtAssistRequestRequest,
): Promise<any> => {
  const res = await axios.post<CreatePtAssistRequestResponse>(
    API.USER.CREATE_PT_ASSIST_REQUEST,
    request,
  );
  return res;
};

export const getPtKpiPolicy = async (
  monthKey?: string,
): Promise<PtKpiPolicyResponse> => {
  const res = await axios.get<PtKpiPolicyResponse>(
    API.PT_KPI.ADMIN_GET_POLICY,
    { params: monthKey ? { monthKey } : undefined },
  );
  return res as unknown as PtKpiPolicyResponse;
};

export const upsertPtKpiPolicy = async (
  request: UpsertPtKpiPolicyRequest,
): Promise<UpsertPtKpiPolicyResponse> => {
  const res = await axios.post<UpsertPtKpiPolicyResponse>(
    API.PT_KPI.ADMIN_UPSERT_POLICY,
    request,
  );
  return res as unknown as UpsertPtKpiPolicyResponse;
};

export const getPtKpiMonthlySummary = async (
  monthKey?: string,
): Promise<PtKpiMonthlySummaryResponse> => {
  const res = await axios.get<PtKpiMonthlySummaryResponse>(
    API.PT_KPI.ADMIN_GET_MONTHLY_SUMMARY,
    { params: monthKey ? { monthKey } : undefined },
  );
  return res as unknown as PtKpiMonthlySummaryResponse;
};

export const updatePtKpiPayout = async (
  payoutId: string,
  request: UpdatePtKpiPayoutRequest,
): Promise<UpdatePtKpiPayoutResponse> => {
  const res = await axios.patch<UpdatePtKpiPayoutResponse>(
    API.PT_KPI.ADMIN_UPDATE_PAYOUT(payoutId),
    request,
  );
  return res as unknown as UpdatePtKpiPayoutResponse;
};

export const getMyPtKpiMonthly = async (
  monthKey?: string,
): Promise<PtMonthlyKpiResponse> => {
  const res = await axios.get<PtMonthlyKpiResponse>(
    API.PT_KPI.PT_GET_MONTHLY,
    { params: monthKey ? { monthKey } : undefined },
  );
  return res as unknown as PtMonthlyKpiResponse;
};

export const getAdminAnalyticsOverview = async (
  query?: AdminAnalyticsQuery,
): Promise<AdminAnalyticsOverviewResponse> => {
  const res = await axios.get<AdminAnalyticsOverviewResponse>(
    API.ANALYTICS.OVERVIEW,
    { params: query },
  );
  return res as unknown as AdminAnalyticsOverviewResponse;
};

export const getAdminAnalyticsRevenueTimeseries = async (
  query?: AdminAnalyticsQuery,
): Promise<AdminAnalyticsRevenueTimeseriesResponse> => {
  const res = await axios.get<AdminAnalyticsRevenueTimeseriesResponse>(
    API.ANALYTICS.REVENUE_TIMESERIES,
    { params: query },
  );
  return res as unknown as AdminAnalyticsRevenueTimeseriesResponse;
};

export const getAdminAnalyticsRevenueByBranch = async (
  query?: AdminAnalyticsQuery,
): Promise<AdminAnalyticsRevenueByBranchResponse> => {
  const res = await axios.get<AdminAnalyticsRevenueByBranchResponse>(
    API.ANALYTICS.REVENUE_BY_BRANCH,
    { params: query },
  );
  return res as unknown as AdminAnalyticsRevenueByBranchResponse;
};

export const getAdminAnalyticsRevenueByPackage = async (
  query?: AdminAnalyticsQuery,
): Promise<AdminAnalyticsRevenueByPackageResponse> => {
  const res = await axios.get<AdminAnalyticsRevenueByPackageResponse>(
    API.ANALYTICS.REVENUE_BY_PACKAGE,
    { params: query },
  );
  return res as unknown as AdminAnalyticsRevenueByPackageResponse;
};

export const getAdminOperations = async (
  query?: AdminAnalyticsQuery,
): Promise<AdminOperationsResponse> => {
  const res = await axios.get<AdminOperationsResponse>(
    API.ANALYTICS.OPERATIONS,
    { params: query },
  );
  return res as unknown as AdminOperationsResponse;
};
