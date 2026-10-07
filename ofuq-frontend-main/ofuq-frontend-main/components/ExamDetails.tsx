'use client';

import React, { useEffect, useState } from 'react';
import '../styles/exam-details.css';
import { FinalExamMetaData, getCourseFinalExamMeta, getQuizAttempts, QuizAttempt } from '../utils/quizService';
import { requestCertificate, getCertificateStatus, getDownloadUrl } from '../utils/certificateService';
import { http } from '@/lib/http';

interface ExamDetailsProps {
  courseId: number;
  courseName: string;
  completionPercentage: number;
  onBack: () => void;
}

const ExamDetails: React.FC<ExamDetailsProps> = ({ courseId, courseName, completionPercentage, onBack }) => {
  const [meta, setMeta] = useState<FinalExamMetaData | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateStatus, setCertificateStatus] = useState<string | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [requestingCertificate, setRequestingCertificate] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequestCertificate = async () => {
    setRequestingCertificate(true);
    setRequestError(null);

    try {
      const response = await requestCertificate(courseId);
      if (response.certificate_status) {
        setCertificateStatus(response.certificate_status);
      } else {
        // إذا لم يُرجع الرد حالة، نفترض أنها pending
        setCertificateStatus('pending');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'حدث خطأ، يرجى المحاولة لاحقاً';
      setRequestError(errorMessage);
      console.error('Certificate request failed:', error);
    } finally {
      setRequestingCertificate(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const m = await getCourseFinalExamMeta(courseId);
        if (!cancelled) setMeta(m);
        if (m?.quiz_id) {
          const a = await getQuizAttempts(m.quiz_id);
          if (!cancelled) setAttempts(a);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'تعذر تحميل بيانات الاختبار النهائي');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [courseId]);

  // Fetch certificate status from "الدود" when component loads or attempts change
  useEffect(() => {
    let cancelled = false;

    async function fetchCertificateStatus() {
      if (!courseId) return;

      setLoadingCertificate(true);
      setCertificateStatus(null);

      try {
        const response = await getCertificateStatus(courseId);
        if (!cancelled && response?.status) {
          setCertificateStatus(response.status);
          if (response.status === 'completed') {
            const raw = response.file_url ?? response.file_path ?? '';
            let url = getDownloadUrl(raw);
            if (!url && raw) {
              const base = (http?.defaults?.baseURL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
              const path = raw.startsWith('/') ? raw : `/${raw}`;
              url = base ? `${base}${path}` : path;
            }
            setDownloadUrl(url || null);
          } else {
            setDownloadUrl(null);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          if (error?.response?.status === 404) {
            // Certificate doesn't exist yet - this is expected
            setCertificateStatus(null);
          } else {
            console.warn('Failed to fetch certificate status:', error);
            setCertificateStatus(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingCertificate(false);
      }
    }

    fetchCertificateStatus();
    return () => { cancelled = true; };
  }, [courseId]);

  // Polling effect - keep asking about certificate status when it's pending
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (certificateStatus === 'pending') {
      // Start polling every 5 seconds
      intervalId = setInterval(() => {
        getCertificateStatus(courseId)
          .then(data => {
            if (data?.status === 'completed' || data?.status === 'failed') {
              // Stop polling and update the UI
              if (intervalId) {
                clearInterval(intervalId);
              }
              setCertificateStatus(data.status);
              if (data?.status === 'completed') {
                const raw = data.file_url ?? data.file_path ?? '';
                let url = getDownloadUrl(raw);
                if (!url && raw) {
                  const base = (http?.defaults?.baseURL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
                  const path = raw.startsWith('/') ? raw : `/${raw}`;
                  url = base ? `${base}${path}` : path;
                }
                setDownloadUrl(url || null);
              } else {
                setDownloadUrl(null);
              }
            }
            // If still pending, continue polling
          })
          .catch(error => {
            console.warn('Polling error:', error);
            // Stop polling on error
            if (intervalId) {
              clearInterval(intervalId);
            }
          });
      }, 5000); // 5 seconds
    }

    // Cleanup function: stop polling when user leaves the page or status changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [certificateStatus, courseId]);

  return (
    <div className="exam-details-container">
      <button className="back-button" onClick={onBack}>
        ← العودة إلى الاختبارات
      </button>

      <div className="course-header">
        <h1 className="course-name">{courseName}</h1>
        <div className="completion-section">
          <div className="completion-bar">
            <div
              className="completion-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span className="completion-text">نسبة الإنجاز: {completionPercentage}%</span>
        </div>
      </div>

      {loading ? (
        <div className="table-wrapper"><p>جاري تحميل بيانات الاختبار النهائي...</p></div>
      ) : error ? (
        <div className="table-wrapper"><p>حدث خطأ: {error}</p></div>
      ) : (
        <>
          <div className="lessons-table-container">
            <h2 className="table-title">معلومات الاختبار النهائي</h2>
            <div className="table-wrapper">
              <table className="lessons-table">
                <tbody>
                  <tr>
                    <td>عدد الأسئلة المتاحة</td>
                    <td>{meta?.questions_pool_count ?? 0}</td>
                  </tr>
                  <tr>
                    <td>جاهزية بنك الأسئلة</td>
                    <td>
                      <span className={`status-badge ${meta?.has_sufficient_question_bank ? 'status-completed' : 'status-incomplete'}`}>
                        {meta?.has_sufficient_question_bank ? 'جاهز' : 'غير كافٍ'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>عدد المحاولات السابقة</td>
                    <td>{meta?.attempts_count ?? attempts.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="lessons-table-container">
            <h2 className="table-title">محاولاتك</h2>
            <div className="table-wrapper">
              <table className="lessons-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الدرجة</th>
                    <th>عدد الأسئلة</th>
                    <th>عدد الصحيحة</th>
                    <th>الحالة</th>
                    <th>المدة</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>لا توجد محاولات حتى الآن</td>
                    </tr>
                  ) : attempts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.created_at ? new Date(a.created_at).toLocaleString('ar-EG') : '-'}</td>
                      <td>{Math.round(a.score)}%</td>
                      <td>{a.total_questions ?? '-'}</td>
                      <td>{a.correct_answers ?? '-'}</td>
                      <td>
                        <span className={`status-badge ${a.passed ? 'status-completed' : 'status-incomplete'}`}>
                          {a.passed ? 'ناجح' : 'راسب'}
                        </span>
                      </td>
                      <td>{a.time_taken ? `${a.time_taken} ث` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Certificate Section */}
          {!loading && !error && attempts.length > 0 && (
            <div className="lessons-table-container">
              <h2 className="table-title">الشهادة</h2>
              <div className="table-wrapper">
                <div className="certificate-section">
                  {(() => {
                    const latestAttempt = attempts[0]; // Get the most recent attempt
                    const grade = latestAttempt?.score ?? 0;
                    const passed = latestAttempt?.passed ?? false;

                    if (grade < 50 || !passed) {
                      return (
                        <div className="certificate-not-eligible">
                          <p>يجب عليك اجتياز الاختبار النهائي للحصول على الشهادة.</p>
                        </div>
                      );
                    }

                    if (loadingCertificate) {
                      return (
                        <div className="certificate-loading">
                          <span className="spinner"></span>
                          <p>جاري التحقق من حالة الشهادة...</p>
                        </div>
                      );
                    }

                    if (certificateStatus === 'completed') {
                      return (
                        <div className="certificate-completed">
                          <p className="certificate-message">🎉 تهانينا! تم إصدار شهادتك بنجاح.</p>
                          {downloadUrl ? (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="certificate-download-btn"
                            >
                              تحميل الشهادة
                            </a>
                          ) : (
                            <p className="certificate-instructions">جارٍ تجهيز رابط التحميل...</p>
                          )}
                        </div>
                      );
                    }

                    if (certificateStatus === 'pending') {
                      return (
                        <div className="certificate-pending">
                          <p className="certificate-message">⏳ جاري إنشاء شهادتك... سيتم إشعارك عند اكتمالها.</p>
                          <p className="certificate-instructions">يتم التحقق من الحالة كل بضع ثوانٍ...</p>
                        </div>
                      );
                    }

                    if (certificateStatus === 'failed') {
                      return (
                        <div className="certificate-failed">
                          <p className="certificate-message error-message">❌ حدث خطأ أثناء إنشاء الشهادة.</p>
                          <p className="certificate-instructions">يرجى المحاولة مرة أخرى، أو التواصل مع الدعم الفني إذا استمرت المشكلة.</p>
                          <button
                            className="request-certificate-btn retry-btn"
                            onClick={handleRequestCertificate}
                            disabled={requestingCertificate}
                          >
                            {requestingCertificate ? (
                              <>
                                <span className="spinner"></span>
                                جاري إعادة المحاولة...
                              </>
                            ) : (
                              'إعادة المحاولة'
                            )}
                          </button>
                          {requestError && (
                            <p className="certificate-error">{requestError}</p>
                          )}
                        </div>
                      );
                    }

                    if (certificateStatus === null) {
                      return (
                        <div className="certificate-request">
                          <p className="certificate-message">✅ مبروك! لقد اجتزت الاختبار بنجاح.</p>
                          <p className="certificate-instructions">يمكنك الآن طلب شهادتك الرسمية.</p>
                          <button
                            className="request-certificate-btn"
                            onClick={handleRequestCertificate}
                            disabled={requestingCertificate}
                          >
                            {requestingCertificate ? (
                              <>
                                <span className="spinner"></span>
                                جاري الطلب...
                              </>
                            ) : (
                              'طلب الشهادة'
                            )}
                          </button>
                          {requestError && (
                            <p className="certificate-error">{requestError}</p>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamDetails;