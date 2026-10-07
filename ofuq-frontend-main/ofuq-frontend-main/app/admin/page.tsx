'use client';

import React, { useEffect, useState } from 'react';
import styles from './Admin.module.css';
import { getAdminCategories } from '../../utils/categoryService';
import { getStudentsStatus, EnrolledDiplomaItem } from '../../utils/studentsService';
import WorldUsersMap from '../../components/WorldUsersMap';
import { getGeneralStats, getStudentsByCountry } from '../../utils/statsService';

export default function AdminDashboard() {
  const [totalDiplomas, setTotalDiplomas] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [countriesCount, setCountriesCount] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [general, categories, studentsResp, countries] = await Promise.all([
          getGeneralStats(),
          getAdminCategories(),
          getStudentsStatus(),
          getStudentsByCountry(),
        ]);

        const students = studentsResp?.data ?? [];
        const stats = studentsResp?.stats;

        setTotalDiplomas(categories.length);
        setTotalStudents(general?.total_students ?? stats?.total_students ?? students.length);
        setTotalCourses(general?.total_courses ?? 0);
        setCountriesCount(Array.isArray(countries) ? countries.length : 0);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const enrollments: EnrolledDiplomaItem[] = students.flatMap((s: any) => s.diplomas || []);
        const monthlySum = enrollments.reduce((sum, d) => {
          const enrolledAt = d.enrolled_at ? new Date(d.enrolled_at) : null;
          const sameMonth = enrolledAt
            ? enrolledAt.getMonth() === currentMonth && enrolledAt.getFullYear() === currentYear
            : false;
          const isPaid = !d.is_free && Number(d.price) > 0;
          const isActive = (d.status || '').toLowerCase() === 'active';
          return sameMonth && isPaid && isActive ? sum + Number(d.price) : sum;
        }, 0);

        setMonthlyRevenue(monthlySum);
        setError('');
      } catch (e: any) {
        console.error('Failed to load admin stats', e);
        setError(e?.message || 'تعذر جلب الإحصائيات من الباك ايند');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value) + ' ج.م';
    } catch {
      return `${value} ج.م`;
    }
  };

  return (
    <>
      <div className={styles["dashboard-header"]}>
        <h1>لوحة التحكم الإدارية</h1>
        <p>مرحباً بك في لوحة التحكم الإدارية</p>
      </div>

      {error ? (
        <div className={styles["dashboard-error"]}>{error}</div>
      ) : null}

      <div className={styles["dashboard-stats"]}>
        <div className={styles["stat-card"]}>
          <h3>عدد الطلاب</h3>
          <p className={styles["stat-number"]}>{loading ? '...' : totalStudents}</p>
        </div>
        <div className={styles["stat-card"]}>
          <h3>عدد المقررات</h3>
          <p className={styles["stat-number"]}>{loading ? '...' : totalCourses}</p>
        </div>
        <div className={styles["stat-card"]}>
          <h3>عدد الدبلومات</h3>
          <p className={styles["stat-number"]}>{loading ? '...' : totalDiplomas}</p>
        </div>
        <div className={styles["stat-card"]}>
          <h3>عدد البلاد</h3>
          <p className={styles["stat-number"]}>{loading ? '...' : countriesCount}</p>
        </div>
      </div>

      {/* خريطة المستخدمين حول العالم داخل لوحة التحكم */}
      <div style={{ marginTop: 24 }}>
        <WorldUsersMap />
      </div>

      <div className={styles["quick-actions"]}>
        <h2>الإجراءات السريعة</h2>
        <div className={styles["actions-grid"]}>
          <a href="/admin/diplomas" className={styles["action-card"]}>
            <h3>إدارة الدبلومات</h3>
            <p>إضافة وتعديل الدبلومات</p>
          </a>
          <a href="/admin/students" className={styles["action-card"]}>
            <h3>إدارة الطلاب</h3>
            <p>عرض وإدارة الطلاب المسجلين</p>
          </a>
          {/* <a href="/admin/reports/financial" className="action-card">
            <h3>التقارير</h3>
            <p>عرض تقارير الأداء والإحصائيات</p>
          </a> */}
          <a href="/admin/profile-management" className={styles["action-card"]}>
            <h3>إدارة الملف الشخصي</h3>
            <p>إدارة معلومات المستخدم</p>
          </a>
        </div>
      </div>
    </>
  );
}