'use client';

import React, { useMemo, useState, useEffect } from 'react';
import CourseGrid, { Course as CourseGridCourse } from '../CourseGrid';
import CertificateCard from '../CertificateCard';
import FinalGradesList from './FinalGradesList';
import Toast from '../Toast';
import { getStudentsStatus, deleteUser as apiDeleteUser, blockUser as apiBlockUser, unblockUser as apiUnblockUser, getUserCertificates, StudentItem, StudentCourse, EnrolledDiplomaItem } from '../../utils/studentsService';
import { FiUser, FiMail, FiPhone, FiCalendar, FiGlobe, FiBook, FiBriefcase, FiClock, FiCheckCircle, FiXCircle, FiAward, FiArrowLeft, FiEye, FiImage } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

type StudentCourseWithScore = StudentCourse & { finalExamScore: number };

interface CertificateItem {
  courseName: string;
  completionDate: string;
  certificateId?: string;
  certificateImage?: string;
  downloadUrl?: string;
  verificationUrl?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  email_verified_at: string | null;
  is_blocked: boolean;
  courses: StudentCourseWithScore[];
  diplomas: EnrolledDiplomaItem[];
  certificates: CertificateItem[];
  total_courses: number;
  total_diplomas: number;
  completed_courses: number;
  active_diplomas: number;
  nationality: string | null;
  qualification: string | null;
  media_work_sector: string | null;
  date_of_birth: string | null;
  previous_field: string | null;
}

// Helper: map API StudentItem to local Student
const mapItemToStudent = (s: StudentItem): Student => ({
  id: Number(s.id),
  name: String(s.name ?? ''),
  email: String(s.email ?? ''),
  phone: s.phone ?? null,
  created_at: s.created_at ?? '',
  email_verified_at: s.email_verified_at ?? null,
  is_blocked: Boolean(s.is_blocked),
  courses: (s.courses ?? []).map((c: any) => ({
    ...c,
    finalExamScore: c?.final_exam_score ?? 0,
  })) as StudentCourseWithScore[],
  diplomas: (s.diplomas ?? []) as EnrolledDiplomaItem[],
  certificates: [],
  total_courses: Number(s.total_courses ?? ((s.courses ?? []).length)),
  total_diplomas: Number(s.total_diplomas ?? ((s.diplomas ?? []).length)),
  completed_courses: Number(s.completed_courses ?? 0),
  active_diplomas: Number(s.active_diplomas ?? 0),
  nationality: s.nationality ?? null,
  qualification: s.qualification ?? null,
  media_work_sector: s.media_work_sector ?? null,
  date_of_birth: s.date_of_birth ?? null,
  previous_field: s.previous_field ?? null,
});

