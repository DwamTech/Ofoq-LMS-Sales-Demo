'use client'
import { useEffect, useRef, useState } from 'react'
import { Award, GraduationCap, Maximize2, X } from 'lucide-react'
import { brand } from '@/lib/brand'
import { BrandLogo } from './BrandLogo'
import styles from './CertificatePreview.module.css'

export function CertificatePreview({ studentName, courseTitle, grade, date, serial, preview = false }: { studentName: string; courseTitle: string; grade: string; date: string; serial: string; preview?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [scale, setScale] = useState(1)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 720)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [expanded])
  const formattedDate = date ? new Date(date).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' }) : '—'
  const certificate = (fullSize = false) => <div className={styles.certificate} style={!fullSize && scale < 1 ? { width:720, zoom:scale } : undefined} aria-label={preview ? 'تصميم شهادة تجريبية' : 'معاينة بيانات الشهادة'}>
    <div className={styles.band} aria-hidden="true"><GraduationCap size={28}/><span/><i/></div>
    <div className={styles.body}>
      <div className={styles.top}><BrandLogo variant="primary" theme="light"/><span>{preview ? 'نسخة تجريبية' : 'شهادة إتمام'}</span></div>
      <div className={styles.heading}><span>رحلة تعلّم. إنجاز يستحق التقدير.</span><h4>شهادة إتمام</h4><i/></div>
      <p className={styles.presented}>تشهد {brand.name} بأن</p>
      <strong className={styles.name}>{studentName}</strong>
      <p className={styles.completed}>قد أتمّ متطلبات المقرر التعليمي</p>
      <h5 className={styles.course}>{courseTitle}</h5>
      <div className={styles.grade}>النتيجة <strong dir="ltr">{grade}</strong></div>
      <div className={styles.bottom}>
        <div className={styles.reference}><span>مرجع الشهادة</span><strong dir="ltr">{serial}</strong><small>{formattedDate}</small></div>
        <div className={styles.seal} aria-hidden="true"><Award size={34}/></div>
        <div className={styles.issuer}><span>{brand.name}</span><i/><small>{preview ? 'معاينة التصميم' : 'التجربة التعليمية'}</small></div>
      </div>
    </div>
  </div>
  return <div>
    <div ref={viewport} className={styles.viewport} role="region" aria-label="معاينة الشهادة الأفقية">{certificate()}</div>
    <button type="button" className={styles.expand} onClick={() => { dialog.current?.showModal(); setExpanded(true) }}><Maximize2 size={18}/>تكبير الشهادة</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="certificate-viewer-title" onClose={() => setExpanded(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className={styles.dialogHeader}><h3 id="certificate-viewer-title">معاينة الشهادة</h3><button type="button" autoFocus aria-label="إغلاق معاينة الشهادة" onClick={() => dialog.current?.close()}><X size={22}/></button></div>
      <p className={styles.hint}>مرّري الشهادة جانبيًا لقراءة التفاصيل، أو استخدمي العرض الأفقي للموبايل.</p>
      <div className={styles.largeViewport} tabIndex={0} role="region" aria-label="الشهادة بحجم مكبّر">{certificate(true)}</div>
    </dialog>
  </div>
}
