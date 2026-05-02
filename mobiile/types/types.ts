export interface UserAccount {
  id: string;
  email: string;
  profile?: {
    name: string | null;
  };
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

export interface PtWeekGridCell {
  gridKey: string;
  weeklySlotId: string | null;
  state: "FREE" | "OCCUPIED" | "UNAVAILABLE" | "PASSED";
  startTime: string;
  endTime: string;
}

export interface PtWeekGridDay {
  date: string;
  dayOfWeek: number;
  slots: PtWeekGridCell[];
}

export interface PtWeekGridRow {
  key: string;
  startTime: string;
  endTime: string;
}

export interface PtWeekBookingGridData {
  weekStart: string;
  days: PtWeekGridDay[];
  gridRows: PtWeekGridRow[];
}

export interface PtWeekBookingGridResponse {
  message: string;
  data: PtWeekBookingGridData;
}

export interface PtAccount {
  id: string;
  email: string;
  profile?: {
    name: string | null;
    gender: string;
    phone: string;
    dateOfBirth: string | null;
    avatar: string | null;
    height: number | null;
    weight: number | null;
    fitnessGoal: string | null;
  };
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

export interface Package {
  id: string;
  name: string;
  unit: "DAY" | "MONTH";
  durationValue: number;
  hasPt: boolean;
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
  unit: "DAY" | "MONTH";
  durationValue: number;
  hasPt: boolean;
  price: number;
}

export interface CreatePackageResponse {
  message: string;
  data: Package;
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
  ptAccountId?: string;
}

export interface PurchasePackageResponse {
  message: string;
  data: Package;
}

export interface MyPurchasePackage {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId: string;
  programId?: string | null;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REJECTED";
  startAt: string | null;
  endAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  package: Package;
  ptAccount: PtAccount | null;
}

export interface MyPurchasePackagesResponse {
  message: string;
  data: MyPurchasePackage[];
}

export interface TraineeRequest {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REJECTED";
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

export interface CreatePtAssistRequest {
  userPackageId: string;
  slotId: string;
  sessionDate: string;
  note?: string;
}

export interface PtTrainingSlotForUser {
  id: string;
  ptAccountId: string;
  branchId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  note: string | null;
  branch: {
    id: string;
    name: string;
    address?: string;
  };
  usedSeats: number;
  availableSeats: number;
  isFull: boolean;
}

export interface PtTrainingSlotsForUserResponse {
  message: string;
  data: PtTrainingSlotForUser[];
}

export interface PtAssistRequest {
  id: string;
  accountId: string;
  userPackageId: string;
  branchId: string;
  ptAccountId: string;
  startTime: string;
  endTime: string;
  note?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  branch: {
    id: string;
    name: string;
  };
  ptAccount: {
    id: string;
    email: string;
  };
}

export interface CreatePtAssistRequestResponse {
  message: string;
  data: PtAssistRequest;
}

export interface PTAssistSchedule {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
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

export interface ReportUserSessionRequest {
  ptAssistRequestId: string;
  completion: "COMPLETED" | "INCOMPLETE";
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
  completion: "COMPLETED" | "INCOMPLETE";
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
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
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

export interface CreateWorkoutHistoryRequest {
  userPackageId: string;
  programDayId: string;
  workoutAt: string;
  status: "COMPLETED" | "SKIPPED";
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
  status: "COMPLETED" | "SKIPPED";
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

export interface CheckInRequest {
  userPackageId: string;
  branchId: string;
}

export interface CheckInResponse {
  message: string;
  data: any;
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

export interface Exercise {
  id: string;
  name: string;
  description: string;
  content: string;
  muscleGroup: "CHEST" | "BACK" | "ARMS" | "LEGS" | "ABS" | "CORE" | "CARDIO";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
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

export type ProgramLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

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

export interface Profile {
  id: string;
  accountId: string;
  name: string | null;
  gender: "MALE" | "FEMALE" | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  fitnessGoal:
    | "LOSE_WEIGHT"
    | "GAIN_MUSCLE"
    | "IMPROVE_HEALTH"
    | "MAINTAIN_WEIGHT"
    | null;
  createdAt: string;
  updatedAt: string;
  email: string;
}

export interface ProfileResponse {
  message: string;
  data: Profile;
}

export interface UpdateProfileRequest {
  name?: string;
  gender?: "MALE" | "FEMALE";
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  height?: number;
  weight?: number;
  fitnessGoal?:
    | "LOSE_WEIGHT"
    | "GAIN_MUSCLE"
    | "IMPROVE_HEALTH"
    | "MAINTAIN_WEIGHT";
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
  data: TodayExcercise | null;
}

export interface RecommendProgramRequest {
  conversationId: string;
  userMessage: string;
}

export interface RecommendProgramResponse {
  message: string;
  data: {
    text: string;
  };
}

export interface RecommendNutritionRequest {
  conversationId: string;
  userMessage: string;
}

export interface RecommendNutritionResponse {
  message: string;
  data: {
    text: string;
  };
}
