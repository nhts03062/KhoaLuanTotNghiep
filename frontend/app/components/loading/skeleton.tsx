import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const SkeletonLoading = () => {
  return (
    <div className="flex items-center justify-center">
      <Skeleton containerClassName="flex-1" />
      <Skeleton count={5} containerClassName="flex-1" />
    </div>
  );
};
