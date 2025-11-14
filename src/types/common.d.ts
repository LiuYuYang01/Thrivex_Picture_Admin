// 通用类型

// 分页响应类型
export interface PagingData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

