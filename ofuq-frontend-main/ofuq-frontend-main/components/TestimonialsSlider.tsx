'use client';

import React, { useState } from 'react';
import styles from './TestimonialsSlider.module.css';
import clsx from 'clsx';

interface Testimonial {
  id: number;
  text: string;
  name: string;
  title: string;
  avatar: string;
}

const TestimonialsSlider: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      text: "أوصي في شخص يتطلع للتعلم الحديث أن يتردد على ذلك.",
      name: "ساجد مصطفى",
      title: "مدير المساعدات",
      avatar: "/profile.jpg"
    },
    {
      id: 2,
      text: "خلت هذه الدورة تجربة رائعة للغاية الحصول بودجة الدورة حيث خلت هذه الدورة تجربة رائعة للغاية الحصول بودجة الدورة حيث كمتدرب متطلع لم يتردد ذلك أن يتردد على ذلك.",
      name: "أوتيس محمد",
      title: "الطبيب الحديث",
      avatar: "/profile.jpg"
    },
    {
      id: 3,
      text: "تطبيقات تقنية لحل مشاكل الأعمال، مناهج الرقمة",
      name: "رانيا أحمد",
      title: "مطورة برمجيات",
      avatar: "/profile.jpg"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className={styles['testimonials-section']}>
      <div className={styles['testimonials-container']}>
        <div className={styles['testimonials-header']}>
          <h2 className={styles['testimonials-title']}>آراء طلابنا</h2>
          <p className={styles['testimonials-subtitle']}>ماذا يقول طلابنا عن تجربتهم معنا</p>
        </div>

        <div className={styles['testimonials-slider']}>
          <button className={clsx(styles['slider-nav'], styles['prev'])} onClick={prevSlide}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className={styles['testimonials-track']} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className={styles['testimonial-card']}>
                <div className={styles['testimonial-content']}>
                  <p className={styles['testimonial-text']}>{testimonial.text}</p>
                  <div className={styles['testimonial-author']}>
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className={styles['author-avatar']}
                    />
                    <div className={styles['author-info']}>
                      <h4 className={styles['author-name']}>{testimonial.name}</h4>
                      <p className={styles['author-title']}>{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className={clsx(styles['slider-nav'], styles['next'])} onClick={nextSlide}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className={styles['testimonials-dots']}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={clsx(styles['dot'], index === currentIndex && styles['active'])}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSlider;