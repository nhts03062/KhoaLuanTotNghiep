'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarOutlined,
  DownOutlined,
  EyeOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { Program, ProgramDay, ProgramDayExercise } from '@/app/types/types';
import { levelLabels } from '@/app/lib/exerciseLabels';
import { formatDayOfWeekVietnamese } from '@/app/utils/common';

type ProgramCardProps = {
  program: Program;
  onPreviewExercises?: () => void;
  onStartLearning?: () => void;
};

function sortDayExercises(items: ProgramDayExercise[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export default function ProgramCard({
  program,
  onPreviewExercises,
  onStartLearning,
}: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sortedDays = useMemo(
    () =>
      [...(program.days ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [program.days],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm"
    >
      {program.thumbnail ? (
        <div className="h-40 w-full overflow-hidden bg-neutral-100">
          <img
            src={program.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-neutral-900">{program.name}</h3>
            <p className="mt-2 text-neutral-600">{program.description}</p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {onPreviewExercises ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewExercises();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                aria-label="Xem bài tập trong chương trình"
                title="Xem bài tập"
              >
                <EyeOutlined className="text-base" />
              </button>
            ) : null}
            <span className="rounded-sm bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white">
              {program.daysPerWeek} ngày/tuần
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-sm bg-neutral-100 px-3 py-1 text-sm text-neutral-800">
            {levelLabels[program.level]}
          </span>
          {onStartLearning ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartLearning();
              }}
              className="rounded-sm bg-neutral-900 px-3 py-1 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Bắt đầu học
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-neutral-600"
        >
          <CalendarOutlined />
          {expanded ? 'Ẩn lịch tập' : 'Xem lịch tập chi tiết'}
          {expanded ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-200"
          >
            <div className="divide-y divide-neutral-200">
              {sortedDays.length === 0 ? (
                <div className="px-6 py-4 text-sm text-neutral-500">
                  Chưa có lịch tập chi tiết.
                </div>
              ) : (
                sortedDays.map((day: ProgramDay) => {
                  const rows = sortDayExercises(day.exercises ?? []);
                  return (
                    <div key={day.id} className="px-6 py-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-sm font-bold text-neutral-900">
                          {formatDayOfWeekVietnamese(day.dayOfWeek)}
                        </span>
                        <span className="text-sm text-neutral-700">{day.title}</span>
                      </div>
                      {day.note ? (
                        <p className="mt-1 text-xs text-neutral-500">{day.note}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rows.length === 0 ? (
                          <span className="text-xs text-neutral-400">
                            Chưa gán bài tập
                          </span>
                        ) : (
                          rows.map((row) => (
                            <span
                              key={row.id}
                              className="rounded-sm bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
                            >
                              {row.exercise.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
