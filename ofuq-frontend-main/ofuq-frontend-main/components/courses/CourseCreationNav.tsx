import React from 'react';
import { Course, CourseCreationStep } from '@/types/course';

interface CourseCreationNavProps {
  currentStep: CourseCreationStep;
  currentCourse: Course | null;
  resetCourseCreation: () => void;
  steps: { id: string; title: string; description: string; }[];
  setCurrentStep: (step: CourseCreationStep) => void;
}

const CourseCreationNav: React.FC<CourseCreationNavProps> = ({ 
  currentStep, 
  currentCourse, 
  resetCourseCreation, 
  steps, 
  setCurrentStep 
}) => {
  
  const handleStepClick = (stepId: string) => {
    // التحقق من إمكانية الانتقال للخطوة
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const targetStepIndex = steps.findIndex(s => s.id === stepId);
    
    // يمكن الانتقال للخطوة الأولى دائماً
    if (stepId === 'basic-info') {
      setCurrentStep(stepId as CourseCreationStep);
      return;
    }
    
    // للخطوات الأخرى، يجب أن يكون هناك كورس موجود
    if (currentCourse && (stepId === 'content-management' || stepId === 'review')) {
      setCurrentStep(stepId as CourseCreationStep);
    }
  };

  const isStepClickable = (stepId: string) => {
    if (stepId === 'basic-info') return true;
    if (stepId === 'content-management' || stepId === 'review') {
      return currentCourse !== null;
    }
    return false;
  };

  return (
    <div className="course-creation-nav">
      <div className="nav-header">
        <h2 className="nav-title">
          {currentCourse ? `تحرير: ${currentCourse.title}` : 'إنشاء كورس جديد'}
        </h2>
        <button onClick={resetCourseCreation} className="nav-close-btn">
          ✕
        </button>
      </div>
      <div className="nav-steps">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isClickable = isStepClickable(step.id);
          
          return (
            <div 
              key={step.id} 
              className={`nav-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : 'disabled'}`}
              onClick={() => isClickable && handleStepClick(step.id)}
              style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
            >
              <div className="step-indicator">
                <span className="step-number">{index + 1}</span>
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCreationNav;