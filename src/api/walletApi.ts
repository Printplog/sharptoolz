import { apiClient } from './apiClient';

// Generic GET request
export async function getApi<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url);
  return response.data;
}

// Generic POST request
export async function postApi<T, D = any>(url: string, data?: D): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}
