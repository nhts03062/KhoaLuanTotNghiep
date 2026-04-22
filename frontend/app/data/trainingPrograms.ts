/** Dữ liệu mẫu — chưa có API chương trình tập */
export type TrainingProgram = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  schedule: {
    day: string;
    focus: string;
    exerciseNames: string[];
  }[];
};

export const trainingPrograms: TrainingProgram[] = [
  {
    id: '1',
    name: 'Full body 3 ngày',
    description:
      'Chương trình toàn thân phù hợp người mới, tập 3 buổi/tuần.',
    daysPerWeek: 3,
    level: 'BEGINNER',
    schedule: [
      {
        day: 'Thứ 2',
        focus: 'Ngực + vai',
        exerciseNames: ['Đẩy ngực trên ghế', 'Đẩy vai tạ đơn'],
      },
      {
        day: 'Thứ 4',
        focus: 'Lưng + tay sau',
        exerciseNames: ['Kéo xà', 'Tập tay sau dây'],
      },
      {
        day: 'Thứ 6',
        focus: 'Chân + core',
        exerciseNames: ['Squat', 'Plank'],
      },
    ],
  },
  {
    id: '2',
    name: 'Tăng sức mạnh 4 ngày',
    description: 'Chia nhóm cơ theo Upper/Lower, phù hợp trung cấp.',
    daysPerWeek: 4,
    level: 'INTERMEDIATE',
    schedule: [
      {
        day: 'Thứ 2',
        focus: 'Upper — đẩy',
        exerciseNames: ['Bench press', 'Overhead press'],
      },
      {
        day: 'Thứ 3',
        focus: 'Lower',
        exerciseNames: ['Deadlift', 'Leg press'],
      },
      {
        day: 'Thứ 5',
        focus: 'Upper — kéo',
        exerciseNames: ['Pull-up', 'Row'],
      },
      {
        day: 'Thứ 6',
        focus: 'Lower + core',
        exerciseNames: ['Lunge', 'Hanging leg raise'],
      },
    ],
  },
];
