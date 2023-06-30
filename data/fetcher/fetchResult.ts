export type FetchResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};
