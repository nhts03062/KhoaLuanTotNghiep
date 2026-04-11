'use client';

import { motion } from 'motion/react';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { Exercise } from '@/app/types/types';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';

type ExerciseCardProps = {
  exercise: Exercise;
  onClick: () => void;
};

export default function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const thumb = exercise.thumbnail || '/placeholder-exercise.jpg';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={exercise.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,' +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect fill="#e5e5e5" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#737373" font-family="sans-serif" font-size="14">No image</text></svg>',
              );
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white">
            <PlayCircleOutlined className="text-2xl" />
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-sm bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
          {muscleGroupLabels[exercise.muscleGroup]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-neutral-900">{exercise.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
          {exercise.description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
          <span className="rounded-sm bg-neutral-100 px-2 py-1">
            {levelLabels[exercise.level]}
          </span>
          <span className="rounded-sm bg-neutral-100 px-2 py-1 line-clamp-1">
            {exercise.equipments || '—'}
          </span>
          {exercise.suggestion && (
            <span className="ml-auto font-medium text-neutral-900">
              {exercise.suggestion}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
