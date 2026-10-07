'use client';

import React, { useState, useRef } from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicyPage: React.FC = () => {
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('right');
  const [textColor, setTextColor] = useState('#000000');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFormatting = (command: string, value?: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // إذا كان هناك نص محدد، طبق التنسيق على النص المحدد فقط
      document.execCommand(command, false, value);
    } else {
      // إذا لم يكن هناك نص محدد، طبق التنسيق على النص الجديد
      document.execCommand(command, false, value);
    }
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // تطبيق حجم الخط على النص المحدد فقط
      document.execCommand('fontSize', false, '7');
      const fontElements = document.querySelectorAll('font[size="7"]');
      fontElements.forEach(element => {
        (element as HTMLElement).style.fontSize = `${size}px`;
        element.removeAttribute('size');
      });
    } else {
      handleFormatting('fontSize', size.toString());
    }
  };

  const handleTextAlignChange = (align: string) => {
    setTextAlign(align);
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // للنص المحدد، نحتاج لتطبيق المحاذاة على العنصر الأب
      const range = selection.getRangeAt(0);
      const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as HTMLElement;
      
      if (parentElement && editorRef.current?.contains(parentElement)) {
        (parentElement as HTMLElement).style.textAlign = align;
      }
    } else {
      handleFormatting('justify' + align.charAt(0).toUpperCase() + align.slice(1));
    }
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    handleFormatting('foreColor', color);
  };

  const applyCustomStyle = (styleName: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      
      switch (styleName) {
        case 'heading':
          span.style.fontSize = '24px';
          span.style.fontWeight = 'bold';
          span.style.color = '#2c3e50';
          span.style.display = 'block';
          span.style.marginBottom = '15px';
          break;
        case 'subheading':
          span.style.fontSize = '20px';
          span.style.fontWeight = '600';
          span.style.color = '#34495e';
          span.style.display = 'block';
          span.style.marginBottom = '10px';
          break;
        case 'highlight':
          span.style.backgroundColor = '#fff3cd';
          span.style.padding = '2px 6px';
          span.style.borderRadius = '4px';
          span.style.fontWeight = '500';
          break;
        case 'important':
          span.style.color = '#dc3545';
          span.style.fontWeight = 'bold';
          span.style.fontSize = '18px';
          break;
      }
      
      try {
        range.surroundContents(span);
        selection.removeAllRanges();
      } catch (e) {
        // إذا فشل، استخدم طريقة بديلة
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleSave = () => {
    // هنا يمكن إضافة منطق حفظ المحتوى
    console.log('محتوى سياسة الخصوصية:', content);
    alert('تم حفظ سياسة الخصوصية بنجاح!');
  };

  return (
    <div className={styles["privacyPage"]}>
      <div className="page-header">
        <h1>سياسة الخصوصية</h1>
        <p>إدارة وتحرير سياسة الخصوصية للموقع</p>
      </div>

      <div className="editor-container">
        {/* شريط الأدوات */}
        <div className="toolbar">
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={() => applyCustomStyle('heading')}
              title="عنوان رئيسي"
            >
              H1
            </button>
            <button
              className="toolbar-btn"
              onClick={() => applyCustomStyle('subheading')}
              title="عنوان فرعي"
            >
              H2
            </button>
            <button
              className="toolbar-btn"
              onClick={() => applyCustomStyle('highlight')}
              title="تمييز النص"
            >
              🎨
            </button>
            <button
              className="toolbar-btn"
              onClick={() => applyCustomStyle('important')}
              title="نص مهم"
            >
              ⚠️
            </button>
          </div>

          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${isBold ? 'active' : ''}`}
              onClick={() => {
                setIsBold(!isBold);
                handleFormatting('bold');
              }}
              title="عريض"
            >
              <strong>B</strong>
            </button>
            <button
              className={`toolbar-btn ${isItalic ? 'active' : ''}`}
              onClick={() => {
                setIsItalic(!isItalic);
                handleFormatting('italic');
              }}
              title="مائل"
            >
              <em>I</em>
            </button>
            <button
              className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
              onClick={() => {
                setIsUnderline(!isUnderline);
                handleFormatting('underline');
              }}
              title="تحته خط"
            >
              <u>U</u>
            </button>
          </div>

          <div className="toolbar-group">
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="font-size-select"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={24}>24px</option>
              <option value={28}>28px</option>
              <option value={32}>32px</option>
            </select>
          </div>

          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
              onClick={() => handleTextAlignChange('right')}
              title="محاذاة يمين"
            >
              ⇤
            </button>
            <button
              className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
              onClick={() => handleTextAlignChange('center')}
              title="محاذاة وسط"
            >
              ⇔
            </button>
            <button
              className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
              onClick={() => handleTextAlignChange('left')}
              title="محاذاة يسار"
            >
              ⇥
            </button>
          </div>

          <div className="toolbar-group">
            <input
              type="color"
              value={textColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-picker"
              title="لون النص"
            />
          </div>

          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={() => handleFormatting('insertUnorderedList')}
              title="قائمة نقطية"
            >
              • List
            </button>
            <button
              className="toolbar-btn"
              onClick={() => handleFormatting('insertOrderedList')}
              title="قائمة مرقمة"
            >
              1. List
            </button>
          </div>

          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={() => handleFormatting('undo')}
              title="تراجع"
            >
              ↶
            </button>
            <button
              className="toolbar-btn"
              onClick={() => handleFormatting('redo')}
              title="إعادة"
            >
              ↷
            </button>
          </div>
        </div>

        {/* منطقة التحرير */}
        <div
          ref={editorRef}
          className="text-editor"
          contentEditable
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          style={{
            fontSize: `${fontSize}px`,
            textAlign: textAlign as any,
            color: textColor
          }}
          suppressContentEditableWarning={true}
        >
          <p>اكتب سياسة الخصوصية هنا...</p>
        </div>

        {/* أزرار الحفظ والإلغاء */}
        <div className="editor-actions">
          <button className="save-btn" onClick={handleSave}>
            حفظ التغييرات
          </button>
          <button 
            className="cancel-btn" 
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = '<p>اكتب سياسة الخصوصية هنا...</p>';
                setContent('');
              }
            }}
          >
            إلغاء التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;