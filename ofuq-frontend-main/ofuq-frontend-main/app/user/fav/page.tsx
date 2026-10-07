"use client";

import React, { useEffect, useState } from "react";
import DiplomaStyleCard from "../../../components/DiplomaStyleCard";
import CourseGrid from "../../../components/CourseGrid";
import type { Course as GridCourse } from "../../../components/CourseGrid";

import "../../../styles/course-cards.css";
import styles from "./Fav.module.css";
import { getMyFavoriteCourses, getMyEnrollments, getCourseProgress, Course, removeCourseFromFavorites } from "../../../utils/courseService";
import { getBackendAssetUrl } from "../../../utils/url";

type CardItem = {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: number;
  studentsCount: number;
  duration: string;
  lessonsCount: number;
  instructorName: string;
  instructorAvatar: string;
  price: number;
};

// إزالة البيانات الوهمية واستبدالها بتحميل ديناميكي من الـ API

export default function FavPage() {
  const [purchased, setPurchased] = useState<GridCourse[]>([]);
  const [unpurchased, setUnpurchased] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnpurchasedModalOpen, setIsUnpurchasedModalOpen] = useState(false);

  // تحميل بيانات المفضلة والاشتراكات
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [favorites, enrollmentsResponse] = await Promise.all([
          getMyFavoriteCourses(),
          getMyEnrollments(),
        ]);
        const enrollments = enrollmentsResponse.data;

        const isPurchasedId = new Set(enrollments.map((id) => Number(id.id)));
        const favPurchased = favorites.filter((c) => isPurchasedId.has(Number(c.id)));
        const favUnpurchased = favorites.filter((c) => !isPurchasedId.has(Number(c.id)));

        // جهّز عناصر القسم المشتراة مع التقدم
        const progresses = await Promise.all(
          favPurchased.map((c) => getCourseProgress(c.id).catch(() => 0))
        );
        const purchasedItems: GridCourse[] = favPurchased.map((c, idx) => ({
          id: Number(c.id),
          name: c.title,
          progress: Math.max(0, Math.min(100, Number(progresses[idx] ?? 0))),
          image: getBackendAssetUrl(
            (c as any).cover_image_url || c.cover_image || "/hero-image.png"
          ),
          category: c.category?.name || "",
          has_final_exam: c.has_final_exam, // إضافة مؤشر الاختبار النهائي
          instructor: {
            name: c.instructor?.name || "مدرب",
            avatar: getBackendAssetUrl(
              (c.instructor as any)?.image || "/profile.jpg"
            ),
          },
        }));

        // جهّز عناصر القسم غير المشتراة لبطاقة CourseCard
        const unpurchasedItems: CardItem[] = favUnpurchased.map((c) => ({
          id: String(c.id),
          title: c.title,
          image: getBackendAssetUrl(
            (c as any).cover_image_url || c.cover_image || "/hero-image.png"
          ),
          category: c.category?.name || "عام",
          rating: Number(c.instructor?.rating ?? 4.5),
          studentsCount: Number((c as any).students_count ?? (c as any).enrollments_count ?? 150),
          duration: (c as any).duration || `${Math.floor(Math.random() * 10) + 5} ساعات`,
          lessonsCount: Number((c as any).lessons_count ?? (c as any).videos_count ?? Math.floor(Math.random() * 20) + 10),
          instructorName: c.instructor?.name || "مدرب",
          instructorAvatar: getBackendAssetUrl(
            (c.instructor as any)?.image || "/profile.jpg"
          ),
          price: Number(c.price ?? 0),
        }));

        setPurchased(purchasedItems);
        setUnpurchased(unpurchasedItems);
        setError(null);
      } catch (e: any) {
        console.error("Error loading favorites page:", e);
        setError(e?.message ?? "فشل في تحميل المفضلة");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const removePurchased = async (id: number) => {
    try {
      await removeCourseFromFavorites(id);
    } catch { }
    setPurchased((prev) => prev.filter((c) => c.id !== id));
  };

  const removeUnpurchased = async (id: string) => {
    try {
      await removeCourseFromFavorites(Number(id));
    } catch { }
    setUnpurchased((prev) => prev.filter((c) => c.id !== id));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openUnpurchasedModal = () => setIsUnpurchasedModalOpen(true);
  const closeUnpurchasedModal = () => setIsUnpurchasedModalOpen(false);

  return (
    <section className={`fav-section ${styles.favPage}`}>
      <div className="fav-header">
        <h1 className="fav-title">المفضلة</h1>
      </div>

      {loading && (
        <div className="fav-empty">جاري تحميل بيانات المفضلة...</div>
      )}
      {error && !loading && (
        <div className="fav-empty" style={{ color: '#e74c3c' }}>{error}</div>
      )}

      {/* Top Purchased: grid of 3 cards + More button */}
      <div className="fav-top">
        <div className="fav-top-actions">
          <h2 className="fav-section-title">الدورات المشتراة</h2>
          <button className="fav-more-btn" onClick={openModal} aria-label="عرض المزيد">عرض المزيد</button>
        </div>
        {!loading && purchased.length === 0 ? (
          <div className="fav-empty">لا توجد دورات مشتراة حالياً.</div>
        ) : (
          <div className="fav-top-grid">
            {purchased.slice(0, 3).map((course) => (
              <div key={course.id} className="fav-item-wrapper grid-item">
                <button
                  className="fav-remove-btn"
                  aria-label="إزالة من المفضلة"
                  onClick={() => removePurchased(course.id)}
                  title="إزالة من المفضلة"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                <CourseGrid courses={[course]} showAll={true} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup Modal: 9 purchased courses */}
      {isModalOpen && (
        <div className="fav-modal-overlay" role="dialog" aria-modal="true" aria-label="الدورات المشتراة">
          <div className="fav-modal">
            <div className="fav-modal-header">
              <h3 className="fav-modal-title">الدورات المشتراة</h3>
              <button className="fav-close-btn" onClick={closeModal} aria-label="إغلاق">×</button>
            </div>
            <div className="fav-modal-grid">
              {purchased.slice(0, 9).map((course) => (
                <div key={course.id} className="fav-item-wrapper grid-item">
                  <button
                    className="fav-remove-btn"
                    aria-label="إزالة من المفضلة"
                    onClick={() => removePurchased(course.id)}
                    title="إزالة من المفضلة"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <CourseGrid courses={[course]} showAll={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Grid: unpurchased courses with price/enroll */}
      <div className="fav-bottom">
        <div className="fav-top-actions">
          <h2 className="fav-section-title">الدورات غير المشتراة</h2>
          <button className="fav-more-btn" onClick={openUnpurchasedModal} aria-label="عرض المزيد">عرض المزيد</button>
        </div>
        {!loading && unpurchased.length === 0 ? (
          <div className="fav-empty">لا توجد دورات غير مشتراة حالياً.</div>
        ) : (
          <div className="fav-top-grid">
            {unpurchased.slice(0, 3).map((card) => (
              <div key={card.id} className="fav-item-wrapper card-item">
                <button
                  className="fav-remove-btn"
                  aria-label="إزالة من المفضلة"
                  onClick={() => removeUnpurchased(card.id)}
                  title="إزالة من المفضلة"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                <DiplomaStyleCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  image={card.image}
                  description={""}
                  category={card.category}
                  instructorName={card.instructorName}
                  instructorAvatar={card.instructorAvatar}
                  price={card.price}
                  priceText={card.price > 0 ? `${card.price} ريال` : "مجاني"}
                  linkPath={`/course-details/${card.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup Modal for Unpurchased Courses */}
      {isUnpurchasedModalOpen && (
        <div className="fav-modal-overlay" role="dialog" aria-modal="true" aria-label="الدورات غير المشتراة">
          <div className="fav-modal">
            <div className="fav-modal-header">
              <h3 className="fav-modal-title">الدورات غير المشتراة</h3>
              <button className="fav-close-btn" onClick={closeUnpurchasedModal} aria-label="إغلاق">×</button>
            </div>
            <div className="fav-modal-grid">
              {unpurchased.map((card) => (
                <div key={card.id} className="fav-item-wrapper card-item">
                  <button
                    className="fav-remove-btn"
                    aria-label="إزالة من المفضلة"
                    onClick={() => removeUnpurchased(card.id)}
                    title="إزالة من المفضلة"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <DiplomaStyleCard
                    id={card.id}
                    title={card.title}
                    image={card.image}
                    description={""}
                    category={card.category}
                    instructorName={card.instructorName}
                    instructorAvatar={card.instructorAvatar}
                    price={card.price}
                    priceText={card.price > 0 ? `${card.price} ريال` : "مجاني"}
                    linkPath={`/course-details/${card.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}