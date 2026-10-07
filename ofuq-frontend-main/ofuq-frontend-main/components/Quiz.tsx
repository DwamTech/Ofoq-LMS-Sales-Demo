'use client';

import React, { useEffect, useMemo, useState } from 'react';
import '../styles/quiz.css';
import { isDemoMode } from '@/utils/demoMode';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number | number[] | null;
}

interface QuizProps {
  questions?: QuizQuestion[];
  requireAllAnswered?: boolean;
  onComplete?: (selectedAnswers: { [key: number]: number }) => void;
  initialAnswers?: { [key: number]: number };
  canGoNext?: boolean;
  onGoNext?: () => void;
  onClose?: () => void;
}

const Quiz: React.FC<QuizProps> = ({ questions = defaultQuestions, requireAllAnswered = true, onComplete, initialAnswers, canGoNext = false, onGoNext, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isFinished, setIsFinished] = useState(false);

  // Compute safe current question with bounds
  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  const safeIndex = Math.min(Math.max(currentQuestionIndex, 0), Math.max(totalQuestions - 1, 0));
  const currentQuestion = totalQuestions > 0 ? questions[safeIndex] : undefined;
  const isLastQuestion = totalQuestions > 0 ? safeIndex === totalQuestions - 1 : false;
  const isFirstQuestion = safeIndex === 0;

  const allAnswered = useMemo(() => {
    if (!questions || questions.length === 0) return true;
    return questions.every((_, idx) => selectedAnswers[idx] !== undefined);
  }, [questions, selectedAnswers]);

  // Guard: no questions or out-of-range index
  if (!questions || questions.length === 0 || !currentQuestion) {
    return (
      <div className="quiz-container">
        <div className="question-box">
          <h2 style={{ textAlign: 'center', color: '#019EBB' }}>
            جاري تحميل أسئلة الكويز...
          </h2>
          <p style={{ textAlign: 'center', fontSize: '16px', marginTop: '12px' }}>
            برجاء الانتظار حتى يتم تجهيز الأسئلة.
          </p>
        </div>
      </div>
    );
  }

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [safeIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (safeIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (safeIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (isDemoMode) return;
    if (requireAllAnswered && !allAnswered) {
      return;
    }
    setIsFinished(true);
    if (onComplete) {
      onComplete(selectedAnswers);
    }
  };

  // تهيئة الإجابات من الحالة الأولية (للاستعادة بعد الريفريش)
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setSelectedAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  if (isFinished) {
    return (
      <div className="quiz-container">
        <div className="question-box" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#019EBB' }}>تم تأكيد الإجابات</h2>
          <p style={{ fontSize: '18px', marginTop: '12px' }}>
            يمكنك المتابعة عند نجاح التقييم.
          </p>
          {canGoNext && (
            <button className="finish-button" onClick={onGoNext} style={{ marginTop: 16 }}>
              الانتقال للدرس التالي
              <div className="finish-arrow">←</div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        السؤال {safeIndex + 1} من {totalQuestions}
      </div>

      <div className="question-box">
        <div className="question-number">
          السؤال {safeIndex + 1}
        </div>
        <div className="question-text">
          {currentQuestion.question}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          className="nav-button" 
          onClick={handlePrevious}
          disabled={isFirstQuestion}
        >
          السابق
        </button>
        <button 
          className="nav-button" 
          onClick={handleNext}
          disabled={isLastQuestion}
        >
          التالي
        </button>
      </div>

      <div className="options-container">
        {currentQuestion.options.map((option, index) => (
          <div
            key={index}
            className={`option-item ${selectedAnswers[safeIndex] === index ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(index)}
          >
            <input
              type="radio"
              name={`question-${safeIndex}`}
              value={index}
              checked={selectedAnswers[safeIndex] === index}
              onChange={() => handleOptionSelect(index)}
              className="option-radio"
            />
            {option}
          </div>
        ))}
      </div>

      {(requireAllAnswered ? allAnswered : true) && (
        <button className="finish-button" onClick={handleFinish} disabled={isDemoMode || (requireAllAnswered && !allAnswered)} title={isDemoMode ? 'الإرسال غير متاح في النسخة التجريبية' : undefined}>
          تأكيد
          <div className="finish-arrow">
            ←
          </div>
        </button>
      )}

      {canGoNext && (
        <button className="finish-button" onClick={onGoNext} style={{ marginTop: 12 }}>
          الانتقال للدرس التالي
          <div className="finish-arrow">←</div>
        </button>
      )}
        {requireAllAnswered && !allAnswered && (
          <p style={{ marginTop: 10, color: '#d35400', fontWeight: 600, textAlign: 'center' }}>
            يجب الإجابة على جميع الأسئلة قبل الإنهاء.
          </p>
        )}
    </div>
  );
};

// Default sample questions for testing
const defaultQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "ما هي عاصمة مصر؟",
    options: ["الإسكندرية", "القاهرة", "الجيزة", "أسوان"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "كم عدد أيام السنة الميلادية؟",
    options: ["364 يوم", "365 يوم", "366 يوم", "367 يوم"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "ما هو أكبر محيط في العالم؟",
    options: ["المحيط الأطلسي", "المحيط الهندي", "المحيط الهادئ", "المحيط المتجمد الشمالي"],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "من هو مؤلف رواية 'مئة عام من العزلة'؟",
    options: ["غابرييل غارسيا ماركيز", "خورخي لويس بورخيس", "ماريو فارغاس يوسا", "إيزابيل الليندي"],
    correctAnswer: 0
  },
  {
    id: 5,
    question: "ما هو العنصر الكيميائي الذي رمزه Au؟",
    options: ["الفضة", "الذهب", "النحاس", "البلاتين"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "في أي قارة تقع دولة البرازيل؟",
    options: ["أمريكا الشمالية", "أمريكا الجنوبية", "أفريقيا", "آسيا"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "ما هو أطول نهر في العالم؟",
    options: ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"],
    correctAnswer: 0
  },
  {
    id: 8,
    question: "كم عدد عظام جسم الإنسان البالغ؟",
    options: ["206 عظمة", "208 عظمة", "210 عظمة", "212 عظمة"],
    correctAnswer: 0
  },
  {
    id: 9,
    question: "ما هي أصغر دولة في العالم؟",
    options: ["موناكو", "سان مارينو", "الفاتيكان", "ليختنشتاين"],
    correctAnswer: 2
  },
  {
    id: 10,
    question: "من اخترع المصباح الكهربائي؟",
    options: ["نيكولا تيسلا", "توماس إديسون", "ألكسندر غراهام بيل", "بنجامين فرانكلين"],
    correctAnswer: 1
  }
];

export default Quiz;
