// @ts-ignore - Vite injeta import.meta.env em tempo de compilação
const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
  code?: string;
}

export class ApiException extends Error {
  public code?: string;
  public status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiException';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('token'); 
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = 'Erro desconhecido na API';
      let errorCode = undefined;

      try {
        const errorData = (await response.json()) as ApiError | any;
        // FastAPI geralmente envia { "detail": "..." }
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
        errorCode = errorData.code;
      } catch (parseError) {
        errorMessage = response.statusText;
      }

      throw new ApiException(errorMessage, response.status, errorCode);
    }

    if (response.status === 204) {
      return null as any;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException('Erro de conexão com o servidor.', 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: any, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};