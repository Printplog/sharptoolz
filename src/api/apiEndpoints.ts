import type { LoginPayload, RegisterPayload, User } from "@/types";
import { apiClient } from "./apiClient";

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await apiClient.get('/accounts/user');
  return res.data;
};

export const login = async (data: LoginPayload): Promise<unknown> => {
  const res = await apiClient.post('/accounts/login/', data);
  return res.data;
};

export const logout = async (): Promise<unknown> => {
  const res = await apiClient.post('/accounts/logout/');
  return res.data;
};

export const register = async (data: RegisterPayload): Promise<unknown> => {
  const res = await apiClient.post('/accounts/register/', data);
  return res.data;
};

export const refreshToken = async (): Promise<User> => {
  const res = await apiClient.post('/accounts/refresh-token/');
  return res.data;
};