export default function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  // All pages cache for global search
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allLoaded, setAllLoaded] = useState<boolean>(false);
  const [fetchingAll, setFetchingAll] = useState<boolean>(false);
  // Added: global stats state from backend
  const [globalStats, setGlobalStats] = useState<{ total: number; active: number; blocked: number }>({ total: 0, active: 0, blocked: 0 });

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [sortOption, setSortOption] = useState<'none' | 'highestGrade' | 'courseCount'>('none');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'courses' | 'certificates' | 'finalGrades' | 'studentInfo' | 'diplomas' | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [certLoading, setCertLoading] = useState<boolean>(false);

  // Initial load (page 1)
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const { data, pagination, stats } = await getStudentsStatus(1, 10);
        const mapped = data.map(mapItemToStudent);
        setStudents(mapped);
        setCurrentPage(pagination?.current_page ?? 1);
        setLastPage(pagination?.last_page ?? 1);
        setPerPage(pagination?.per_page ?? 10);
        setTotal(pagination?.total ?? mapped.length);
        // set global stats from backend if available, else fallback
        if (stats) {
          setGlobalStats({
            total: Number(stats.total_students ?? pagination?.total ?? mapped.length),
            active: Number(stats.active_students ?? 0),
            blocked: Number(stats.blocked_students ?? 0),
          });
        } else {
          setGlobalStats({
            total: Number(pagination?.total ?? mapped.length),
            active: mapped.filter((s) => !s.is_blocked).length,
            blocked: mapped.filter((s) => s.is_blocked).length,
          });
        }
        setError('');
      } catch (err) {
        console.error('Failed to load students', err);
        setError('فشل تحميل بيانات الطلاب');
        setToastMessage('فشل تحميل بيانات الطلاب');
        setToastType('error');
        setToastVisible(true);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Prefetch all pages for global search
  useEffect(() => {
    const prefetchAll = async () => {
      if (lastPage <= 1 || allLoaded) return;
      try {
        setFetchingAll(true);
        const all: Student[] = [];
        for (let p = 1; p <= lastPage; p++) {
          const { data } = await getStudentsStatus(p, perPage);
          all.push(...data.map(mapItemToStudent));
        }
        setAllStudents(all);
        setAllLoaded(true);
      } catch (e) {
        console.error('Failed to prefetch all students', e);
      } finally {
        setFetchingAll(false);
      }
    };
    prefetchAll();
  }, [lastPage, perPage, allLoaded]);

  // Load a specific page
  const loadPage = async (page: number) => {
    try {
      setLoading(true);
      const { data, pagination, stats } = await getStudentsStatus(page, perPage);
      const mapped = data.map(mapItemToStudent);
      setStudents(mapped);
      setCurrentPage(pagination?.current_page ?? page);
      setLastPage(pagination?.last_page ?? lastPage);
      setPerPage(pagination?.per_page ?? perPage);
      setTotal(pagination?.total ?? total);
      // refresh global stats from backend
      if (stats) {
        setGlobalStats({
          total: Number(stats.total_students ?? pagination?.total ?? mapped.length),
          active: Number(stats.active_students ?? 0),
          blocked: Number(stats.blocked_students ?? 0),
        });
      }
    } catch (e) {
      console.error('Failed to load page', e);
      setToastMessage('تعذر تحميل الصفحة المحددة');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // handlePageChange (duplicate removed; see earlier definition)


  // General stats: always show global stats from backend
  const stats = useMemo(() => ({
    total: globalStats.total,
    active: globalStats.active,
    blocked: globalStats.blocked,
  }), [globalStats]);

  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.id === selectedStudentId) || students.find((s) => s.id === selectedStudentId) || null,
    [students, allStudents, selectedStudentId]
  );

  const studentCourses = useMemo(() => {
    const courses = selectedStudent?.courses ?? [];
    return courses.map((c: any) => ({
      ...c,
      image: c.cover_image_url,
      description: c.description ?? '',
      pivot: {
        created_at: c.created_at ?? '',
        completed_at: c.completed_at ?? null,
        progress: c.progress_percentage ?? 0,
      },
    }));
  }, [selectedStudent]);

  const studentDiplomas = useMemo(() => {
    const diplomas = selectedStudent?.diplomas ?? [];
    return diplomas.map((d: any) => ({
      ...d,
      image: d.image ?? undefined,
      title: d.category_name,
      description: d.description ?? '',
      slug: d.category_slug,
      pivot: {
        created_at: d.enrolled_at ?? '',
        completed_at: null,
        progress: 0,
      },
      courses: Array.from({ length: d.courses_count ?? 0 }),
    }));
  }, [selectedStudent]);

  const openCoursesModal = (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalType('courses');
    setModalOpen(true);
  };

  const openDiplomasModal = (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalType('diplomas');
    setModalOpen(true);
  };

  const openStudentInfoModal = (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalType('studentInfo');
    setModalOpen(true);
  };

  const openCertificatesModal = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalType('certificates');
    setModalOpen(true);
    try {
      setCertLoading(true);
      const certs = await getUserCertificates(studentId);
      setStudents((prev) => prev.map((s) => (
        s.id === studentId
          ? {
              ...s,
              certificates: certs || [],
            }
          : s
      )));
    } catch (e) {
      console.error('Failed to load certificates', e);
      setToastMessage('تعذر تحميل شهادات الطالب');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setCertLoading(false);
    }
  };

  const openFinalGradesModal = (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalType('finalGrades');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudentId(null);
    setModalType(null);
  };

  const deleteStudent = (id: number) => {
    setToastMessage('هل أنت متأكد من حذف الطالب؟');
    setToastType('confirm');
    setPendingDeleteId(id);
    setToastVisible(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId !== null) {
      try {
        await apiDeleteUser(pendingDeleteId);
        setStudents((prev) => prev.filter((s) => s.id !== pendingDeleteId));
        setAllStudents((prev) => prev.filter((s) => s.id !== pendingDeleteId));
        setTotal((t) => (t > 0 ? t - 1 : 0));
        setToastMessage('تم حذف الطالب بنجاح');
        setToastType('success');
      } catch (e) {
        console.error('Delete user failed', e);
        setToastMessage('فشل حذف الطالب');
        setToastType('error');
      } finally {
        setPendingDeleteId(null);
        setTimeout(() => setToastVisible(false), 2000);
      }
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setToastVisible(false);
  };

  const closeToast = () => {
    setToastVisible(false);
    setPendingDeleteId(null);
  };

  const toggleBlockStudent = async (id: number) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;
    const willBlock = !target.is_blocked;
    try {
      if (willBlock) {
        await apiBlockUser(id);
      } else {
        await apiUnblockUser(id);
      }
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_blocked: willBlock } : s)));
      setAllStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_blocked: willBlock } : s)));
    } catch (e) {
      console.error('Block/unblock failed', e);
      setToastMessage('تعذر تحديث حالة الحساب');
      setToastType('error');
      setToastVisible(true);
    }
  };

  // Load a specific page (duplicate removed; see earlier definition)


  const handlePageChange = (page: number) => {
    if (page < 1 || page > lastPage || page === currentPage) return;
    loadPage(page);
  };

  const calcFinalExamAverage = (student: Student) => {
    if (!student?.courses || !student.courses.length) return 'غير متوفر';
    const coursesWithExams = student.courses.filter(c => c.finalExamScore !== undefined && c.finalExamScore !== null);
    if (!coursesWithExams.length) return 'غير متوفر';
    
    const totalScore = coursesWithExams.reduce((sum, c) => sum + Number(c.finalExamScore || 0), 0);
    const avg = Math.round(totalScore / coursesWithExams.length);
    return isNaN(avg) ? 'غير متوفر' : `${avg}%`;
  };

  // General stats (duplicate removed; using globalStats)


  // Derived list after applying search, filter, and sort
  const visibleStudents = useMemo(() => {
    let list = [...(searchQuery.trim() ? (allLoaded ? allStudents : students) : students)];

    // Search by name or email
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const name = s.name.toLowerCase();
        const email = s.email.toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    // Filter by status
    if (statusFilter === 'active') {
      list = list.filter((s) => !s.is_blocked);
    } else if (statusFilter === 'blocked') {
      list = list.filter((s) => s.is_blocked);
    }

    // Sort options
    if (sortOption === 'highestGrade') {
      list.sort((a, b) => calcFinalExamAverage(b) - calcFinalExamAverage(a));
    } else if (sortOption === 'courseCount') {
      list.sort((a, b) => b.total_courses - a.total_courses);
    }

    return list;
  }, [students, allStudents, allLoaded, searchQuery, statusFilter, sortOption]);

  return (
    <div className="students-management">
      {loading && (
        <div className="sm-loading">جاري تحميل بيانات الطلاب...</div>
      )}
      {error && (
        <div className="sm-error">{error}</div>
      )}
      <div className="sm-header">
        <h1 className="sm-title">إدارة الطلاب</h1>
        <p className="sm-subtitle">عرض وإدارة بيانات الطلاب ضمن لوحة الإدارة</p>
      </div>

      {/* Controls: Search, Filter, Sort */}
      <div className="sm-controls">
        <input
          type="text"
          className="sm-input"
          placeholder="بحث بالاسم أو البريد"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="sm-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="blocked">محظور</option>
        </select>

        {/* <select
          className="sm-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as 'none' | 'highestGrade' | 'courseCount')}
        >
          <option value="none">بدون فرز</option>
          <option value="highestGrade">أعلى درجة</option>
          <option value="courseCount">عدد الدورات</option>
        </select> */}

        <button
          className="sm-btn sm-reset-btn"
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setSortOption('none');
          }}
        >
          إعادة تعيين
        </button>
      </div>

      {/* General stats above the table */}
      <div className="sm-stats" aria-label="إحصائيات عامة">
        <div className="sm-stat-card">
          <div className="sm-stat-label">إجمالي الطلاب المسجلين</div>
          <div className="sm-stat-value">{stats.total}</div>
        </div>
        <div className="sm-stat-card">
          <div className="sm-stat-label">عدد النشطين</div>
          <div className="sm-stat-value sm-stat-positive">{stats.active}</div>
        </div>
        <div className="sm-stat-card">
          <div className="sm-stat-label">عدد المحظورين</div>
          <div className="sm-stat-value sm-stat-negative">{stats.blocked}</div>
        </div>
      </div>

      <div className="sm-table-wrapper">
        <table className="sm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الجنسية</th>
              <th>عدد الدورات</th>
              <th>عدد الدبلومات</th>
              <th>متوسط الامتحان النهائي</th>
              <th>حالة الحساب</th>
              <th>عرض المعلومات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student, index) => (
              <tr key={student.id}>
                <td>{searchQuery.trim() ? index + 1 : (currentPage - 1) * perPage + index + 1}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.nationality || 'غير محددة'}</td>
                <td>{student.total_courses}</td>
                <td>{student.total_diplomas}</td>
                <td>
                  <button 
                    className="sm-btn grade-btn" 
                    onClick={() => openFinalGradesModal(student.id)}
                    title="عرض درجات الامتحان النهائي"
                  >
                    {calcFinalExamAverage(student)}
                  </button>
                </td>
                <td>
                  {student.is_blocked ? (
                    <span className="blocked-badge">محظور</span>
                  ) : (
                    <span className="active-badge">نشط</span>
                  )}
                </td>
                <td>
                  <button className="sm-btn view-btn" onClick={() => openStudentInfoModal(student.id)}>
                    عرض المعلومات
                  </button>
                </td>
                <td className="sm-actions">
                  <button className="sm-btn delete-btn" onClick={() => deleteStudent(student.id)}>
                    حذف
                  </button>
                  <button className="sm-btn block-btn" onClick={() => toggleBlockStudent(student.id)}>
                    {student.is_blocked ? 'إلغاء الحظر' : 'حظر الحساب'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!searchQuery.trim() && lastPage > 1 && (
        <div className="sm-pagination">
          <button
            className="sm-btn page-nav prev-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            title="الصفحة السابقة"
          >
            السابق
          </button>
          
          <div className="sm-page-info">
            <span className="page-label">الصفحة</span>
            <input
              type="number"
              className="page-input"
              value={currentPage}
              min={1}
              max={lastPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= lastPage) {
                  handlePageChange(page);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value);
                  if (page >= 1 && page <= lastPage) {
                    handlePageChange(page);
                  }
                }
              }}
            />
            <span className="page-total">من {lastPage}</span>
          </div>

          <button
            className="sm-btn page-nav next-btn"
            disabled={currentPage === lastPage}
            onClick={() => handlePageChange(currentPage + 1)}
            title="الصفحة التالية"
          >
            التالي
          </button>
        </div>
      )}

      {modalOpen && selectedStudent && (
        <div className="sm-modal" onClick={closeModal}>
          <div className="sm-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="sm-modal-close" onClick={closeModal}>
              ×
            </button>
            {modalType === 'courses' && (
              <div>
                <div className="sm-modal-header">
                  <div className="sm-modal-header-content">
                    <button className="sm-back-btn" onClick={() => setModalType('studentInfo')}>
                      <FiArrowLeft className="sm-back-icon" />
                      رجوع
                    </button>
                    <div className="sm-modal-title-section">
                      <FiBook className="sm-modal-icon" />
                      <h2 className="sm-modal-title">دورات الطالب: {selectedStudent.name}</h2>
                    </div>
                  </div>
                </div>
                <div className="sm-courses-container">
                  {studentCourses.length === 0 ? (
                    <div className="sm-empty-state">
                      <FiBook className="sm-empty-icon" />
                      <p className="sm-empty-text">لا توجد دورات مسجلة لهذا الطالب</p>
                    </div>
                  ) : (
                    <div className="sm-courses-grid">
                      {studentCourses.map((course) => (
                        <div key={course.id} className="sm-course-card">
                          <div className="sm-course-image-container">
                            {course.image ? (
                              <img 
                                src={course.image} 
                                alt={course.title}
                                className="sm-course-image"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (sibling) sibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="sm-course-image-placeholder" style={{ display: course.image ? 'none' : 'flex' }}>
                              <FiImage className="sm-placeholder-icon" />
                            </div>
                            <div className="sm-course-status-badge">
                              {course.pivot?.completed_at ? (
                                <span className="sm-status-completed">
                                  <FiCheckCircle className="sm-status-icon" />
                                  مكتملة
                                </span>
                              ) : (
                                <span className="sm-status-in-progress">
                                  <FiClock className="sm-status-icon" />
                                  جارية
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="sm-course-content">
                            <h3 className="sm-course-title">{course.title}</h3>
                            <p className="sm-course-description">{course.description || 'لا يوجد وصف متاح'}</p>
                            <div className="sm-course-details">
                              {course.pivot?.created_at ? (
                                <div className="sm-course-detail">
                                  <FiCalendar className="sm-detail-icon" />
                                  <span className="sm-detail-text">
                                    تاريخ التسجيل: {new Date(course.pivot.created_at).toLocaleDateString('ar-SA')}
                                  </span>
                                </div>
                              ) : null}
                              {course.pivot?.completed_at && (
                                <div className="sm-course-detail">
                                  <FiCheckCircle className="sm-detail-icon completed" />
                                  <span className="sm-detail-text">
                                    تاريخ الإكمال: {new Date(course.pivot.completed_at).toLocaleDateString('ar-SA')}
                                  </span>
                                </div>
                              )}
                              {course.pivot?.progress !== undefined && (
                                <div className="sm-course-detail">
                                  <div className="sm-progress-container">
                                    <span className="sm-progress-label">التقدم:</span>
                                    <div className="sm-progress-bar">
                                      <div 
                                        className="sm-progress-fill" 
                                        style={{ width: `${course.pivot.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="sm-progress-text">{course.pivot.progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="sm-course-actions">
                              <button className="sm-btn sm-btn-outline" onClick={() => window.open(`/courses/${course.id}`, '_blank')}>
                                <FiEye className="sm-btn-icon" />
                                عرض الدورة
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {modalType === 'diplomas' && (
              <div>
                <div className="sm-modal-header">
                  <div className="sm-modal-header-content">
                    <button className="sm-back-btn" onClick={() => setModalType('studentInfo')}>
                      <FiArrowLeft className="sm-back-icon" />
                      رجوع
                    </button>
                    <div className="sm-modal-title-section">
                      <FaGraduationCap className="sm-modal-icon" />
                      <h2 className="sm-modal-title">دبلومات الطالب: {selectedStudent.name}</h2>
                    </div>
                  </div>
                </div>
                <div className="sm-diplomas-container">
                  {studentDiplomas.length === 0 ? (
                    <div className="sm-empty-state">
                      <FaGraduationCap className="sm-empty-icon" />
                      <p className="sm-empty-text">لا توجد دبلومات مسجلة لهذا الطالب</p>
                    </div>
                  ) : (
                    <div className="sm-diplomas-grid">
                      {studentDiplomas.map((diploma) => (
                        <div key={diploma.id} className="sm-diploma-card">
                          <div className="sm-diploma-image-container">
                            {diploma.image ? (
                              <img 
                                src={diploma.image} 
                                alt={diploma.title}
                                className="sm-diploma-image"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (sibling) sibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="sm-diploma-image-placeholder" style={{ display: diploma.image ? 'none' : 'flex' }}>
                              <FiImage className="sm-placeholder-icon" />
                            </div>
                            <div className="sm-diploma-status-badge">
                              {diploma.pivot?.completed_at ? (
                                <span className="sm-status-completed">
                                  <FiCheckCircle className="sm-status-icon" />
                                  مكتملة
                                </span>
                              ) : (
                                <span className="sm-status-in-progress">
                                  <FiClock className="sm-status-icon" />
                                  نشطة
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="sm-diploma-content">
                            <h3 className="sm-diploma-title">{diploma.title}</h3>
                            <p className="sm-diploma-description">{diploma.description || 'لا يوجد وصف متاح'}</p>
                            <div className="sm-diploma-details">
                              <div className="sm-diploma-detail">
                                <FiCalendar className="sm-detail-icon" />
                                <span className="sm-detail-text">
                                  تاريخ التسجيل: {new Date(diploma.pivot?.created_at).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              {diploma.pivot?.completed_at && (
                                <div className="sm-diploma-detail">
                                  <FiCheckCircle className="sm-detail-icon completed" />
                                  <span className="sm-detail-text">
                                    تاريخ الإكمال: {new Date(diploma.pivot.completed_at).toLocaleDateString('ar-SA')}
                                  </span>
                                </div>
                              )}
                              <div className="sm-diploma-detail">
                                <FiBook className="sm-detail-icon" />
                                <span className="sm-detail-text">
                                  عدد الدورات: {diploma.courses?.length || 0}
                                </span>
                              </div>
                              {diploma.pivot?.progress !== undefined && (
                                <div className="sm-diploma-detail">
                                  <div className="sm-progress-container">
                                    <span className="sm-progress-label">التقدم:</span>
                                    <div className="sm-progress-bar">
                                      <div 
                                        className="sm-progress-fill" 
                                        style={{ width: `${diploma.pivot.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="sm-progress-text">{diploma.pivot.progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="sm-diploma-actions">
                              <button className="sm-btn sm-btn-outline" onClick={() => window.open(`/diplomas/${diploma.slug}`, '_blank')}>
                                <FiEye className="sm-btn-icon" />
                                عرض الدبلوم
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {modalType === 'studentInfo' && (
              <div>
                <div className="sm-modal-header">
                  <div className="sm-modal-header-content">
                    <FiUser className="sm-modal-icon" />
                    <h2 className="sm-modal-title">معلومات الطالب: {selectedStudent.name}</h2>
                  </div>
                </div>
                <div className="sm-student-info">
                  <div className="sm-info-section">
                    <h3 className="sm-section-title">
                      <FiUser className="sm-section-icon" />
                      المعلومات الشخصية
                    </h3>
                    <div className="sm-info-grid">
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiUser className="sm-field-icon" />
                          <label>رقم الطالب:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.id}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiUser className="sm-field-icon" />
                          <label>الاسم:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.name}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiMail className="sm-field-icon" />
                          <label>البريد الإلكتروني:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.email}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiPhone className="sm-field-icon" />
                          <label>رقم الهاتف:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.phone || 'غير محدد'}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiGlobe className="sm-field-icon" />
                          <label>الجنسية:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.nationality || 'غير محدد'}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiCalendar className="sm-field-icon" />
                          <label>تاريخ الميلاد:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm-info-section">
                    <h3 className="sm-section-title">
                      <FiBriefcase className="sm-section-icon" />
                      المعلومات المهنية والأكاديمية
                    </h3>
                    <div className="sm-info-grid">
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FaGraduationCap className="sm-field-icon" />
                          <label>المؤهل العلمي:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.qualification || 'غير محدد'}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiBriefcase className="sm-field-icon" />
                          <label>قطاع العمل الإعلامي:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.media_work_sector || 'غير محدد'}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiBook className="sm-field-icon" />
                          <label>المجال السابق:</label>
                        </div>
                        <span className="sm-info-value">{selectedStudent.previous_field || 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm-info-section">
                    <h3 className="sm-section-title">
                      <FiClock className="sm-section-icon" />
                      معلومات الحساب
                    </h3>
                    <div className="sm-info-grid">
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          <FiCalendar className="sm-field-icon" />
                          <label>تاريخ التسجيل:</label>
                        </div>
                        <span className="sm-info-value">{new Date(selectedStudent.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          {selectedStudent.email_verified_at ? <FiCheckCircle className="sm-field-icon verified" /> : <FiXCircle className="sm-field-icon unverified" />}
                          <label>تأكيد البريد الإلكتروني:</label>
                        </div>
                        <span className={`sm-info-value ${selectedStudent.email_verified_at ? 'verified' : 'unverified'}`}>
                          {selectedStudent.email_verified_at ? 'مؤكد' : 'غير مؤكد'}
                        </span>
                      </div>
                      <div className="sm-info-field">
                        <div className="sm-info-label">
                          {selectedStudent.is_blocked ? <FiXCircle className="sm-field-icon blocked" /> : <FiCheckCircle className="sm-field-icon active" />}
                          <label>حالة الحساب:</label>
                        </div>
                        <span className={`sm-info-value ${selectedStudent.is_blocked ? 'blocked-status' : 'active-status'}`}>
                          {selectedStudent.is_blocked ? 'محظور' : 'نشط'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm-info-section">
                    <h3 className="sm-section-title">
                      <FiAward className="sm-section-icon" />
                      إحصائيات التعلم
                    </h3>
                    <div className="sm-stats-grid">
                      <div className="sm-stat-card">
                        <div className="sm-stat-icon">
                          <FiBook />
                        </div>
                        <div className="sm-stat-content">
                          <div className="sm-stat-number">{selectedStudent.total_courses}</div>
                          <div className="sm-stat-label">إجمالي الدورات</div>
                        </div>
                      </div>
                      <div className="sm-stat-card">
                        <div className="sm-stat-icon completed">
                          <FiCheckCircle />
                        </div>
                        <div className="sm-stat-content">
                          <div className="sm-stat-number">{selectedStudent.completed_courses}</div>
                          <div className="sm-stat-label">الدورات المكتملة</div>
                        </div>
                      </div>
                      <div className="sm-stat-card">
                        <div className="sm-stat-icon">
                          <FaGraduationCap />
                        </div>
                        <div className="sm-stat-content">
                          <div className="sm-stat-number">{selectedStudent.total_diplomas}</div>
                          <div className="sm-stat-label">إجمالي الدبلومات</div>
                        </div>
                      </div>
                      <div className="sm-stat-card">
                        <div className="sm-stat-icon active">
                          <FiAward />
                        </div>
                        <div className="sm-stat-content">
                          <div className="sm-stat-number">{selectedStudent.active_diplomas}</div>
                          <div className="sm-stat-label">الدبلومات النشطة</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm-info-actions">
                    <button className="sm-btn sm-btn-primary" onClick={() => openCoursesModal(selectedStudent.id)}>
                      <FiBook className="sm-btn-icon" />
                      عرض الدورات
                    </button>
                    <button className="sm-btn sm-btn-secondary" onClick={() => openDiplomasModal(selectedStudent.id)}>
                      <FaGraduationCap className="sm-btn-icon" />
                      عرض الدبلومات
                    </button>
                    <button className="sm-btn sm-btn-accent" onClick={() => openCertificatesModal(selectedStudent.id)}>
                      <FiAward className="sm-btn-icon" />
                      عرض الشهادات
                    </button>
                  </div>
                </div>
              </div>
            )}
            {modalType === 'certificates' && (
              <div>
                <h2 className="sm-modal-title">شهادات الطالب: {selectedStudent.name}</h2>
                {certLoading ? (
                  <p className="sm-empty">جاري تحميل الشهادات...</p>
                ) : (
                  <div className="sm-certificates-list">
                    {selectedStudent.certificates.length ? (
                      selectedStudent.certificates.map((cert, idx) => (
                        <CertificateCard
                          key={`${selectedStudent.id}-${idx}`}
                          courseName={cert.courseName}
                          completionDate={cert.completionDate}
                          certificateId={cert.certificateId}
                          certificateImage={cert.certificateImage}
                          downloadUrl={cert.downloadUrl}
                          verificationUrl={cert.verificationUrl}
                        />
                      ))
                    ) : (
                      <p className="sm-empty">لا توجد شهادات لهذا الطالب</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {modalType === 'finalGrades' && (
              <div>
                <h2 className="sm-modal-title">درجات الامتحان النهائي: {selectedStudent.name}</h2>
                <FinalGradesList courses={selectedStudent.courses.map((c: any) => ({ id: c.id, name: c.title, finalExamScore: c.finalExamScore, progress: c.progress_percentage }))} />
              </div>
            )}
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={closeToast}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}