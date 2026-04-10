import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShiftType } from 'generated/prisma/enums';

/** Một ô thời khoá biểu PT bật (must match PT_BOOKING_GRID_SLOTS) */
export class PtWeeklySlotInputDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'startTime must be HH:mm',
  })
  startTime: string;

  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'endTime must be HH:mm',
  })
  endTime: string;
}

/** PT chọn ca → server bung tất cả ô lưới thuộc ca đó × các thứ trong tuần. */
export class PtShiftSelectionInputDto {
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  dayOfWeeks: number[];
}

export class CreatePtTrainingSlotDto {
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  /** Ngày bắt đầu (yyyy-MM-dd, inclusive, VN) */
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fromDate: string;

  /** Ngày kết thúc (yyyy-MM-dd, inclusive, VN) */
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  toDate: string;

  /** Các ô được bật (tuỳ chọn nếu đã dùng shiftSelections) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PtWeeklySlotInputDto)
  slots?: PtWeeklySlotInputDto[];

  /**
   * Chọn ca (MORNING / AFTERNOON / EVENING) + danh sách thứ (1=Mon … 7=Sun):
   * mỗi ô lưới thuộc ca đó được tạo cho từng thứ đã chọn.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PtShiftSelectionInputDto)
  shiftSelections?: PtShiftSelectionInputDto[];
}
