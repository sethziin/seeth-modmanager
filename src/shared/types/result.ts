import type { AppError } from './error';

export type Result<T, E = AppError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}
