// 文件上传相关类型

export interface UploadFileParams {
  files: File[];
  albumId: number;
}

export interface UploadFileResponse {
  id: number;
  name: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  type: string;
  create_time: string;
}
