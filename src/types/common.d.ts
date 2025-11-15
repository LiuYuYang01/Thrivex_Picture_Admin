// 通用类型

// 分页响应类型
interface Paginate<T> {
  next: boolean;
  prev: boolean;
  page: number;
  size: number;
  pages: number;
  total: number;
  result: T;
}
