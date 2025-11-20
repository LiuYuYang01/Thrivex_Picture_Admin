import request from '@/utils/request';
import type { UploadFileParams, UploadFileResponse } from '@/types/upload';

/**
 * 文件上传（支持批量上传）
 * @param params 上传参数（文件数组和相册ID）
 * @returns 上传成功的照片信息数组
 */
export const uploadFileAPI = (params: UploadFileParams) => {
  const formData = new FormData();

  // 添加文件
  params.files.forEach((file) => {
    formData.append('files', file);
  });

  // 添加相册ID
  formData.append('albumId', params.albumId.toString());

  return request<UploadFileResponse[]>('POST', '/qiniu/upload', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 0,
  });
};
