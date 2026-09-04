const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
export const FILES_URL = API_URL.replace(/\/api\/?$/, '');

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pm_token');
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  const isFormData = rest.body instanceof FormData;
  if (!isFormData && rest.body) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if ((auth ?? true) && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === 'object' && data?.error ? data.error : 'Ocorreu um erro. Tente novamente.';
    throw new ApiRequestError(res.status, message);
  }

  return data as T;
}

export function resolveFileUrl(url: string) {
  if (url.startsWith('http')) return url;
  return `${FILES_URL}${url}`;
}

export function downloadUrl(photoId: string) {
  return `${API_URL}/photos/${photoId}/download`;
}
