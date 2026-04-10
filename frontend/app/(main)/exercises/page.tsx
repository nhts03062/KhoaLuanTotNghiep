'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  SearchOutlined,
  FireOutlined,
  FilterOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Spin } from 'antd';

import { getExercises, getPrograms } from '@/app/services/api';
import type { Exercise, Program, ProgramsResponse } from '@/app/types/types';
import { muscleGroupLabels, levelLabels } from '@/app/lib/exerciseLabels';
import ExerciseCard from '@/app/components/exercises/ExerciseCard';
import ExerciseVideoModal from '@/app/components/exercises/ExerciseVideoModal';
import FilterChip from '@/app/components/exercises/FilterChip';
import ProgramCard from '@/app/components/exercises/ProgramCard';
import ProgramExercisesModal from '@/app/components/exercises/ProgramExercisesModal';
import { appRoute } from '@/app/config/appRoute';

type TabKey = 'library' | 'programs';

export default function ExercisesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('library');
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<
    Exercise['muscleGroup'] | null
  >(null);
  const [selectedLevel, setSelectedLevel] = useState<Exercise['level'] | null>(
    null,
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exercises', 'list'],
    queryFn: () =>
      getExercises({ page: 1, itemsPerPage: 500 }),
  });

  const { data: programsRes, isLoading: programsLoading } =
    useQuery<ProgramsResponse>({
      queryKey: ['programs', 'public-list'],
      queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
      enabled: tab === 'programs',
    });

  const programs: Program[] = programsRes?.data ?? [];

  const exercises: Exercise[] = useMemo(
    () => (data?.data as Exercise[] | undefined) ?? [],
    [data],
  );

  const uniqueEquipments = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => {
      if (!e.equipments?.trim()) return;
      e.equipments.split(/[,;]/).forEach((s) => {
        const t = s.trim();
        if (t) set.add(t);
      });
    });
    return Array.from(set).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (
        search &&
        !ex.name.toLowerCase().includes(search.toLowerCase()) &&
        !ex.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (selectedMuscle && ex.muscleGroup !== selectedMuscle) return false;
      if (selectedLevel && ex.level !== selectedLevel) return false;
      if (selectedEquipment) {
        const eq = (ex.equipments || '').toLowerCase();
        if (!eq.includes(selectedEquipment.toLowerCase())) return false;
      }
      return true;
    });
  }, [
    exercises,
    search,
    selectedMuscle,
    selectedLevel,
    selectedEquipment,
  ]);

  const activeFiltersCount = [
    selectedMuscle,
    selectedLevel,
    selectedEquipment,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedMuscle(null);
    setSelectedLevel(null);
    setSelectedEquipment(null);
    setSearch('');
  };

  const muscleEntries = Object.entries(muscleGroupLabels) as [
    Exercise['muscleGroup'],
    string,
  ][];
  const levelEntries = Object.entries(levelLabels) as [
    Exercise['level'],
    string,
  ][];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,23,23,0.06),transparent_60%)]" />
        <div className="container relative mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center rounded-sm bg-neutral-900/5 px-4 py-1.5 text-sm font-semibold text-neutral-900">
              <FireOutlined className="mr-2" />
              THƯ VIỆN BÀI TẬP
            </span>
            <h1 className="mt-4 text-4xl font-bold text-neutral-900 md:text-5xl">
              LUYỆN TẬP <span className="text-neutral-600">ĐÚNG CÁCH</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Khám phá {exercises.length}+ bài tập với video hướng dẫn và các
              chương trình tập mẫu từ đội ngũ chuyên gia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex gap-1 rounded-sm bg-neutral-200/80 p-1">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`flex-1 rounded-sm py-2.5 text-sm font-semibold transition-all ${
              tab === 'library'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Thư viện bài tập
          </button>
          <button
            type="button"
            onClick={() => setTab('programs')}
            className={`flex-1 rounded-sm py-2.5 text-sm font-semibold transition-all ${
              tab === 'programs'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Chương trình tập mẫu
          </button>
        </div>
      </div>

      {/* Content */}
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <AnimatePresence mode="wait">
          {tab === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8 space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <SearchOutlined className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài tập..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-sm border border-neutral-200 bg-white py-3 pl-11 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-sm border px-4 py-3 text-sm font-semibold transition-all ${
                      showFilters || activeFiltersCount > 0
                        ? 'border-neutral-900 bg-neutral-900/5 text-neutral-900'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <FilterOutlined />
                    Bộ lọc
                    {activeFiltersCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden rounded-sm border border-neutral-200 bg-white"
                    >
                      <div className="space-y-4 p-5">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-neutral-900">
                            Nhóm cơ
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {muscleEntries.map(([key, label]) => (
                              <FilterChip
                                key={key}
                                label={label}
                                active={selectedMuscle === key}
                                onClick={() =>
                                  setSelectedMuscle(
                                    selectedMuscle === key ? null : key,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-neutral-900">
                            Mức độ
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {levelEntries.map(([key, label]) => (
                              <FilterChip
                                key={key}
                                label={label}
                                active={selectedLevel === key}
                                onClick={() =>
                                  setSelectedLevel(
                                    selectedLevel === key ? null : key,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-neutral-900">
                            Dụng cụ
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {uniqueEquipments.length === 0 ? (
                              <span className="text-sm text-neutral-500">
                                Tải xong danh sách sẽ hiện dụng cụ.
                              </span>
                            ) : (
                              uniqueEquipments.map((eq) => (
                                <FilterChip
                                  key={eq}
                                  label={eq}
                                  active={selectedEquipment === eq}
                                  onClick={() =>
                                    setSelectedEquipment(
                                      selectedEquipment === eq ? null : eq,
                                    )
                                  }
                                />
                              ))
                            )}
                          </div>
                        </div>
                        {activeFiltersCount > 0 && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-sm text-neutral-900 hover:underline"
                          >
                            <CloseOutlined className="text-xs" /> Xóa tất cả bộ
                            lọc
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="mb-6 text-sm text-neutral-600">
                Hiển thị{' '}
                <span className="font-semibold text-neutral-900">
                  {filteredExercises.length}
                </span>{' '}
                bài tập
              </p>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <motion.div
                    layout
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <AnimatePresence>
                      {filteredExercises.map((ex) => (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          onClick={() => setActiveExercise(ex)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {filteredExercises.length === 0 && !isLoading && (
                    <div className="py-20 text-center">
                      <FireOutlined className="mx-auto text-5xl text-neutral-300" />
                      <p className="mt-4 text-lg text-neutral-500">
                        Không tìm thấy bài tập phù hợp
                      </p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-sm text-neutral-900 hover:underline"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="programs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <p className="text-neutral-600">
                Các chương trình tập được thiết kế bởi đội ngũ PT chuyên nghiệp.
              </p>
              {programsLoading ? (
                <div className="flex justify-center py-20">
                  <Spin size="large" />
                </div>
              ) : programs.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  Chưa có chương trình tập nào.
                </div>
              ) : (
                programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onPreviewExercises={() => setPreviewProgram(program)}
                    onStartLearning={() =>
                      router.push(appRoute.home.programLearn(program.id))
                    }
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {previewProgram && (
          <ProgramExercisesModal
            key={previewProgram.id}
            program={previewProgram}
            onClose={() => setPreviewProgram(null)}
            onExerciseClick={(ex) => {
              setPreviewProgram(null);
              setActiveExercise(ex);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeExercise && (
          <ExerciseVideoModal
            key={activeExercise.id}
            exercise={activeExercise}
            onClose={() => setActiveExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
