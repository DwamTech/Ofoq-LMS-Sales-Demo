'use client';

import React, { useState } from 'react';
import '../styles/quiz.css';

interface SimulationQuestion {
  id: number;
  question: string;
  options: string[];
}

interface SimulationQuizProps {
  questions?: SimulationQuestion[];
  onFinish?: () => void;
  onClose?: () => void;
  onComplete?: (score: any) => void;
  isLastLesson?: boolean;
}

const SimulationQuiz: React.FC<SimulationQuizProps> = ({ 
  questions = defaultSimulationQuestions, 
  onFinish,
  onClose,
  onComplete,
  isLastLesson = false 
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (onFinish) {
      onFinish();
    }
  };

  // التحقق من إجابة جميع الأسئلة
  const allQuestionsAnswered = questions.every((_, index) => 
    selectedAnswers[index] !== undefined
  );

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        السؤال {currentQuestionIndex + 1} من {questions.length}
      </div>

      <div className="question-box">
        <div className="question-number">
          السؤال {currentQuestionIndex + 1}
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
            className={`option-item ${selectedAnswers[currentQuestionIndex] === index ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(index)}
          >
            <input
              type="radio"
              name={`question-${currentQuestionIndex}`}
              value={index}
              checked={selectedAnswers[currentQuestionIndex] === index}
              onChange={() => handleOptionSelect(index)}
              className="option-radio"
            />
            {option}
          </div>
        ))}
      </div>

      {isLastQuestion && (
        <button 
          className="finish-button" 
          onClick={handleFinish}
          disabled={!allQuestionsAnswered}
          style={{
            background: allQuestionsAnswered 
              ? (isLastLesson ? '#e74c3c' : '#019EBB')
              : '#ccc',
            color: '#fff',
            cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed'
          }}
        >
          {isLastLesson ? 'الامتحان النهائي' : 'الدرس التالي'}
          <div className="finish-arrow">
            ←
          </div>
        </button>
      )}
    </div>
  );
};

// أسئلة وهمية للمحاكاة
const defaultSimulationQuestions: SimulationQuestion[] = [
  {
    id: 1,
    question: "ما هو الهدف الأساسي من دراسة العلوم الشرعية في منصة أفق؟",
    options: [
      "فهم النصوص الشرعية وتطبيقها في الحياة العملية",
      "حفظ النصوص فقط دون فهم",
      "دراسة التاريخ الإسلامي",
      "تعلم اللغة العربية"
    ]
  },
  {
    id: 2,
    question: "أي من التالي يُعتبر من أهم مبادئ التربية الحديثة التي يركز عليها منصة أفق؟",
    options: [
      "التعلم النشط والتفاعلي",
      "الحفظ والتلقين فقط",
      "التعلم الفردي المنعزل",
      "التركيز على النظرية دون التطبيق"
    ]
  },
  {
    id: 3,
    question: "ما هي أهمية دمج التقنية في التعليم وفقاً لرؤية منصة أفق؟",
    options: [
      "تحسين جودة التعلم ومواكبة العصر الرقمي",
      "استبدال المعلم بالتقنية",
      "تعقيد العملية التعليمية",
      "تقليل التفاعل بين الطلاب"
    ]
  },
  {
    id: 4,
    question: "كيف يساهم الإعلام التربوي في تحقيق أهداف منصة أفق؟",
    options: [
      "نشر المحتوى التعليمي والتربوي بطرق مبتكرة وجذابة",
      "الترفيه فقط دون محتوى تعليمي",
      "نقل الأخبار العامة",
      "التركيز على الإعلانات التجارية"
    ]
  },
  {
    id: 5,
    question: "ما الذي يميز منهج منصة أفق في الجمع بين الأصالة والمعاصرة؟",
    options: [
      "الاستفادة من التراث الإسلامي مع استخدام الأساليب التعليمية الحديثة",
      "التركيز على التراث فقط",
      "التركيز على الحداثة فقط",
      "عدم الربط بين التراث والحداثة"
    ]
  }
];

export default SimulationQuiz;