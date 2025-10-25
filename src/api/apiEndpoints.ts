import type { Tool, CryptoPaymentData, DownloadData, LoginPayload, PurchasedTemplate, RegisterPayload, Template, User } from "@/types";
import { apiClient } from "./apiClient";

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await apiClient.get('/accounts/user/');
  return res.data;
};

export const login = async (data: LoginPayload): Promise<User> => {
  const res = await apiClient.post('/accounts/login/', data);
  return res.data;
};

export const logout = async (): Promise<unknown> => {
  const res = await apiClient.post('/accounts/logout/');
  return res.data;
};

export const forgotPassword = async (data: { email: string }): Promise<unknown> => {
  const res = await apiClient.post('/accounts/forgot-password/', data);
  return res.data;
};

export const changePassword = async (data: {
  old_password: string
  new_password: string
}): Promise<unknown> => {
  const res = await apiClient.post('/accounts/change-password/', data);
  return res.data;
};

export const resetPasswordConfirm = async (data: {
  uid: string;
  token: string;
  password: string;
}): Promise<unknown> => {
  const res = await apiClient.post('/accounts/reset-password-confirm/', data);
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

export const addTemplate = async (data: FormData): Promise<unknown> => {
  const res = await apiClient.post('/templates/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export const updateTemplate = async (id: string, data: Partial<Template> | FormData): Promise<unknown> => {
  const headers = data instanceof FormData 
    ? { 'Content-Type': 'multipart/form-data' }
    : { 'Content-Type': 'application/json' };
    
  const res = await apiClient.patch(`/templates/${id}/`, data, { headers });
  return res.data;
}

export const deleteTemplate = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/templates/${id}/`);
  return res.data;
}

export const getTemplates = async (hot?: boolean, tool?: string): Promise<Template[]> => {
  const params = new URLSearchParams();
  if (hot) params.append('hot', 'true');
  if (tool) params.append('tool', tool);
  
  const queryString = params.toString();
  const res = await apiClient.get(`/templates/${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

export const getTemplate = async (id: string): Promise<Template> => {
  const res = await apiClient.get(`/templates/${id}/`);
  return res.data;
}

export const purchaseTemplate = async (data: Partial<PurchasedTemplate>): Promise<{id: string}> => {
  const res = await apiClient.post('/purchased-templates/', data);
  return res.data;
}


export const updatePurchasedTemplate = async (data: Partial<PurchasedTemplate>): Promise<unknown> => {
  const res = await apiClient.patch(`/purchased-templates/${data.id}/`, data);
  return res.data;
}

export const deletePurchasedTemplate = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/purchased-templates/${id}/`);
  return res.data;
}

export const getPurchasedTemplates = async (): Promise<PurchasedTemplate[]> => {
  const res = await apiClient.get(`/purchased-templates/`);
  return res.data;
}

export const getPurchasedTemplate = async (id: string): Promise<PurchasedTemplate> => {
  const res = await apiClient.get(`/purchased-templates/${id}/`);
  return res.data;
}

export const createCryptoPayment = async (ticker: string): Promise<CryptoPaymentData> => {
  const res = await apiClient.post('/create-payment/', ticker);
  return res.data;
};

export const cancelCryptoPayment = async (id: string): Promise<CryptoPaymentData> => {
  const res = await apiClient.post('/cancel-payment/',  {id});
  return res.data;
};

export const downloadDoc = async (data: DownloadData) => {
  const res = await apiClient.post('/download-doc/',  data, {
    responseType: "blob",
  });
  return res.data;
};

export const adminOverview = async () => {
  const res = await apiClient.get('/admin/overview/');
  return res.data;
};

export const adminUsers = async (params?: { page?: number; page_size?: number; search?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.search) searchParams.append('search', params.search);
  
  const res = await apiClient.get(`/admin/users/?${searchParams.toString()}`);
  return res.data;
};

export const adminUserDetails = async (userId: string) => {
  const res = await apiClient.get(`/admin/users/${userId}/`);
  return res.data;
};

// Tools API (same as categories but with different naming)
export const getTools = async (): Promise<Tool[]> => {
  const res = await apiClient.get('/tools/');
  return res.data;
};

export const getTool = async (id: string): Promise<Tool> => {
  const res = await apiClient.get(`/tools/${id}/`);
  return res.data;
};

export const createTool = async (data: { name: string; description?: string; is_active: boolean }): Promise<Tool> => {
  const res = await apiClient.post('/tools/', data);
  return res.data;
};

export const updateTool = async (id: string, data: Partial<Tool>): Promise<Tool> => {
  const res = await apiClient.put(`/tools/${id}/`, data);
  return res.data;
};

export const deleteTool = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/tools/${id}/`);
  return res.data;
};

export const removeBackground = async (imageFile: File): Promise<{ success: boolean; image: string; message: string }> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const res = await apiClient.post('/remove-background/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
