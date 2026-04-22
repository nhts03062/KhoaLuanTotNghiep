export interface UserAccountProfile {
  name: string | null;
  gender: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  fitnessGoal: string | null;
}

export interface UserAccount {
  id: string;
  email: string;
  status?: string;
  role?: string;
  createdAt?: string;
  profile?: UserAccountProfile | null;
}

export interface AdminUpdateUserRequest {
  email?: string;
  name?: string;
  gender?: Gender;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: FitnessGoal;
}

export interface AdminUpdateUserResponse {
  message: string;
  data: UserAccount;
}

export interface DeactivateUserAccountResponse {
  message: string;
  data: {
    id: string;
    email: string;
    status: string;
    role?: string;
  };
}

export type AdminUpdatePtRequest = AdminUpdateUserRequest;

export interface AdminUpdatePtResponse {
  message: string;
  data: PtAccount;
}

export type DeactivatePtAccountResponse = DeactivateUserAccountResponse;

export interface PtAccount {
  id: string;
  email: string;
  status?: string;
  role?: string;
  profile?: UserAccountProfile | null;
}

export interface PtWeeklySlotItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface PtAvailabilityWindow {
  id: string;
  ptAccountId?: string;
  branchId?: string;
  fromDate: string;
  toDate: string;
  isActive?: boolean;
  branch?: Branch;
  weeklySlots: PtWeeklySlotItem[];
}

export interface AvailablePtAccount extends PtAccount {
  ptAvailabilityWindows: PtAvailabilityWindow[];
}

export interface AvailablePtResponse {
  message: string;
  data: AvailablePtAccount[];
}

export interface PaginationMeta {
  page: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
}

export interface UserAccountsResponse {
  message: string;
  meta: PaginationMeta;
  data: UserAccount[];
}

export interface PtAccountsResponse {
  message: string;
  meta: PaginationMeta;
  data: PtAccount[];
}

export interface CreatePtAccountRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface CreatePtAccountResponse {
  message: string;
  data: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    profile: {
      name: string;
      phone?: string | null;
      gender?: string | null;
    };
  };
}

