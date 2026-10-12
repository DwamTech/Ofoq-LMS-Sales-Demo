import apiClient from "./apiClient";

// Interface for instructor data structure
export interface Instructor {
  id: number;
  name: string;
  title: string;
  email?: string;
  bio: string;
  image?: string; // هذا هو رابط الصورة، وليس الملف
  rating: number;
  courses_count: number;
  students_count: number;
  avg_rate: number;
  created_at?: string;
  updated_at?: string;
}

interface CreateInstructorResponse {
  data: Instructor;
  message: string;
}

type InstructorsIndexResponse =
  | Instructor[]
  | {
      success?: boolean;
      data?:
        | Instructor[]
        | {
            data?: Instructor[];
          };
    };

/**
 * [Admin] جلب جميع المدربين
 */
export const getInstructors = async (): Promise<Instructor[]> => {
  const { readFrontend } = await import("@/lib/frontendStore");
  return readFrontend().instructors as Instructor[];
};

/**
 * [Admin] إنشاء مدرب جديد
 */
export const createInstructor = async (
  instructorData: FormData,
): Promise<Instructor> => {
  try {
    console.log("FormData contents:");
    Array.from(instructorData.entries()).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    const response = await apiClient.post<CreateInstructorResponse>(
      "/admin/instructors",
      instructorData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  } catch (error) {
    console.error("Error creating instructor:", error);
    throw new Error("Failed to create instructor");
  }
};

/**
 * [Admin] تحديث مدرب موجود
 */
export const updateInstructor = async (
  id: number,
  instructorData: FormData,
): Promise<Instructor> => {
  try {
    instructorData.append("_method", "PUT");
    const response = await apiClient.post<CreateInstructorResponse>(
      `/admin/instructors/${id}`,
      instructorData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating instructor:", error);
    throw new Error("Failed to update instructor");
  }
};

/**
 * [Admin] حذف مدرب
 */
export const deleteInstructor = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/admin/instructors/${id}`);
  } catch (error) {
    console.error("Error deleting instructor:", error);
    throw new Error("Failed to delete instructor");
  }
};
