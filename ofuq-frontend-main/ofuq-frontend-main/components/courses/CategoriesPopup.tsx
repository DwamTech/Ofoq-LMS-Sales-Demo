import React, { useState, useEffect } from 'react';
import { Category, getCategories, createCategory, updateCategory, deleteCategory } from '../../utils/categoryService';
import '../../styles/categories-popup.css';

interface CategoriesPopupProps {
  onClose: () => void;
}

const CategoriesPopup: React.FC<CategoriesPopupProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (suppressError = false) => {
    setIsLoading(true);
    try {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
      setError(null);
    } catch (err) {
      if (!suppressError) {
        setError((err as Error).message);
      }
      if (suppressError) {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      setError('اسم القسم لا يمكن أن يكون فارغًا');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newCategory = await createCategory({ name: newCategoryName.trim() });
      
      // تحديث فوري للواجهة
      setCategories(prevCategories => [...prevCategories, newCategory]);
      setNewCategoryName('');
      
      // إعادة تحميل للتأكد من التزامن مع الخادم
      try {
        await loadCategories(true);
      } catch (refreshErr) {
        console.error('Refresh after category create failed:', refreshErr);
        setError('تمت الإضافة بنجاح، لكن تعذر تحديث القائمة تلقائياً.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: number, name: string) => {
    if (!name.trim()) {
      setError('اسم القسم لا يمكن أن يكون فارغًا');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedCategory = await updateCategory(id, { name: name.trim() });
      
      // تحديث فوري للواجهة
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === id ? { ...cat, ...updatedCategory, name: name.trim() } : cat
        )
      );
      setEditingCategory(null);
      
      // إعادة تحميل للتأكد من التزامن مع الخادم
      try {
        await loadCategories(true);
      } catch (refreshErr) {
        console.error('Refresh after category update failed:', refreshErr);
        setError('تم الحفظ بنجاح، لكن تعذر تحديث القائمة تلقائياً.');
      }
    } catch (err) {
      setError((err as Error).message);
      setEditingCategory(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا القسم؟')) {
      setIsLoading(true);
      setError(null);
      
      try {
        await deleteCategory(id);
        
        // تحديث فوري للواجهة
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat.id !== id)
        );
        
        // إعادة تحميل للتأكد من التزامن مع الخادم
        try {
          await loadCategories(true);
        } catch (refreshErr) {
          console.error('Refresh after category delete failed:', refreshErr);
          setError('تم الحذف بنجاح، لكن تعذر تحديث القائمة تلقائياً.');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory({ ...category });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setError(null);
  };

  // إضافة دالة لمعالجة الضغط على Enter في حقل الإدخال
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreate();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && editingCategory) {
      handleUpdate(editingCategory.id, editingCategory.name);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>إدارة الأقسام</h2>
        {error && <p className="error-message">{error}</p>}
        
        <div className="add-category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="أضف قسمًا جديدًا"
            disabled={isLoading}
            autoFocus
          />
          <button onClick={handleCreate} disabled={isLoading || !newCategoryName.trim()}>
            {isLoading ? 'جاري الإضافة...' : 'إضافة'}
          </button>
        </div>

        {isLoading && categories.length === 0 ? (
          <p>جاري تحميل الأقسام...</p>
        ) : (
          <ul className="categories-list">
            {categories.map((category) => (
              <li key={category.id}>
                {editingCategory && editingCategory.id === category.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      onKeyPress={handleEditKeyPress}
                      disabled={isLoading}
                      autoFocus
                    />
                    <button 
                      onClick={() => handleUpdate(editingCategory.id, editingCategory.name)} 
                      disabled={isLoading || !editingCategory.name.trim()}
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button onClick={cancelEditing} disabled={isLoading}>
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="category-item">
                    <span>{category.name}</span>
                    <div className="category-actions">
                      <button 
                        onClick={() => startEditing(category)} 
                        disabled={isLoading} 
                        className="edit-icon" 
                        title="تعديل"
                      >
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)} 
                        disabled={isLoading} 
                        className="delete-icon" 
                        title="حذف"
                      >
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoriesPopup;
