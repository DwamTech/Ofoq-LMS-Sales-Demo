"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Upload } from 'tus-js-client';

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'success' | 'error' | 'aborted';

export interface UploadItem {
  id: string; // videoGuid
  title: string;
  progress: number;
  status: UploadStatus;
  file?: File; // Only present if selecting a new file
  error?: string;
  tusInstance?: Upload | null; // The active TUS instance
  initData: {
    libraryId: string;
    authorizationSignature: string;
    authorizationExpire: string;
    collectionId: string;
    videoGuid: string;
  };
}

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (file: File, initData: UploadItem['initData'], title: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string, file?: File) => void;
  cancelUpload: (id: string) => void;
  clearUpload: (id: string) => void;
  isManagerOpen: boolean;
  setIsManagerOpen: (isOpen: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('__ofuq_active_uploads');
    if (saved) {
      try {
        const parsed: UploadItem[] = JSON.parse(saved);
        // Clean up transient properties
        const restored = parsed.map(u => ({
          ...u,
          file: undefined,
          tusInstance: undefined,
          // If it was uploading or pending, it is effectively paused now because the browser closed
          status: (u.status === 'uploading' || u.status === 'pending') ? 'paused' : u.status
        })) as UploadItem[];
        
        // Remove old successes
        const filtered = restored.filter(u => u.status !== 'success');
        setUploads(filtered);
      } catch (e) {
        console.error("Failed to parse saved uploads", e);
      }
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    // Only save the serializable part
    const serializable = uploads.map(u => ({
      ...u,
      file: undefined,
      tusInstance: undefined
    }));
    localStorage.setItem('__ofuq_active_uploads', JSON.stringify(serializable));
  }, [uploads]);

  // Make sure user is warned if they try to close with active uploads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isUploading = uploads.some(u => u.status === 'uploading');
      if (isUploading) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploads]);

  const updateUploadState = (id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const createTusInstance = (
    file: File | Blob, 
    id: string, 
    initData: UploadItem['initData'],
    title: string
  ): Upload => {
    return new Upload(file as any, {
      endpoint: 'https://video.bunnycdn.com/tusupload',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: initData.authorizationSignature,
        AuthorizationExpire: initData.authorizationExpire,
        VideoId: initData.videoGuid,
        LibraryId: initData.libraryId,
      },
      metadata: {
        filetype: file.type || 'video/mp4',
        title: title,
        collection: initData.collectionId,
      },
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      onError: (error) => {
        console.error('TUS Upload failed:', error);
        updateUploadState(id, { status: 'error', error: error.message });
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = (bytesUploaded / bytesTotal) * 100;
        updateUploadState(id, { progress: percentage, status: 'uploading' });
      },
      onSuccess: () => {
        console.log('TUS Upload completed for', id);
        updateUploadState(id, { status: 'success', progress: 100 });
      },
    });
  };

  const addUpload = useCallback((file: File, initData: UploadItem['initData'], title: string) => {
    const id = initData.videoGuid;
    setIsManagerOpen(true);

    const tusInstance = createTusInstance(file, id, initData, title);

    setUploads(prev => [
      ...prev,
      {
        id,
        title,
        progress: 0,
        status: 'uploading',
        file,
        tusInstance,
        initData
      }
    ]);

    tusInstance.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        tusInstance.resumeFromPreviousUpload(previousUploads[0]);
      }
      tusInstance.start();
    }).catch(err => {
      console.error(err);
      tusInstance.start();
    });
  }, []);

  const pauseUpload = useCallback((id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload?.tusInstance) {
        upload.tusInstance.abort();
      }
      return prev.map(u => u.id === id ? { ...u, status: 'paused' } : u);
    });
  }, []);

  const resumeUpload = useCallback((id: string, fileInfo?: File) => {
    setUploads(prev => {
      const index = prev.findIndex(u => u.id === id);
      if (index === -1) return prev;
      const upload = prev[index];

      let newTusInstance = upload.tusInstance;
      const finalFile = fileInfo || upload.file;

      if (!finalFile) {
        console.error("Cannot resume upload without a file reference.");
        return prev;
      }

      // Recreate instance if it was lost (e.g., page reload)
      if (!newTusInstance) {
        newTusInstance = createTusInstance(finalFile, id, upload.initData, upload.title);
      }

      newTusInstance.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          newTusInstance!.resumeFromPreviousUpload(previousUploads[0]);
        }
        newTusInstance!.start();
      }).catch((e) => {
        newTusInstance!.start();
      });

      const newUploads = [...prev];
      newUploads[index] = { ...upload, status: 'uploading', tusInstance: newTusInstance, file: finalFile };
      return newUploads;
    });
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload?.tusInstance) {
        upload.tusInstance.abort(true, (err) => {
           if(err) console.error("Error aborting locked TUS", err);
        });
      }
      return prev.map(u => u.id === id ? { ...u, status: 'aborted' } : u);
    });
  }, []);

  const clearUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <UploadContext.Provider value={{
      uploads,
      addUpload,
      pauseUpload,
      resumeUpload,
      cancelUpload,
      clearUpload,
      isManagerOpen,
      setIsManagerOpen
    }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
