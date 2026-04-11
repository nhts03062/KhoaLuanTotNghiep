'use client';

import { motion } from 'motion/react';
import { CloseOutlined } from '@ant-design/icons';
import type { Exercise, Program, ProgramDay, ProgramDayExercise } from '@/app/types/types';
import { formatDayOfWeekVietnamese } from '@/app/utils/common';

type ProgramExercisesModalProps = {
  program: Program;
  onClose: () => void;
  onExerciseClick: (exercise: Exercise) => void;
};

function sortDayExercises(items: ProgramDayExercise[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export default function ProgramExercisesModal({
  program,
  onClose,
  onExerciseClick,
}: ProgramExercisesModalProps) {
  const sortedDays = [...(program.days ?? [])].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl"
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

        <div className="border-b border-neutral-100 px-6 pb-4 pt-6 pr-14">
          <h2 className="text-xl font-bold text-neutral-900">{program.name}</h2>
          <p className="mt-2 text-sm text-neutral-600">{program.description}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4">
          {sortedDays.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">
              Chưa có lịch tập chi tiết.
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDays.map((day: ProgramDay) => {
                const rows = sortDayExercises(day.exercises ?? []);
                return (
                  <div key={day.id} className="rounded-sm border border-neutral-100 bg-neutral-50/80 p-4">
                    <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-bold text-neutral-900">
                        {formatDayOfWeekVietnamese(day.dayOfWeek)}
                      </span>
                      <span className="text-sm text-neutral-700">{day.title}</span>
                    </div>
                    {day.note ? (
                      <p className="mb-3 text-xs text-neutral-500">{day.note}</p>
                    ) : null}
                    {rows.length === 0 ? (
                      <p className="text-xs text-neutral-400">Chưa gán bài tập</p>
                    ) : (
                      <ul className="space-y-1">
                        {rows.map((row) => (
                          <li key={row.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onExerciseClick(row.exercise);
                              }}
                              className="w-full rounded-sm border border-transparent px-3 py-2.5 text-left text-sm text-neutral-800 transition-colors hover:border-neutral-200 hover:bg-white"
                            >
                              <span className="mr-2 inline-flex min-w-7 text-xs font-semibold text-neutral-400">
                                #{row.sortOrder}
                              </span>
                              {row.exercise.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
