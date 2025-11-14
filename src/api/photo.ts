import request from '@/utils/request';
import type { Photo, CreatePhotoParams, UpdatePhotoParams } from '@/types/photo';

/**
 * 创建照片
 * @param params 照片信息
 * @returns 创建的照片信息
 */
export const createPhotoAPI = (params: CreatePhotoParams) => {
  return request<Photo>('POST', '/web/photo', {
    data: params,
  });
};

/**
 * 获取照片详情
 * @param id 照片ID
 * @returns 照片详情
 */
export const getPhotoDetailAPI = (id: number) => {
  return request<Photo>('GET', `/web/photo/${id}`);
};

/**
 * 更新照片
 * @param id 照片ID
 * @param params 更新参数（名称）
 * @returns 更新结果
 */
export const updatePhotoAPI = (id: number, params: UpdatePhotoParams) => {
  return request<void>('PATCH', `/web/photo/${id}`, {
    data: params,
  });
};

/**
 * 删除照片
 * @param id 照片ID
 * @returns 删除结果
 */
export const deletePhotoAPI = (id: number) => {
  return request<void>('DELETE', `/web/photo/${id}`);
};
