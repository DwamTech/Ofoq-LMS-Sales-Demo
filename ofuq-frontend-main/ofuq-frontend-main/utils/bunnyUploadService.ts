import apiClient from './apiClient';

export interface InitUploadResponse {
  data: {
    videoGuid: string;
    collectionId: string;
    libraryId: string;
    authorizationSignature: string;
    authorizationExpire: string;
  };
}

export const initBunnyUpload = async (courseId: string, videoTitle: string) => {
  const response = await apiClient.post<InitUploadResponse>('/admin/bunny/init-upload', {
    course_id: courseId,
    video_title: videoTitle
  });
  return response.data.data;
};
