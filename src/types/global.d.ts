interface Response<T> {
  code: number;
  message?: string;
  total?: number;
  page?: number;
  page_size?: number;
  data: T;
}

interface FilterParams {
  page?: number;
  limit?: number;
}