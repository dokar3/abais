export type FetchResponse<T> = {
  data?: T;
  error?: string;
  isLoading: boolean;
};
