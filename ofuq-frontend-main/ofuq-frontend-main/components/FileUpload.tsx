import React from 'react';

interface FileUploadProps {
  onFileSelect?: (files: FileList) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  return (
    <div>
      {/* محتوى مكون رفع الملفات سيتم إضافته لاحقاً */}
    </div>
  );
};

export default FileUpload;