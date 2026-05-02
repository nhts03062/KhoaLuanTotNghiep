export type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  image: any;
};

export const onboardingData: OnboardingItem[] = [
  {
    id: "1",
    title: "Bắt đầu hành trình Fitness",
    description:
      "Bắt đầu thay đổi bản thân ngay hôm nay với các bài tập có hướng dẫn và động lực hằng ngày.",
    image: require("@/assets/images/onboarding-community.jpg"),
  },
  {
    id: "2",
    title: "Theo dõi tiến độ mỗi ngày",
    description:
      "Ghi lại hành trình luyện tập, theo dõi sự thay đổi và duy trì thói quen tốt.",
    image: require("@/assets/images/onboarding-goals.jpg"),
  },
  {
    id: "3",
    title: "Luyện tập thông minh hơn",
    description:
      "Nhận gợi ý bài tập phù hợp với mục tiêu của bạn để đạt kết quả tốt hơn.",
    image: require("@/assets/images/onboarding-workout.jpg"),
  },
];
