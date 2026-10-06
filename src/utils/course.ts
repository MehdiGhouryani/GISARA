import { Course } from '../types/domain';

export type CourseLesson = Course['modules'][number]['lessons'][number];

/** Every lesson of a course in teaching order. Safe for courses with missing/empty modules. */
export function getAllLessons(course: Pick<Course, 'modules'> | null | undefined): CourseLesson[] {
  return (course?.modules || []).flatMap((m) => m?.lessons || []);
}

/** First lesson, or undefined for a course that has none yet (never index `modules[0].lessons[0]` directly). */
export function getFirstLesson(course: Pick<Course, 'modules'> | null | undefined): CourseLesson | undefined {
  return getAllLessons(course)[0];
}
