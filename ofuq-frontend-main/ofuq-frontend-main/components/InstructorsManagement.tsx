'use client';

import React, { useState, useEffect } from 'react';
import '../styles/instructors-management.css';
import { getInstructors, createInstructor, updateInstructor, deleteInstructor, Instructor } from '../utils/instructorService';

// Frontend interface for form handling (keeping the original structure for UI)
interface InstructorFormData {
  name: string;
  description: string; // Maps to 'title' in backend
  bio: string;
  profileImage: string; // Base64 for preview
}

const InstructorsManagement: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [formData, setFormData] = useState<InstructorFormData>({
    name: '',
    description: '',
    bio: '',
    profileImage: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch instructors on component mount
  useEffect(() => {
    const fetchInstructors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const instructorsData = await getInstructors();
        console.log('Fetched instructors data:', instructorsData); // Debug log
        
        // Ensure we have an array
        if (Array.isArray(instructorsData)) {
          setInstructors(instructorsData);
        } else {
          console.error('Expected array but got:', typeof instructorsData, instructorsData);
          setInstructors([]);
          setError('تنسيق البيانات المستلمة غير صحيح');
        }
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setInstructors([]); // Ensure instructors is always an array
        setError('فشل في تحميل بيانات المحاضرين');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the raw file for API submission
      setImageFile(file);
      
      // Generate Base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profileImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.bio) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create FormData object for API submission
      const apiFormData = new FormData();
      apiFormData.append('name', formData.name);
      apiFormData.append('title', formData.description); // Map description to title
      apiFormData.append('bio', formData.bio);
      
      // Add image file if selected
      if (imageFile) {
        apiFormData.append('image', imageFile);
      }

      // Call API to create instructor
      await createInstructor(apiFormData);
      
      // Clear form on success
      setFormData({
        name: '',
        description: '',
        bio: '',
        profileImage: ''
      });
      setImageFile(null);
      
      // Refresh instructor list
      const updatedInstructors = await getInstructors();
      setInstructors(updatedInstructors);
      
      setSuccessMessage('تم إضافة المحاضر بنجاح');
    } catch (err) {
      setError('فشل في إضافة المحاضر. يرجى المحاولة مرة أخرى');
      console.error('Error creating instructor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId || !formData.name || !formData.description || !formData.bio) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create FormData object for API submission
      const apiFormData = new FormData();
      apiFormData.append('name', formData.name);
      apiFormData.append('title', formData.description); // Map description to title
      apiFormData.append('bio', formData.bio);
      
      // Add image file if selected
      if (imageFile) {
        apiFormData.append('image', imageFile);
      }

      // Call API to update instructor
      await updateInstructor(editingId, apiFormData);
      
      // Clear form and editing state
      setFormData({
        name: '',
        description: '',
        bio: '',
        profileImage: ''
      });
      setImageFile(null);
      setEditingId(null);
      
      // Refresh instructor list
      const updatedInstructors = await getInstructors();
      setInstructors(updatedInstructors);
      
      setSuccessMessage('تم تحديث بيانات المحاضر بنجاح');
    } catch (err) {
      setError('فشل في تحديث بيانات المحاضر. يرجى المحاولة مرة أخرى');
      console.error('Error updating instructor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = editingId ? handleUpdateInstructor : handleAddInstructor;

  const handleEdit = (instructor: Instructor) => {
    setFormData({
      name: instructor.name,
      description: instructor.title, // Map title back to description for UI
      bio: instructor.bio,
      profileImage: instructor.image || ''
    });
    setEditingId(instructor.id);
    setImageFile(null); // Clear file selection when editing
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await deleteInstructor(id);
      
      // Refresh instructor list
      const updatedInstructors = await getInstructors();
      setInstructors(updatedInstructors);
      
      setSuccessMessage('تم حذف المحاضر بنجاح');
    } catch (err) {
      setError('فشل في حذف المحاضر. يرجى المحاولة مرة أخرى');
      console.error('Error deleting instructor:', err);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setImageFile(null);
    setFormData({
      name: '',
      description: '',
      bio: '',
      profileImage: ''
    });
  };

  return (
    <div className="instructors-management">
      <div className="instructors-header">
        <h1>إدارة المحاضرين</h1>
        <p>إضافة وإدارة بيانات المحاضرين في المنصة</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-message">
          <p>جاري التحميل...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {/* نموذج إضافة/تعديل المحاضر */}
      <div className="instructor-form-container">
        <h2>{editingId ? 'تعديل بيانات المحاضر' : 'إضافة محاضر جديد'}</h2>
        <form onSubmit={handleSubmit} className="instructor-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profileImage">صورة البروفايل</label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                disabled={isLoading}
              />
              {formData.profileImage && (
                <div className="image-preview">
                  <img src={formData.profileImage} alt="معاينة الصورة" />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="name">اسم المحاضر *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="أدخل اسم المحاضر"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">التعريف البسيط *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="تعريف بسيط تحت الاسم"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">نبذة مختصرة عن المحاضر *</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="اكتب نبذة مختصرة عن المحاضر وخبراته"
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'جاري المعالجة...' : (editingId ? 'تحديث البيانات' : 'إضافة المحاضر')}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="cancel-btn" disabled={isLoading}>
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {/* جدول عرض المحاضرين */}
      <div className="instructors-table-container">
        <h2>قائمة المحاضرين</h2>
        {instructors.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد بيانات محاضرين حتى الآن</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="instructors-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>التعريف</th>
                  <th>النبذة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(instructors) && instructors.map((instructor) => (
                  <tr key={instructor.id}>
                    <td>{instructor.id}</td>
                    <td>
                      {instructor.image ? (
                        <img 
                          src={instructor.image} 
                          alt={instructor.name}
                          className="table-profile-image"
                        />
                      ) : (
                        <div className="no-image">لا توجد صورة</div>
                      )}
                    </td>
                    <td>{instructor.name}</td>
                    <td>{instructor.title}</td>
                    <td className="bio-cell">{instructor.bio}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(instructor)}
                          className="edit-btn"
                          disabled={isLoading}
                        >
                          تعديل
                        </button>
                        <button 
                          onClick={() => setShowDeleteModal(instructor.id)}
                          className="delete-btn"
                          disabled={isLoading}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف بيانات هذا المحاضر؟</p>
            <p className="warning-text">
              سيتم حذف جميع بيانات المحاضر وانتسابه للكورسات
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => handleDelete(showDeleteModal)}
                className="confirm-delete-btn"
              >
                نعم، احذف
              </button>
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="cancel-delete-btn"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorsManagement;