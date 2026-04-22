export interface FILTER_PROPS {
  page?: number;
  itemsPerPage?: number;
  search?: string;
}
export interface FILTER_PACKAGE_PROPS {
  page?: number;
  itemsPerPage?: number;
  unit?: 'DAY' | 'MONTH';
  /** Khi gửi `false`, BE chỉ trả gói đã ngưng hoạt động. Bỏ qua = mặc định chỉ gói đang hoạt động. */
  isActive?: boolean;
}

export interface FILTER_PT_ASSIST_SCHEDULE_PROPS {
  from?: string;
  to?: string;
}
