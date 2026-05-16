const API_BASE_URL = import.meta.env.VITE_API_URL || "http://vulnavep.com:8000";
// If API_BASE_URL is an absolute URL (contains ://), append /api/v1
// If it's a relative path (starts with /), use it as-is
const getEndpoint = (path: string) => {
  if (API_BASE_URL.includes("://")) {
    return `${API_BASE_URL}/api/v1${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const API_ENDPOINTS = {
  register: getEndpoint("/auth/register"),
  login: getEndpoint("/auth/login"),
  adminLogin: getEndpoint("/auth/admin-login"),
  verify: getEndpoint("/auth/verify"),
  logout: getEndpoint("/auth/logout"),
  tasks: getEndpoint("/tasks"),
  instanceStatus: getEndpoint("/instance/status"),
  instanceDeploy: getEndpoint("/instance/deploy"),
  instanceExtend: getEndpoint("/instance/extend"),
  instanceTerminate: getEndpoint("/instance/terminate"),
  adminInstances: getEndpoint("/admin/instances"),
};

export class ApiClient {
  static getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  static setToken(token: string): void {
    localStorage.setItem("auth_token", token);
  }

  static clearToken(): void {
    localStorage.removeItem("auth_token");
  }

  static getHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  static async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.message ||
        errorData.detail ||
        `API Error: ${response.status}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  static async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: "GET",
    });
  }

  static async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: "DELETE",
    });
  }
}
