import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ExamCard from './ExamCard';
import { getEnrollmentFilters, getMyEnrolledCourses, getMyTestStatuses } from '../utils/courseService';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('../utils/courseService', () => ({
  getMyEnrolledCourses: jest.fn(),
  getMyTestStatuses: jest.fn(),
  getEnrollmentFilters: jest.fn(),
  getCourseDetails: jest.fn(),
  getCourseProgressDetails: jest.fn(),
}));

const completedCourse = { id: 6, title: 'Completed course', progress_percentage: 100, has_final_exam: true, category_id: 1 };
const activeCourse = { id: 7, title: 'Active exam course', progress_percentage: 100, has_final_exam: true, category_id: 1 };

beforeEach(() => {
  push.mockClear();
  (getMyEnrolledCourses as jest.Mock).mockResolvedValue({
    data: [completedCourse, activeCourse],
    pagination: { last_page: 1 },
  });
  (getEnrollmentFilters as jest.Mock).mockResolvedValue({ categories: [] });
  (getMyTestStatuses as jest.Mock).mockResolvedValue([
    { course_id: 6, course_status: 'completed', active_attempt_status: null },
    { course_id: 7, course_status: 'in_progress', active_attempt_status: 'in_progress' },
  ]);
});

test('classifies the active final exam separately from completed lessons', async () => {
  render(<ExamCard showAll />);

  const completed = await screen.findByText('Completed course');
  const active = screen.getByText('Active exam course');
  const completedCard = completed.closest('[class*="card"]') as HTMLElement;
  const activeCard = active.closest('[class*="card"]') as HTMLElement;

  expect(screen.getByRole('button', { name: 'الكل 2' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'مكتملة 1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'قيد الدراسة 1' })).toBeInTheDocument();
  expect(within(completedCard).getByText('مكتملة')).toBeInTheDocument();
  expect(within(activeCard).getByText('الامتحان قيد التنفيذ')).toBeInTheDocument();
  expect(within(completedCard).getByRole('button', { name: 'طلب النتيجة والشهادة' })).toBeInTheDocument();
  expect(within(activeCard).queryByRole('button', { name: 'طلب النتيجة والشهادة' })).not.toBeInTheDocument();

  fireEvent.click(within(activeCard).getByRole('button', { name: 'دخول الامتحان النهائي' }));
  expect(push).toHaveBeenCalledWith('/user/final-exam/7');

  fireEvent.click(screen.getByRole('button', { name: 'مكتملة 1' }));
  await waitFor(() => expect(screen.queryByText('Active exam course')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'قيد الدراسة 1' }));
  expect(screen.getByText('Active exam course')).toBeInTheDocument();
});

test('does not open the final exam before lesson progress reaches 100%', async () => {
  (getMyEnrolledCourses as jest.Mock).mockResolvedValue({
    data: [{ ...activeCourse, progress_percentage: 60 }],
    pagination: { last_page: 1 },
  });
  (getMyTestStatuses as jest.Mock).mockResolvedValue([
    { course_id: 7, course_status: 'in_progress', active_attempt_status: null },
  ]);

  render(<ExamCard showAll />);
  const course = await screen.findByText('Active exam course');
  const card = course.closest('[class*="card"]') as HTMLElement;
  expect(within(card).getByText('60%')).toBeInTheDocument();
  expect(within(card).getByRole('button', { name: 'دخول الامتحان النهائي' })).toBeDisabled();
  expect(within(card).queryByRole('button', { name: 'طلب النتيجة والشهادة' })).not.toBeInTheDocument();
});
