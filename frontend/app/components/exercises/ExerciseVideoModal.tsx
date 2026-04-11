'use client';

import { motion } from 'motion/react';
import { CloseOutlined } from '@ant-design/icons';
import type { Exercise } from '@/app/types/types';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';

type ExerciseVideoModalProps = {
  exercise: Exercise;
  onClose: () => void;
};

export default function ExerciseVideoModal({
  exercise,
  onClose,
}: ExerciseVideoModalProps) {
  const hasVideo = Boolean(exercise.videoUrl?.trim());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
          aria-label="Đóng"
        >
          <CloseOutlined className="text-sm" />
        </button>
        <div className="aspect-video bg-neutral-900">
          {hasVideo ? (
            <iframe
              src={exercise.videoUrl}
              title={exercise.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              Chưa có video cho bài tập này.
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-neutral-900">{exercise.name}</h3>
          <p className="mt-2 text-neutral-600">{exercise.description}</p>
          {exercise.content && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-500">
              {exercise.content}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-sm bg-blue-50 px-3 py-1 font-semibold text-blue-800">
              {muscleGroupLabels[exercise.muscleGroup]}
            </span>
            <span className="rounded-sm bg-neutral-100 px-3 py-1 text-neutral-800">
              {levelLabels[exercise.level]}
            </span>
            <span className="rounded-sm bg-neutral-100 px-3 py-1 text-neutral-800">
              {exercise.equipments || '—'}
            </span>
            {exercise.suggestion && (
              <span className="ml-auto text-lg font-semibold text-neutral-900">
                {exercise.suggestion}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
