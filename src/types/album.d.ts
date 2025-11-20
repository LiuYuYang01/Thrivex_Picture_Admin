// 相册相关类型

import type { Photo } from './photo';

export interface Album {
  id: number;
  name: string;
  description?: string;
  cover?: string;
  create_time: string;
  photos?: Photo[];
  photo_count?: number;
}

export interface CreateAlbumParams {
  name: string;
  description?: string;
  cover?: string;
}

export interface UpdateAlbumParams {
  name?: string;
  description?: string;
  cover?: string;
}

export interface QueryAlbumParams extends FilterParams {
  width?: number;
  height?: number;
  keyword?: string;
}

export interface ManagePhotosParams {
  photo_ids: number[];
}