export interface Package {
  id: string;
  name: string;
  unit: 'DAY' | 'MONTH';
  durationValue: number;
  hasPt: boolean;
  ptSessionsIncluded?: number | null;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagesResponse {
  message: string;
  meta: PaginationMeta;
  data: Package[];
}

export interface CreatePackageRequest {
  name: string;
  description: string;
  unit: 'DAY' | 'MONTH';
  durationValue: number;
  hasPt: boolean;
  ptSessionsIncluded?: number;
  price: number;
}

export interface CreatePackageResponse {
  message: string;
  data: Package;
}

export type UpdatePackageRequest = Partial<
  Omit<CreatePackageRequest, 'description'> & {
    description?: string | null;
  }
> & {
  isActive?: boolean;
};

export interface UpdatePackageResponse {
  message: string;
  data: Package;
}

export interface DeletePackageResponse {
  message: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchesResponse {
  message: string;
  meta: PaginationMeta;
  data: Branch[];
}

export interface PurchasePackageRequest {
  packageId: string;
  branchId: string;
}

export interface PurchasePackageResponse {
  message: string;
  data: Package;
}

export interface VnpayDemoCheckoutRequest {
  packageId: string;
}

export interface VnpayDemoCheckoutResponse {
  message: string;
  data: {
    paymentUrl: string;
    txnRef: string;
    amount: number;
    packageId: string;
    packageName: string;
    expiresAt: string;
  };
}

export interface MyPurchasePackage {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId?: string | null;
  ptSessionsGranted?: number | null;
  ptSessionsRemaining?: number | null;
  ptAssistSessionsUsed?: number;
  programId?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  startAt: string | null;
  endAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  package: Package;
  ptAccount?: PtAccount | null;
}

export interface MyPurchasePackagesResponse {
  message: string;
  data: MyPurchasePackage[];
}

export interface Program {
  id: string;
  name: string;
}

export interface TraineeRequest {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId: string;
  programId: string | null;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  startAt: string | null;
  endAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  package: Package;
  account: UserAccount;
  branch: Branch;
  program: Program | null;
}

export interface TraineeRequestsResponse {
  message: string;
  data: TraineeRequest[];
}

export interface ApproveTraineeRequestRequest {
  requestId: string;
}

export interface ApproveTraineeRequestResponse {
  message: string;
  data: TraineeRequest;
}

export interface RejectTraineeRequestRequest {
  requestId: string;
}

export interface RejectTraineeRequestResponse {
  message: string;
  data: TraineeRequest;
}

export interface AcceptedTraineeRequestsResponse {
  message: string;
  data: TraineeRequest[];
}

export interface Exercise {
  id: string;
  createdById?: string | null;
  name: string;
  description: string;
  content: string;
  muscleGroup: 'CHEST' | 'BACK' | 'ARMS' | 'LEGS' | 'ABS' | 'CORE' | 'CARDIO';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipments: string;
  thumbnail: string;
  videoUrl: string;
  suggestion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExercisesResponse {
  message: string;
  meta: PaginationMeta;
  data: Exercise[];
}

export interface ExerciseDetailResponse {
  message: string;
  data: Exercise;
}

export interface ProgramRequest {
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  daysPerWeek: number;
  thumbnail: string;
}

export interface CreateProgramDayRequest {
  programId: string;
  dayOfWeek: number;
  title: string;
  note: string;
}

export interface CreateProgramResponse {
  message: string;
  data: any;
}

export interface CreateProgramDayResponse {
  message: string;
  data: any;
}

export interface CreateProgramDayExerciseRequest {
  programId: string;
  dayId: string;
  exerciseId: string;
  sortOrder: number;
}

export interface CreateProgramDayExerciseResponse {
  message: string;
  data: any;
}

export type ProgramLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ProgramDayExercise {
  id: string;
  programDayId: string;
  exerciseId: string;
  sortOrder: number;
  createdAt: string;
  exercise: Exercise;
}

export interface ProgramDay {
  id: string;
  programId: string;
  dayOfWeek: number;
  title: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  exercises: ProgramDayExercise[];
}

export interface Program {
  id: string;
  createdById?: string | null;
  name: string;
  description: string;
  level: ProgramLevel;
  daysPerWeek: number;
  isActive: boolean;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  days: ProgramDay[];
}

export interface ProgramsResponse {
  message: string;
  meta: PaginationMeta;
  data: Program[];
}

export interface CheckInHistoryItem {
  id: string;
  userPackageId: string;
  checkedInAt: string;
  branch: {
    id: string;
    name: string;
  };
}

export interface CheckInHistoryResponse {
  message: string;
  data: Record<string, CheckInHistoryItem[]>;
}

export interface PTAssistRequest {
  id: string;
  accountId: string;
  userPackageId: string;
  branchId: string;
  ptAccountId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  note: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  account: UserAccount;
  branch: Branch;
  userPackage: MyPurchasePackage;
}

export interface PTAssistRequestsResponse {
  message: string;
  data: PTAssistRequest[];
}

export interface AcceptPTAssistRequestResponse {
  message: string;
  data: any;
}

export interface RejectPTAssistRequestResponse {
  message: string;
  data: any;
}

export interface PTAssistSchedule {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    note: string | null;
    rejectReason: string | null;
    account: UserAccount;
    branch: Branch;
    userPackage: MyPurchasePackage;
  };
}

export interface PTAssistSchedulesResponse {
  message: string;
  data: PTAssistSchedule[];
}

export interface CreatePtAssistRequestRequest {
  userPackageId: string;
  slotId: string;
  sessionDate: string;
  note?: string;
}

export interface CreatePtAssistRequestResponse {
  message: string;
  data: {
    id: string;
    status: 'PENDING';
  };
}

export type PtShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface CreatePTTrainingSlotRequest {
  branchId: string;
  fromDate: string;
  toDate: string;
  /** Từng ô lưới cụ thể (tuỳ chọn nếu đã dùng shiftSelections) */
  slots?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  /**
   * Chọn ca + thứ trong tuần (1 = Thứ 2 … 7 = Chủ nhật). BE bung toàn bộ ô lưới thuộc ca đó.
   */
  shiftSelections?: Array<{
    shiftType: PtShiftType;
    dayOfWeeks: number[];
  }>;
}

export interface PtBookingGridSlotDef {
  key: string;
  startTime: string;
  endTime: string;
  /** Có trên GET booking-slot-grid-definition; tuần booking có thể không gửi. */
  shiftType?: PtShiftType;
}

export interface PtBookingGridDefinitionResponse {
  message: string;
  data: {
    timeZone: string;
    dayOfWeekLegend: string;
    slots: PtBookingGridSlotDef[];
  };
}

export interface PtAvailabilityWindowsResponse {
  message: string;
  data: PtAvailabilityWindow[];
}

export type PtWeekGridCellState =
  | 'FREE'
  | 'PASSED'
  | 'OCCUPIED'
  | 'UNAVAILABLE';

export interface PtWeekGridCell {
  gridKey: string;
  startTime: string;
  endTime: string;
  weeklySlotId: string | null;
  state: PtWeekGridCellState;
}

export interface PtWeekGridDay {
  date: string;
  dayOfWeek: number;
  slots: PtWeekGridCell[];
}

export interface PtWeekBookingGridResponse {
  message: string;
  data: {
    timeZone: string;
    weekStart: string;
    branch: Branch;
    ptAccountId: string;
    gridRows: PtBookingGridSlotDef[];
    days: PtWeekGridDay[];
  };
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone: string;
}

export interface CreateBranchResponse {
  message: string;
  data: Branch;
}

export interface UpdateBranchResponse {
  message: string;
  data: Branch;
}

export interface DeleteBranchResponse {
  message: string;
  data: Branch;
}

export interface BranchDetailResponse {
  message: string;
  data: Branch;
}

export interface CreateExerciseRequest {
  name: string;
  description: string;
  content: string;
  muscleGroup:
    | 'CHEST'
    | 'BACK'
    | 'ARMS'
    | 'LEGS'
    | 'ABS'
    | ' SHOULDERS'
    | 'FULL_BODY';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipments: string;
  thumbnail: string;
  videoUrl: string;
  suggestion?: string;
  isActive?: boolean;
}

export interface CreateExerciseResponse {
  message: string;
  data: Exercise;
}

export type UpdateExerciseRequest = Partial<CreateExerciseRequest>;

export interface UpdateExerciseResponse {
  message: string;
  data: Exercise;
}

export interface DeleteExerciseResponse {
  message: string;
}

export interface AssignProgramToUserRequest {
  userPackageId: string;
  programId: string;
}

export interface AssignProgramToUserResponse {
  message: string;
  data: {
    id: string;
    accountId: string;
    packageId: string;
    branchId: string;
    ptAccountId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
    startAt: string;
    endAt: string;
    activatedAt: string;
    cancelledAt: string | null;
    expiredAt: string;
    createdAt: string;
    updatedAt: string;
    programId: string;
  };
}

export interface ReportUserSessionRequest {
  ptAssistRequestId: string;
  completion: 'COMPLETED' | 'INCOMPLETE';
  summary: string;
  techniqueNote: string;
  improvement: string;
  nextSessionPlan: string;
  weightKg: number;
  bodyNote: string;
}

export interface ReportUserSessionResponse {
  message: string;
  data: any;
}

export interface SessionReport {
  id: string;
  ptAssistRequestId?: string;
  ptTrainingHistoryId?: string;
  completion: 'COMPLETED' | 'INCOMPLETE';
  summary: string | null;
  techniqueNote: string | null;
  improvement: string | null;
  nextSessionPlan: string | null;
  weightKg?: number | null;
  bodyNote?: string | null;
}

export interface PTTrainingHistory {
  id: string;
  accountId: string;
  userPackageId: string;
  branchId: string;
  ptAccountId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  note: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  ptAccount: PtAccount;
  userPackage: MyPurchasePackage;
  sessionReport: SessionReport | null;
}

export interface PTTrainingHistoriesResponse {
  message: string;
  data: PTTrainingHistory[];
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpResponse {
  message: string;
  data: any;
}

export interface VerifyAccountRequest {
  email: string;
  verificationCode: string;
}

export interface VerifyAccountResponse {
  message: string;
  data: any;
}

export interface RecommendProgramRequest {
  conversationId: string;
  userMessage: string;
}

export interface RecommendProgramResponse {
  message: string;
  data: any;
}

export interface RecommendNutritionRequest {
  conversationId: string;
  userMessage: string;
}

export interface RecommendNutritionResponse {
  message: string;
  data: any;
}

export interface Profile {
  id: string;
  accountId: string;
  name: string | null;
  gender: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  fitnessGoal: string | null;
  createdAt: string;
  updatedAt: string;
  email: string;
}

export interface ProfileResponse {
  message: string;
  data: Profile;
}

export type Gender = 'MALE' | 'FEMALE';
export type FitnessGoal =
  | 'LOSE_WEIGHT'
  | 'GAIN_MUSCLE'
  | 'IMPROVE_HEALTH'
  | 'MAINTAIN_WEIGHT';

export interface UpdateProfileRequest {
  name?: string;
  gender?: Gender;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: FitnessGoal;
}

export interface UpdateProfileResponse {
  message: string;
  data: Profile;
}

export interface TodayExcercise {
  dayOfWeek: number;
  programDay: {
    id: string;
    programId: string;
    dayOfWeek: number;
    title: string;
    note: string | null;
  };
  exercises: Array<{
    id: string;
    sortOrder: number;
    exercise: Exercise;
  }>;
}

export interface TodayExcerciseResponse {
  message: string;
  data: TodayExcercise;
}

export interface CreateWorkoutHistoryRequest {
  userPackageId: string;
  programDayId: string;
  workoutAt: string;
  status: 'COMPLETED' | 'SKIPPED';
  note: string | null;
}

export interface CreateWorkoutHistoryResponse {
  message: string;
  data: any;
}

export interface WorkoutHistory {
  id: string;
  accountId: string;
  userPackageId: string;
  programId: string;
  programDayId: string;
  workoutAt: string;
  status: 'COMPLETED' | 'SKIPPED';
  note: string | null;
  createdAt: string;
  userPackage: {
    id: string;
    package: Package;
  };
  program: {
    id: string;
    name: string;
    level: ProgramLevel;
  };
  programDay: {
    id: string;
    dayOfWeek: number;
    title: string;
    note: string | null;
  };
}

export interface ListWorkoutHistoryResponse {
  message: string;
  data: WorkoutHistory[];
}

export type PtMonthlyRewardPayoutStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'PAID'
  | 'VOID';
export type PtMonthlyRewardPayoutSource = 'AUTO' | 'MANUAL_OVERRIDE';

export interface PtMonthlyKpiPolicy {
  id: string;
  monthKey: string;
  targetTrainees: number;
  targetSessions: number;
  rewardAmount: number;
  isActive: boolean;
  createdByAdminId: string;
  createdByAdmin?: { id: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PtMonthlyRewardPayout {
  id: string;
  monthKey: string;
  ptAccountId: string;
  snapshotId: string | null;
  amountAuto: number;
  amountFinal: number;
  status: PtMonthlyRewardPayoutStatus;
  source: PtMonthlyRewardPayoutSource;
  approvedByAdminId: string | null;
  approvedByAdmin?: { id: string; email: string } | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PtKpiMonthlySummaryRow {
  ptAccountId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  distinctTrainees: number;
  acceptedSessions: number;
  achieved: boolean;
  rewardAmountAuto: number;
  payout: PtMonthlyRewardPayout | null;
}

export interface PtKpiMonthlySummaryResponse {
  message: string;
  data: {
    monthKey: string;
    policy: PtMonthlyKpiPolicy | null;
    rows: PtKpiMonthlySummaryRow[];
  };
}

export interface PtKpiPolicyResponse {
  message: string;
  data: PtMonthlyKpiPolicy | null;
}

export interface UpsertPtKpiPolicyRequest {
  monthKey: string;
  targetTrainees: number;
  targetSessions: number;
  rewardAmount: number;
  isActive?: boolean;
}

export interface UpsertPtKpiPolicyResponse {
  message: string;
  data: PtMonthlyKpiPolicy;
}

export interface UpdatePtKpiPayoutRequest {
  amountFinal?: number;
  status?: PtMonthlyRewardPayoutStatus;
  note?: string;
}

export interface UpdatePtKpiPayoutResponse {
  message: string;
  data: PtMonthlyRewardPayout;
}

export interface PtMonthlyKpiResponse {
  message: string;
  data: {
    monthKey: string;
    distinctTrainees: number;
    acceptedSessions: number;
    kpiTarget: {
      targetTrainees: number;
      targetSessions: number;
      rewardAmount: number;
    };
    progress: { traineePercent: number; sessionPercent: number };
    achieved: boolean;
    estimatedReward: number;
    payoutStatus: PtMonthlyRewardPayoutStatus | null;
  };
}

export interface AdminAnalyticsQuery {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'month' | 'year';
  branchId?: string;
  packageId?: string;
}

export interface AdminAnalyticsMetrics {
  grossRevenue: number;
  activeRevenue: number;
  purchasesCount: number;
  newUsers: number;
  activePackages: number;
  checkins: number;
  ptAcceptedSessions: number;
}

export type AdminAnalyticsMetricKey = keyof AdminAnalyticsMetrics;

export interface AdminAnalyticsChangeVsPrev {
  grossRevenuePct: number | null;
  activeRevenuePct: number | null;
  purchasesCountPct: number | null;
  newUsersPct: number | null;
  activePackagesPct: number | null;
  checkinsPct: number | null;
  ptAcceptedSessionsPct: number | null;
}

export interface AdminAnalyticsOverviewResponse {
  message: string;
  data: {
    range: {
      from: string;
      to: string;
    };
    metrics: AdminAnalyticsMetrics;
    changeVsPreviousPeriod: AdminAnalyticsChangeVsPrev;
  };
}

export interface AnalyticsRevenueTimeseriesItem {
  bucket: string;
  grossRevenue: number;
  activeRevenue: number;
  purchasesCount: number;
}

export interface AdminAnalyticsRevenueTimeseriesResponse {
  message: string;
  data: AnalyticsRevenueTimeseriesItem[];
}

export interface AnalyticsRevenueByBranchItem {
  branchId: string;
  branchName: string;
  revenue: number;
  purchasesCount: number;
}

export interface AdminAnalyticsRevenueByBranchResponse {
  message: string;
  data: AnalyticsRevenueByBranchItem[];
}

export interface AnalyticsRevenueByPackageItem {
  packageId: string;
  packageName: string;
  revenue: number;
  purchasesCount: number;
}

export interface AdminAnalyticsRevenueByPackageResponse {
  message: string;
  data: AnalyticsRevenueByPackageItem[];
}

export interface AdminOperationsMetrics {
  newUsers: number;
  activePackages: number;
  checkins: number;
  ptAcceptedSessions: number;
}

export interface AdminOperationsResponse {
  message: string;
  data: AdminOperationsMetrics;
}
