import type { Course } from '../../types';
import { t } from '../../utils/i18n';
import { LANGUAGE_MAP } from '../../services/duolingoService';

const CHART_COLORS = ['#58cc02', '#ce82ff', '#ff9600', '#ff4b4b', '#1cb0f6', '#ffc800'];

interface CourseListProps {
  courses: Course[];
  seq?: number;
}

export function CourseList({ courses, seq = 5 }: CourseListProps): React.ReactElement {
  const sortedCourses = [...courses].sort((a, b) => b.xp - a.xp);
  const totalCourseXp = sortedCourses.reduce((acc, c) => acc + c.xp, 0);
  const maxCourseXp = sortedCourses[0]?.xp ?? 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 border-b-4 border-gray-200 animate-fade-in-up delay-${Math.min(seq, 5)}`}>
      <div className="px-4 py-3 flex flex-col items-start justify-between gap-1 border-b border-gray-100 sm:flex-row sm:items-center sm:gap-2">
        <h2 className="text-gray-700 font-bold text-lg">{t('dash.distribution')}</h2>
        {courses.length > 0 && (
          <span className="text-xs text-gray-500">
            {t('dash.total_courses', { count: courses.length })} · {totalCourseXp.toLocaleString()} XP
          </span>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row gap-2 sm:gap-3 pb-2 sm:pb-0">
            {sortedCourses.map((course, idx) => {
              const percent = totalCourseXp > 0 ? ((course.xp / totalCourseXp) * 100).toFixed(1) : '0';
              const relativeWidth = maxCourseXp > 0 ? (course.xp / maxCourseXp) * 100 : 0;
              const color = CHART_COLORS[idx % CHART_COLORS.length];

              return (
                <div
                  key={course.id}
                  className="bg-gray-50 rounded-xl p-2.5 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex-1 min-w-0"
                >
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-gray-700 text-xs sm:text-sm truncate">
                      {course.title}
                      {course.fromLanguage && LANGUAGE_MAP[course.fromLanguage] && (
                        <span className="text-gray-400 font-normal ml-0.5 text-[10px] sm:text-xs">
                          ({LANGUAGE_MAP[course.fromLanguage]})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1.5 sm:mb-2">
                    <span className="text-base sm:text-xl font-black" style={{ color }}>{course.xp.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400">XP</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 ml-auto">{percent}%</span>
                  </div>

                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${relativeWidth}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center py-6">{t('status.no_data')}</div>
      )}
    </div>
  );
}

export default CourseList;
