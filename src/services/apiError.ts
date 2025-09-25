export interface NormalizedApiError {
  status?: number;
  message: string;
  raw?: unknown;
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  if (err instanceof Error) {
    return { message: err.message, raw: err };
  }
  return { message: 'Unknown error', raw: err };
}
