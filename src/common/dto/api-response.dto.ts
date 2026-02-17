export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  meta?: { total?: number; page?: number; limit?: number };
  error?: { code: string; message: string };
}
