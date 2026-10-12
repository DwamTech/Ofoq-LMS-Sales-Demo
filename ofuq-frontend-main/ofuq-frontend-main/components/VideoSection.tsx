"use client";

import React, { useEffect, useRef } from "react";
import styles from "./VideoSection.module.css";

interface HlsPlayer {
  loadSource(url: string): void;
  attachMedia(video: HTMLVideoElement): void;
  on(
    event: string,
    callback: (event: unknown, data: { fatal?: boolean }) => void,
  ): void;
  recoverMediaError(): void;
  destroy(): void;
}
interface HlsConstructor {
  new (config: { maxBufferLength: number }): HlsPlayer;
  isSupported(): boolean;
  Events: { ERROR: string };
}

interface VideoSectionProps {
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
  alt?: string;
  useIframe?: boolean;
  isLocked?: boolean;
  lockMessage?: string;
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPlay?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPause?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeked?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: () => void | Promise<void>;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  videoUrl,
  title,
  thumbnailUrl,
  alt,
  useIframe,
  isLocked,
  lockMessage,
  onLoadedMetadata,
  onPlay,
  onPause,
  onSeeked,
  onTimeUpdate,
  onEnded,
}) => {
  const isEmbed =
    typeof useIframe === "boolean"
      ? useIframe
      : /(?:iframe|player)\.mediadelivery\.net|youtube\.com|youtu\.be|vimeo\.com/.test(
          videoUrl,
        );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHls = /\.m3u8(\?.*)?$/.test(videoUrl || "");

  // منع التحميل وأوامر المطور من الواجهة الأمامية فقط
  useEffect(() => {
    if (isEmbed) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        (e.ctrlKey && key === "s") ||
        (e.ctrlKey && key === "u") ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (key === "i" || key === "c" || key === "j"))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: Event) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, [isEmbed]);

  // تحميل وتشغيل HLS عبر hls.js عند الحاجة (سفاري يستخدم HLS الأصلي)
  useEffect(() => {
    if (!videoRef.current || !isHls) return;
    const video = videoRef.current;

    // إذا كان المتصفح يدعم HLS أصلياً (سفاري)
    if (
      video &&
      typeof video.canPlayType === "function" &&
      video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      try {
        // تعيين المصدر مباشرة
        (video as HTMLVideoElement).src = videoUrl;
      } catch {
        // تجاهل أي أخطاء بسيطة
      }
      return;
    }

    let hls: HlsPlayer | null = null;
    const playerWindow = window as Window & { Hls?: HlsConstructor };
    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
          "script[data-hlsjs]",
        ) as HTMLScriptElement | null;
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        script.async = true;
        script.setAttribute("data-hlsjs", "true");
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load hls.js"));
        document.head.appendChild(script);
      });

    const setupHls = async () => {
      try {
        if (!playerWindow.Hls) {
          await loadScript();
        }
        const HlsCtor = playerWindow.Hls;
        if (HlsCtor && HlsCtor.isSupported()) {
          hls = new HlsCtor({
            // يمكن ضبط إعدادات HLS هنا
            maxBufferLength: 30,
          });
          hls.loadSource(videoUrl);
          hls.attachMedia(video);
          hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
            if (data?.fatal && typeof hls?.recoverMediaError === "function") {
              try {
                hls.recoverMediaError();
              } catch {
                /* ignore */
              }
            }
          });
        }
      } catch (err) {
        // إذا فشل hls.js، لا نكسر التشغيل كلياً
        console.warn("HLS setup failed:", err);
      }
    };

    setupHls();
    return () => {
      try {
        hls?.destroy?.();
      } catch {
        /* ignore */
      }
    };
  }, [videoUrl, isHls]);

  return (
    <section className={styles.videoSection}>
      <div className={styles.container}>
        {/* {title ? <h2 className={styles.title}>{title}</h2> : null} */}
        <div className={styles.videoWrapper}>
          {isEmbed ? (
            <iframe
              src={videoUrl}
              loading="lazy"
              className={styles.iframe}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
              referrerPolicy="no-referrer"
              title={alt || title || "Video Player"}
            />
          ) : (
            <video
              className={styles.video}
              controls={!isLocked}
              playsInline
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              preload="metadata"
              onContextMenu={(e) => e.preventDefault()}
              crossOrigin="anonymous"
              poster={thumbnailUrl}
              aria-label={alt || title || "Course video"}
              onLoadedMetadata={onLoadedMetadata}
              onPlay={onPlay}
              onPause={onPause}
              onSeeked={onSeeked}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
              ref={videoRef}
            >
              {isHls ? null : <source src={videoUrl} />}
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          )}
          {isLocked ? (
            <div className={styles.lockOverlay}>
              <div className={styles.lockContent}>
                <svg
                  className={styles.lockIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-8 0V9a3 3 0 0 1 6 0v2H10z" />
                </svg>
                <p className={styles.lockMessage}>
                  {lockMessage || "الفيديو مقفول حتى إتمام الشروط المطلوبة"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
