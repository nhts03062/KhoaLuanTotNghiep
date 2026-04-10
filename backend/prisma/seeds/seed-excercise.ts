import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { ExerciseLevel, MuscleGroup } from '../../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const exercises = [
  {
    name: 'Romanian deadlift',
    description: 'Tập mông và cơ sau đùi, tăng sức mạnh posterior chain.',
    content:
      'Đứng chân hông, cầm tạ trước đùi. Hạ hông về sau, giữ lưng trung lập, tạ trượt dọc chân. Đẩy hông về trước để đứng dậy.',
    muscleGroup: MuscleGroup.LEGS,
    level: ExerciseLevel.ADVANCED,
    equipments: 'Barbell, rack',
    thumbnail: 'https://example.com/exercises/romanian-deadlift/thumb.jpg',
    videoUrl: 'https://example.com/exercises/romanian-deadlift/video.mp4',
    suggestion: 'Khởi động nhẹ trước khi tăng tạ; tránh cong lưng.',
    isActive: true,
  },
  {
    name: 'Barbell bench press',
    description: 'Bài tập ngực cơ bản với thanh đòn.',
    content:
      'Nằm trên ghế, chân chạm sàn. Hạ tạ xuống ngực, khuỷu khoảng 45°, đẩy thẳng lên trên.',
    muscleGroup: MuscleGroup.CHEST,
    level: ExerciseLevel.INTERMEDIATE,
    equipments: 'Barbell, bench, rack',
    thumbnail: 'https://example.com/exercises/bench-press/thumb.jpg',
    videoUrl: 'https://example.com/exercises/bench-press/video.mp4',
    suggestion: 'Giữ vai ép xuống ghế; không bật mông khỏi ghế.',
    isActive: true,
  },
  {
    name: 'Pull-up',
    description: 'Kéo xà kích hoạt lưng rộng và cánh tay.',
    content:
      'Treo người, lòng bàn tay hướng ra trước hoặc vào trong. Kéo cằm qua xà, hạ có kiểm soát.',
    muscleGroup: MuscleGroup.BACK,
    level: ExerciseLevel.INTERMEDIATE,
    equipments: 'Pull-up bar',
    thumbnail: 'https://example.com/exercises/pull-up/thumb.jpg',
    videoUrl: 'https://example.com/exercises/pull-up/video.mp4',
    suggestion: 'Có thể dùng dây kháng lực nếu chưa đủ sức.',
    isActive: true,
  },
  {
    name: 'Overhead press',
    description: 'Đẩy tạ qua đầu, phát triển vai và tay sau.',
    content:
      'Đứng hoặc ngồi, tạ ở vai. Đẩy thẳng lên, khóa khớp vai nhẹ, hạ từ từ.',
    muscleGroup: MuscleGroup.SHOULDERS,
    level: ExerciseLevel.BEGINNER,
    equipments: 'Barbell hoặc dumbbell',
    thumbnail: 'https://example.com/exercises/overhead-press/thumb.jpg',
    videoUrl: 'https://example.com/exercises/overhead-press/video.mp4',
    suggestion: 'Giữ core căng; tránh ưỡn ngực quá mức.',
    isActive: true,
  },
  {
    name: 'Dumbbell bicep curl',
    description: 'Cô lập cơ nhị đầu cánh tay.',
    content:
      'Đứng hai tay cầm tạ, xoay cổ tay nhẹ khi lên. Hạ từ từ, không đung đưa.',
    muscleGroup: MuscleGroup.ARMS,
    level: ExerciseLevel.BEGINNER,
    equipments: 'Dumbbells',
    thumbnail: 'https://example.com/exercises/bicep-curl/thumb.jpg',
    videoUrl: 'https://example.com/exercises/bicep-curl/video.mp4',
    suggestion: 'Khuỷu cố định bên hông; tránh dùng đà.',
    isActive: true,
  },
  {
    name: 'Plank',
    description: 'Giữ thân ổn định, tăng sức mạnh core.',
    content:
      'Khuỷu hoặc bàn tay chống sàn, thân thẳng từ đầu đến gót. Giữ nhịp thở đều.',
    muscleGroup: MuscleGroup.ABS,
    level: ExerciseLevel.BEGINNER,
    equipments: 'Không (thảm tùy chọn)',
    thumbnail: 'https://example.com/exercises/plank/thumb.jpg',
    videoUrl: 'https://example.com/exercises/plank/video.mp4',
    suggestion: 'Hông không nhô cao hoặc sụp xuống.',
    isActive: true,
  },
  {
    name: 'Burpee',
    description: 'Bài full body kết hợp squat, plank và nhảy.',
    content:
      'Đứng, squat chạm tay xuống, chân đá ra plank, chống đẩy (tuỳ chọn), nhảy chân về squat, bật nhảy lên.',
    muscleGroup: MuscleGroup.FULL_BODY,
    level: ExerciseLevel.ADVANCED,
    equipments: 'Không',
    thumbnail: 'https://example.com/exercises/burpee/thumb.jpg',
    videoUrl: 'https://example.com/exercises/burpee/video.mp4',
    suggestion: 'Giữ nhịp ổn định; nghỉ nếu tim đập quá nhanh.',
    isActive: true,
  },
  {
    name: 'Goblet squat',
    description: 'Squat cầm tạ trước ngực, phù hợp học động tác.',
    content:
      'Cầm một đầu tạ kettlebell/dumbbell trước ngực. Hông ngồi xuống, đầu gối theo hướng ngón chân.',
    muscleGroup: MuscleGroup.LEGS,
    level: ExerciseLevel.BEGINNER,
    equipments: 'Kettlebell hoặc dumbbell',
    thumbnail: 'https://example.com/exercises/goblet-squat/thumb.jpg',
    videoUrl: 'https://example.com/exercises/goblet-squat/video.mp4',
    suggestion: 'Gót chân luôn chạm sàn; độ sâu tùy khớp.',
    isActive: true,
  },
  {
    name: 'Seated cable row',
    description: 'Kéo cáp ngồi, tập giữa lưng.',
    content:
      'Ngồi chân đạp bàn, kéo tay cầm về bụng, ép vai sau. Thả từ từ.',
    muscleGroup: MuscleGroup.BACK,
    level: ExerciseLevel.BEGINNER,
    equipments: 'Cable machine, V-grip',
    thumbnail: 'https://example.com/exercises/cable-row/thumb.jpg',
    videoUrl: 'https://example.com/exercises/cable-row/video.mp4',
    suggestion: 'Lưng thẳng; tránh lắc người khi kéo.',
    isActive: true,
  },
  {
    name: 'Lateral raise',
    description: 'Nâng tạ sang ngang, tập cơ delta giữa.',
    content:
      'Đứng hai tay cầm tạ, khuỷu hơi cong, nâng ngang đến vai, hạ chậm.',
    muscleGroup: MuscleGroup.SHOULDERS,
    level: ExerciseLevel.INTERMEDIATE,
    equipments: 'Dumbbells',
    thumbnail: 'https://example.com/exercises/lateral-raise/thumb.jpg',
    videoUrl: 'https://example.com/exercises/lateral-raise/video.mp4',
    suggestion: 'Tránh dùng quán tính; chọn tạ nhẹ để form chuẩn.',
    isActive: true,
  },
  {
    name: 'Tricep rope pushdown',
    description: 'Đẩy dây cáp xuống, cô lập tay sau.',
    content:
      'Đứng trước máy cáp, khuỷu sát thân. Duỗi khuỷu xuống, tách đầu dây ở cuối động tác.',
    muscleGroup: MuscleGroup.ARMS,
    level: ExerciseLevel.INTERMEDIATE,
    equipments: 'Cable machine, rope attachment',
    thumbnail: 'https://example.com/exercises/tricep-pushdown/thumb.jpg',
    videoUrl: 'https://example.com/exercises/tricep-pushdown/video.mp4',
    suggestion: 'Khuỷu cố định; không đưa vai về phía trước.',
    isActive: true,
  },
  {
    name: 'Russian twist',
    description: 'Xoay thân ngồi, tập cơ xiên bụng.',
    content:
      'Ngồi gót chân chạm đất hoặc nhấc chân, nghiêng thân nhẹ, xoay tạ hai bên hông.',
    muscleGroup: MuscleGroup.ABS,
    level: ExerciseLevel.INTERMEDIATE,
    equipments: 'Medicine ball hoặc tạ đơn',
    thumbnail: 'https://example.com/exercises/russian-twist/thumb.jpg',
    videoUrl: 'https://example.com/exercises/russian-twist/video.mp4',
    suggestion: 'Giữ lưng không gù; xoay từ ngực, không chỉ cánh tay.',
    isActive: true,
  },
];

export async function seedExcercise() {
  await prisma.exercise.deleteMany({});
  await prisma.exercise.createMany({
    data: exercises,
  });
  console.log('Seeded 12 exercises.');
}
