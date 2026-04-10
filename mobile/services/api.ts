import { FILTER_PROPS } from "@/types/filters";
import {
  CheckInHistoryResponse,
  CheckInRequest,
  CheckInResponse,
  AvailablePtResponse,
  PtWeekBookingGridResponse,
  CreateWorkoutHistoryRequest,
  CreateWorkoutHistoryResponse,
  CreatePtAssistRequest,
  CreatePtAssistRequestResponse,
  ExerciseDetailResponse,
  ExercisesResponse,
  ListWorkoutHistoryResponse,
  MyPurchasePackagesResponse,
  PTAssistSchedulesResponse,
  PtTrainingSlotsForUserResponse,
  PTTrainingHistoriesResponse,
  ProfileResponse,
  ReportUserSessionRequest,
  ReportUserSessionResponse,
  ProgramsResponse,
  RecommendNutritionRequest,
  RecommendNutritionResponse,
  RecommendProgramRequest,
  RecommendProgramResponse,
  TodayExcerciseResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@/types/types";
import axios from "./axios.customize";
import { API } from "./constant";

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

export const getMe = async (): Promise<{
  userId: string;
  role: string;
  email: string;
}> => {
  const res = await axios.get(API.AUTHENTICATION.PROFILE);
  return res as unknown as { userId: string; role: string; email: string };
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const res = await axios.get<ProfileResponse>(API.AUTHENTICATION.GET_PROFILE);
  return res as unknown as ProfileResponse;
};

export const updateProfile = async (
  request: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  const res = await axios.patch<UpdateProfileResponse>(
    API.AUTHENTICATION.UPDATE_PROFILE,
    request,
  );
  return res as unknown as UpdateProfileResponse;
};

export const getMyPurchasePackages = async (): Promise<any> => {
  const res = await axios.get<MyPurchasePackagesResponse>(
    API.USER.GET_PURCHASE_PACKAGE,
  );
  return res;
};

export const checkIn = async (request: CheckInRequest): Promise<any> => {
  const res = await axios.post<CheckInResponse>(API.USER.CHECK_IN, request);
  return res;
};

export const getCheckInHistory = async (): Promise<CheckInHistoryResponse> => {
  const res = await axios.get<CheckInHistoryResponse>(
    API.USER.GET_CHECK_IN_HISTORY,
  );
  return res as unknown as CheckInHistoryResponse;
};

export const getPTTrainingHistory = async (params?: {
  from?: string;
  to?: string;
}): Promise<PTTrainingHistoriesResponse> => {
  const res = await axios.get<PTTrainingHistoriesResponse>(
    API.USER.GET_PT_TRAINING_HISTORY,
    { params },
  );
  return res as unknown as PTTrainingHistoriesResponse;
};

export const getPtTrainingSlotsForUser = async (params: {
  userPackageId: string;
  from?: string;
  to?: string;
}): Promise<PtTrainingSlotsForUserResponse> => {
  const res = await axios.get<PtTrainingSlotsForUserResponse>(
    API.USER.GET_PT_TRAINING_SLOTS,
    {
      params,
    },
  );
  return res as unknown as PtTrainingSlotsForUserResponse;
};

export const getAvailablePTs = async (params: {
  branchId: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<AvailablePtResponse> => {
  const res = await axios.get<AvailablePtResponse>(API.USER.GET_AVAILABLE_PTS, {
    params,
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
    {
      params,
    },
  );
  return res as unknown as PtWeekBookingGridResponse;
};

export const getPTAssistSchedule = async (params: {
  from: string;
  to: string;
}): Promise<PTAssistSchedulesResponse> => {
  const res = await axios.get<PTAssistSchedulesResponse>(API.PT.GET_SCHEDULE, {
    params,
  });
  return res as unknown as PTAssistSchedulesResponse;
};

export const reportUserSession = async (
  request: ReportUserSessionRequest,
): Promise<ReportUserSessionResponse> => {
  const res = await axios.post<ReportUserSessionResponse>(
    API.PT.REPORT_USER_SESSION(),
    request,
  );
  return res as unknown as ReportUserSessionResponse;
};

export const getTodayExercise = async (): Promise<TodayExcerciseResponse> => {
  const res = await axios.get<TodayExcerciseResponse>(API.USER.GET_TODAY_EXERCISE);
  return res as unknown as TodayExcerciseResponse;
};

export const getListWorkoutHistory = async (filter?: {
  from?: string;
  to?: string;
}): Promise<ListWorkoutHistoryResponse> => {
  const res = await axios.get<ListWorkoutHistoryResponse>(
    API.USER.GET_LIST_WORKOUT_HISTORY,
    {
      params: {
        from: filter?.from,
        to: filter?.to,
      },
    },
  );
  return res as unknown as ListWorkoutHistoryResponse;
};

export const createWorkoutHistory = async (
  request: CreateWorkoutHistoryRequest,
): Promise<CreateWorkoutHistoryResponse> => {
  const res = await axios.post<CreateWorkoutHistoryResponse>(
    API.USER.CREATE_WORKOUT_HISTORY,
    request,
  );
  return res as unknown as CreateWorkoutHistoryResponse;
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

export const createPtAssistRequest = async (
  request: CreatePtAssistRequest,
): Promise<CreatePtAssistRequestResponse> => {
  const res = await axios.post<CreatePtAssistRequestResponse>(
    API.USER.CREATE_REQUEST_PT,
    request,
  );
  return res as unknown as CreatePtAssistRequestResponse;
};

export const recommendProgram = async (
  request: RecommendProgramRequest,
): Promise<RecommendProgramResponse> => {
  const res = await axios.post<RecommendProgramResponse>(
    API.AI.RECOMMEND_PROGRAM,
    request,
  );
  return res as unknown as RecommendProgramResponse;
};

export const recommendNutrition = async (
  request: RecommendNutritionRequest,
): Promise<RecommendNutritionResponse> => {
  const res = await axios.post<RecommendNutritionResponse>(
    API.AI.RECOMMEND_NUTRITION,
    request,
  );
  return res as unknown as RecommendNutritionResponse;
};
