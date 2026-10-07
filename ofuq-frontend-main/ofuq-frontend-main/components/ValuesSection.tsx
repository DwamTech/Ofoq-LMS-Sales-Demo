'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ValuesSection.module.css';

const ValuesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedPercentages, setAnimatedPercentages] = useState({
    success: 0,
    happy: 0,
    community: 0
  });
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateProgressBars();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isVisible]);

  const animateProgressBars = () => {
    const targetPercentages = { success: 90, happy: 75, community: 63 };
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 steps for smooth animation
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedPercentages({
        success: Math.round(targetPercentages.success * progress),
        happy: Math.round(targetPercentages.happy * progress),
        community: Math.round(targetPercentages.community * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  };

  return (
    <section className={styles['values-section']} ref={sectionRef}>
      <div className={styles['values-container']}>
        {/* Left Section */}
        <div className={styles['values-left']}>
          <p className={styles['values-subtitle']}>قيم حالتنا</p>
          <h2 className={styles['values-title']}>برامجنا التدريبية مختلفة جدا عن جميع البرامج الاخرى</h2>
          <p className={styles['values-description']}>
            يعتبر من أهم البرامج التدريبية في مصر، حيث يقدم دورات تدريبية متقدمة في مختلف المجالات مثل التكنولوجيا، الأعمال، والتربية.
          </p>
          
          {/* Statistics */}
          <div className={styles['statistics']} style={{alignItems: 'start'}}>
            <div className={styles['stat-item']} >
              <div className={styles['stat-label']}>جودة التعليم</div>
              <div className={styles['stat-percentage']}>{animatedPercentages.success}%</div>
              <div className={styles['progress-bar']}>
                <div 
                  className={styles['progress-fill']} 
                  style={{
                    width: `${animatedPercentages.success}%`,
                    transition: isVisible ? 'width 0.1s ease-out' : 'none'
                  }}
                ></div>
              </div>
            </div>
            
            <div className={styles['stat-item']}>
              <div className={styles['stat-label']}>رضا الطلاب<div className={styles['stat-percentage']}>{animatedPercentages.happy}%</div></div>
              
              <div className={styles['progress-bar']}>
                <div 
                  className={styles['progress-fill']} 
                  style={{
                    width: `${animatedPercentages.happy}%`,
                    transition: isVisible ? 'width 0.1s ease-out' : 'none'
                  }}
                ></div>
              </div>
            </div>
            
            <div className={styles['stat-item']}>
              <div className={styles['stat-label']}>معدل إتمام الدورات<div className={styles['stat-percentage']}>{animatedPercentages.community}%</div></div>
              
              <div className={styles['progress-bar']}>
                <div 
                  className={styles['progress-fill']} 
                  style={{
                    width: `${animatedPercentages.community}%`,
                    transition: isVisible ? 'width 0.1s ease-out' : 'none'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className={styles['values-right']}>
          <div className={styles['image-container']}>
            <img 
              src="/front-view-stacked-books-graduation-cap-ladders-education-day 1.jpg" 
              alt="Education Books and Graduation Cap" 
              className={styles['values-image']}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;