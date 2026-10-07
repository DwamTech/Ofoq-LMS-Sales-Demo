export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
}

export interface MCQBank {
  id: string;
  questions: MCQQuestion[];
  totalQuestions: number;
  passingScore: number; // النسبة المئوية للنجاح
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoFile?: File;
  videoUrl?: string; // رابط الفيديو من مصادر خارجية مثل Google Drive
  // تحديد إتاحة الفيديو للعامة أو لا
  isVideoPublic?: boolean;
  attachments: File[];
  duration?: number;
  order: number;
  questions: Question[];
  // Quiz information for the lesson
  quiz?: {
    id: number;
    title: string;
    description?: string;
    passing_score?: number;
    time_limit?: number;
    questions?: Question[];
  };
  // روابط مصادر الدرس مع نوع الأيقونة
  resources?: {
    id: string;
    title: string;
    description?: string;
    url: string;
    type: 'website' | 'article' | 'video' | 'book' | 'tool' | 'other';
    domain?: string;
  }[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Instructor {
  id: number;
  name: string;
  title?: string;
  profileImage?: string;
  email?: string;
  bio?: string;
  specialization?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: {
    id: number;
    name: string;
  };
  coverImage?: File | string; // Can be File for uploads or string URL from API
  cover_image?: string; // API field name
  price: number | string;
  isFree?: boolean;
  is_free?: boolean; // API field name
  chapters: Chapter[];
  chapters_count?: number; // API field name
  createdAt?: Date;
  created_at?: string; // API field name
  updated_at?: string; // API field name
  status: 'draft' | 'published' | 'archived';
  instructor?: Instructor & {
    image?: string; // API field name for instructor image
  };
  instructor_id?: number; // API field name
  category_id?: number; // API field name
  rating?: string | number; // API field name
  duration?: number; // API field name
  students_count?: number; // API field name
  reviews_count?: number; // API field name
  average_rating?: number; // API field name
}

export type CourseCreationStep = 'basic-info' | 'content-management' | 'review';