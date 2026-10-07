"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./MyDiplomas.module.css";
import { getMyDiplomas, type MyDiploma } from "@/utils/categoryService";
import { getBackendAssetUrl } from "@/utils/url";
import { getDownloadUrl } from "@/utils/certificateService";

export default function MyDiplomasPage() {
  const [diplomas, setDiplomas] = useState<MyDiploma[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyDiplomas();
        if (mounted) setDiplomas(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || "حدث خطأ غير متوقع");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>دبلوماتي</h1>

      {loading && <div className={styles.loading}>جاري تحميل الدبلومات...</div>}
      {error && (
        <div className={styles.error}>فشل في جلب دبلوماتك: {error}</div>
      )}

      {!loading && !error && diplomas.length === 0 && (
        <div className={styles.empty}>لم تقم بالتسجيل في أي دبلومات بعد</div>
      )}

      {!loading && !error && diplomas.length > 0 && (
        <div className={styles.grid}>
          {diplomas.map((item) => {
            const coverUrl = getBackendAssetUrl(
              item.category?.cover_image_url
            );
            const slug = item.category?.slug || String(item.category?.id || "");
            const statusLabel =
              item.status === "active"
                ? "فعال"
                : item.status === "pending_payment"
                ? "بانتظار الدفع"
                : item.status;
            const badgeClass =
              item.status === "active"
                ? styles.badgeActive
                : item.status === "pending_payment"
                ? styles.badgePending
                : styles.badgeDefault;
            return (
              <div key={`my-diploma-${slug}`} className={styles.card}>
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt={item.category?.name || "دبلومة"}
                    className={styles.image}
                  />
                )}
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      {item.category?.name || "اسم الدبلومة"}
                    </h2>
                    <span className={`${styles.badge} ${badgeClass}`}>{statusLabel}</span>
                  </div>
                  {/* Progress Bar */}
                  {(() => {
                    const p = Math.max(0, Math.min(100, Math.round(item.progress || 0)));
                    return (
                      <div className={styles.progress}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} style={{ width: `${p}%` }} />
                        </div>
                        <div className={styles.progressInfo}>
                          {p === 100 ? (
                            <span className={styles.completedBadge}>مكتمل</span>
                          ) : (
                            <span className={styles.progressLabel}>{p}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className={styles.cardActions}>
                    <Link href={`/diplomas/${slug}`} className={styles.btn}>
                      بدء التعلم
                    </Link>
                    {item.can_download_certificate && item.certificate?.file_url && (
                      <button
                        className={styles.btn}
                        onClick={() => {
                          const url = getDownloadUrl(item.certificate!.file_url!);
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        تحميل الشهادة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}