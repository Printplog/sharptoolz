import type { Country, FormField, Tool, Tutorial, CryptoPaymentData, CryptoPaymentConfirmation, CryptoPaymentStatus, DownloadData, Font, LoginPayload, LoginResponse, AdminTwoFactorSetup, AdminTwoFactorVerification, PurchasedTemplate, RegisterPayload, Template, User, SiteSettings, AuditLog, TrafficAttribution, ApiAccessStatus, ApiKeyRecord, ApiTheme, WalletData, SupportProfile, TrackingSupportMessage, TrackingSupportMessagesResponse } from "@/types";
import { apiClient } from "./apiClient";
export const getApi = apiClient.get;
export const postApi = apiClient.post;
export const patchApi = apiClient.patch;
export const deleteApi = apiClient.delete;

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await apiClient.get('/accounts/user/');
  return res.data;
};

export const markUpdateSeen = async (releaseId: string): Promise<User> => {
  const res = await apiClient.patch('/accounts/user/', { last_seen_update: releaseId });
  return res.data;
};

export const login = async (data: LoginPayload): Promise<LoginResponse> => {
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

export const loginWithGoogle = async (access_token: string): Promise<LoginResponse> => {
  const res = await apiClient.post('/accounts/google/', { access_token });
  return res.data;
};

export const setupAdminTwoFactor = async (): Promise<AdminTwoFactorSetup> => {
  const res = await apiClient.post('/accounts/two-factor/setup/', {});
  return res.data;
};

export const verifyAdminTwoFactor = async (code: string): Promise<AdminTwoFactorVerification> => {
  const res = await apiClient.post('/accounts/two-factor/verify/', { code });
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

export const updateTemplate = async (id: string, data: Partial<Template> | FormData): Promise<Template> => {
  const headers = data instanceof FormData
    ? { 'Content-Type': 'multipart/form-data' }
    : { 'Content-Type': 'application/json' };

  const res = await apiClient.patch(`/templates/${id}/`, data, { headers });
  return res.data;
}

export const updateTemplateForAdmin = async (id: string, data: Partial<Template> | FormData): Promise<Template> => {
  const headers = data instanceof FormData
    ? { 'Content-Type': 'multipart/form-data' }
    : { 'Content-Type': 'application/json' };

  const res = await apiClient.patch(`/admin/templates/${id}/`, data, { headers });
  return res.data;
}

export const deleteTemplate = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/templates/${id}/`);
  return res.data;
}

type TemplateListParams = {
  page?: number;
  search?: string;
  tool?: string;
  /** Country id, or "none" for templates without a country */
  country?: string;
  hot?: boolean;
  page_size?: number;
};

type TemplateListResponse = {
  results: Template[];
  count: number;
  next: string | null;
  previous: string | null;
};

type AdminTemplateListResponse = TemplateListResponse & {
  current_page?: number;
  total_pages?: number;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    hot: number;
  };
};

const ADMIN_TEMPLATE_PAGE_SIZE = 50;

export const getTemplates = async (params?: TemplateListParams): Promise<TemplateListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.tool && params.tool !== 'all') searchParams.append('tool', params.tool);
  if (params?.country && params.country !== 'all') searchParams.append('country', params.country);
  if (params?.hot) searchParams.append('hot', 'true');
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

  const queryString = searchParams.toString();
  const res = await apiClient.get(`/templates/${queryString ? `?${queryString}` : ''}`);
  return res.data;
}
export const getTemplatesForAdmin = async (params?: TemplateListParams): Promise<AdminTemplateListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.tool && params.tool !== 'all') searchParams.append('tool', params.tool);
  if (params?.country && params.country !== 'all') searchParams.append('country', params.country);
  if (params?.hot) searchParams.append('hot', 'true');
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

  const queryString = searchParams.toString();
  const res = await apiClient.get(`/admin/templates/${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

export const getAllTemplatesForAdmin = async (
  params?: Omit<TemplateListParams, 'page'>
): Promise<Template[]> => {
  const pageSize = params?.page_size ?? ADMIN_TEMPLATE_PAGE_SIZE;
  const templates: Template[] = [];
  let page = 1;

  while (true) {
    const response = await getTemplatesForAdmin({
      ...params,
      page,
      page_size: pageSize,
    });

    templates.push(...response.results);

    if (!response.next || (response.total_pages && page >= response.total_pages)) {
      break;
    }

    page += 1;
  }

  return templates;
}


export const getTemplate = async (id: string): Promise<Template> => {
  const res = await apiClient.get(`/templates/${id}/`);
  return res.data;
}

export const getTemplateForAdmin = async (id: string): Promise<Template> => {
  const res = await apiClient.get(`/admin/templates/${id}/`);
  return res.data;
}


// Proxy function to fetch SVG content directly via backend to avoid CORS issues
export const getTemplateSvgForAdmin = async (id: string): Promise<string> => {
  const res = await apiClient.get(`/admin/templates/${id}/svg/`, {
    responseType: 'text'
  });
  return res.data;
}


export const purchaseTemplate = async (data: Partial<PurchasedTemplate>): Promise<{ id: string }> => {
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

export const getPurchasedTemplates = async (params?: { page?: number; search?: string; page_size?: number }): Promise<{
  results: PurchasedTemplate[];
  count: number;
  next: string | null;
  previous: string | null;
}> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

  const res = await apiClient.get(`/purchased-templates/?${searchParams.toString()}`);
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

export const getTrackingSupportMessages = async (params?: { document_id?: string; fernway_profile_id?: string }): Promise<TrackingSupportMessagesResponse> => {
  const res = await apiClient.get('/support/messages/', { params });
  return res.data;
};

export const updateTrackingSupportMessageStatus = async (
  id: string,
  status: TrackingSupportMessage['status'],
): Promise<TrackingSupportMessage> => {
  const res = await apiClient.patch(`/support/messages/${id}/`, { status });
  return res.data;
};

export const sendTrackingSupportReply = async (
  id: string,
  body: string,
): Promise<TrackingSupportMessage['conversation'][number]> => {
  const res = await apiClient.post(`/support/messages/${id}/replies/`, { body });
  return res.data;
};

export const sendTrackingSupportTyping = async (
  id: string,
  isTyping: boolean,
): Promise<void> => {
  await apiClient.post(`/support/messages/${id}/typing/`, { is_typing: isTyping });
};

export const getOwnerSupportSettings = async (): Promise<SupportProfile> => {
  const res = await apiClient.get('/support/settings/');
  return res.data;
};

export const updateOwnerSupportSettings = async (input: {
  display_name?: string;
  avatar?: File | null;
  remove_avatar?: boolean;
}): Promise<SupportProfile> => {
  const formData = new FormData();
  if (input.display_name !== undefined) {
    formData.append('display_name', input.display_name);
  }
  if (input.avatar) {
    formData.append('avatar', input.avatar);
  } else if (input.remove_avatar) {
    formData.append('remove_avatar', 'true');
  }
  const res = await apiClient.patch('/support/settings/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const authorizeOwnerSupportRealtime = async (
  socketId: string,
  channelName: string,
): Promise<{ auth: string }> => {
  const res = await apiClient.post('/support/realtime-auth/', {
    socket_id: socketId,
    channel_name: channelName,
  });
  return res.data;
};

export const getWallet = async (): Promise<WalletData> => {
  const res = await apiClient.get('/wallet/');
  return res.data;
};

export const forceReparseTemplate = async (id: string): Promise<{ status: string; message: string; form_fields_count: number }> => {
  // Call the dedicated reparse action
  const res = await apiClient.post(`/admin/templates/${id}/reparse/`);
  return res.data;
};

export const cancelCryptoPayment = async (id: string): Promise<CryptoPaymentData> => {
  const res = await apiClient.post('/cancel-payment/', { id });
  return res.data;
};

export const confirmCryptoPayment = async (
  id: string,
  transactionHash: string,
): Promise<CryptoPaymentConfirmation> => {
  const res = await apiClient.post('/confirm-payment/', {
    id,
    transaction_hash: transactionHash,
  });
  return res.data;
};

export const getCryptoPaymentStatus = async (id: string): Promise<CryptoPaymentStatus> => {
  const res = await apiClient.get(`/payment-status/${id}/`);
  return res.data;
};

export const incrementDownloads = async (): Promise<void> => {
  await apiClient.post('/increment-downloads/');
};

export const downloadDoc = async (data: DownloadData) => {
  const res = await apiClient.post('/download-doc/', data, {
    responseType: "blob",
  });
  return res.data;
};

export const adminOverview = async (days?: number) => {
  const params = days ? `?days=${days}` : '';
  const res = await apiClient.get(`/admin/overview/${params}`);
  return res.data;
};

export type AdminApiCustomerStatus = 'active' | 'suspended' | 'revoked';

export interface AdminApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  allowed_origins: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface AdminApiCustomer {
  user: { id: number; username: string; email: string; name: string };
  status: AdminApiCustomerStatus;
  activated_at: string;
  paid_amount: string;
  allowed_origins: string[];
  total_keys: number;
  active_keys: number;
  external_users: number;
  active_external_users: number;
  requests: number;
  errors: number;
  success_rate: number | null;
  sessions: number;
  completed_sessions: number;
  paid_sessions: number;
  documents: number;
  paid_documents: number;
  renders: number;
  completed_renders: number;
  failed_renders: number;
  last_activity_at: string | null;
  keys: AdminApiKeySummary[];
}

export interface AdminApiCustomersResponse {
  range_days: number;
  summary: {
    customers: number;
    active_customers: number;
    active_keys: number;
    external_users: number;
    active_external_users: number;
    requests: number;
    errors: number;
    success_rate: number | null;
  };
  trend: Array<{ date: string; requests: number; errors: number }>;
  operations: Array<{ operation: string; method: string; requests: number; errors: number }>;
  customers: {
    results: AdminApiCustomer[];
    count: number;
    current_page: number;
    total_pages: number;
  };
}

export interface AdminApiExternalUser {
  external_user_id: string;
  requests: number;
  sessions: number;
  documents: number;
  last_seen_at: string;
}

export interface AdminApiActivityEvent {
  id: number;
  operation: string;
  method: string;
  status_code: number;
  duration_ms: number;
  external_user_id: string;
  key_prefix: string | null;
  created_at: string;
}

export interface AdminApiRenderJob {
  id: string;
  document_id: string;
  format: 'png' | 'pdf';
  status: 'queued' | 'running' | 'completed' | 'failed';
  output_size: number;
  error_code: string;
  expires_at: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AdminApiCustomerDetailsResponse {
  range_days: number;
  customer: AdminApiCustomer;
  trend: Array<{ date: string; requests: number; errors: number }>;
  operations: Array<{ operation: string; method: string; requests: number; errors: number }>;
  external_users: AdminApiExternalUser[];
  recent_activity: AdminApiActivityEvent[];
  recent_renders: AdminApiRenderJob[];
}

export const getAdminApiCustomers = async (params: {
  days: number;
  page?: number;
  search?: string;
  status?: string;
}): Promise<AdminApiCustomersResponse> => {
  const searchParams = new URLSearchParams({ days: params.days.toString() });
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  const res = await apiClient.get(`/admin/api-customers/?${searchParams.toString()}`);
  return res.data;
};

export const getAdminApiCustomer = async (
  userId: string | number,
  days = 30,
): Promise<AdminApiCustomerDetailsResponse> => {
  const res = await apiClient.get(`/admin/api-customers/${userId}/?days=${days}`);
  return res.data;
};

export const updateAdminApiCustomerStatus = async (
  userId: number,
  status: AdminApiCustomerStatus,
): Promise<{ user_id: number; status: AdminApiCustomerStatus }> => {
  const res = await apiClient.patch(`/admin/api-customers/${userId}/`, { status });
  return res.data;
};

export const deleteAdminApiKey = async (userId: number, keyId: string): Promise<void> => {
  await apiClient.delete(`/admin/api-customers/${userId}/keys/${keyId}/`);
};

export const getAdminAnalytics = async (days?: number, date?: string) => {
  const params = new URLSearchParams();
  if (days) params.append('days', days.toString());
  if (date) params.append('date', date);
  
  const queryString = params.toString();
  const res = await apiClient.get(`/analytics/dashboard/${queryString ? `?${queryString}` : ''}`);
  return res.data;
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await apiClient.get('/analytics/audit-logs/');
  return res.data;
};

export const logVisit = async (path: string, attribution?: TrafficAttribution, referrer?: string, visitorId?: string): Promise<void> => {
  // Innocuous URL — ad blockers strip URLs containing "analytics" or "log".
  await apiClient.post('/u/p/', { path, attribution, referrer, visitor_id: visitorId });
};


export const getUserActivity = async (params?: { page?: number; date?: string; search?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.date) searchParams.append('date', params.date);
  if (params?.search) searchParams.append('search', params.search);

  const res = await apiClient.get(`/analytics/user-activity/?${searchParams.toString()}`);
  return res.data;
};

// Campaigns API
import type { Campaign, CampaignStatsResponse } from "@/types";

export const getCampaignStats = async (): Promise<CampaignStatsResponse> => {
  const res = await apiClient.get('/analytics/campaigns/stats/');
  return res.data;
};

export const createCampaign = async (data: {
  name: string;
  source: string;
  medium: string;
  campaign: string;
  landing_path?: string;
  description?: string;
  content?: string;
  term?: string;
  source_platform?: string;
  ref_code?: string;
}): Promise<Campaign> => {
  const res = await apiClient.post('/analytics/campaigns/', data);
  return res.data;
};

export const deleteCampaign = async (id: number): Promise<unknown> => {
  const res = await apiClient.delete(`/analytics/campaigns/${id}/`);
  return res.data;
};

export const adminUsers = async (params?: { page?: number; page_size?: number; search?: string; role?: string; source?: string; days?: number; date?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.role && params.role !== 'all') searchParams.append('role', params.role);
  if (params?.source) searchParams.append('source', params.source);
  if (params?.days) searchParams.append('days', params.days.toString());
  if (params?.date) searchParams.append('date', params.date);

  const res = await apiClient.get(`/admin/users/?${searchParams.toString()}`);
  return res.data;
};

export const adminUserDetails = async (userId: string) => {
  const res = await apiClient.get(`/admin/users/${userId}/`);
  return res.data;
};

export const updateAdminUser = async (userId: string, data: { role?: string; is_active?: boolean }) => {
  const res = await apiClient.patch(`/admin/users/${userId}/`, data);
  return res.data;
};

export const adminDocuments = async (params?: { page?: number; page_size?: number; search?: string; type?: string; days?: number; date?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.type && params.type !== 'all') searchParams.append('type', params.type);
  if (params?.days) searchParams.append('days', params.days.toString());
  if (params?.date) searchParams.append('date', params.date);
  const res = await apiClient.get(`/admin/documents/?${searchParams.toString()}`);
  return res.data;
};

export const deleteAdminDocument = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/admin/documents/${id}/`);
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

export type ToolPayload = {
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  badge?: string;
  tutorial_url?: string;
  tutorial_title?: string;
};

export const createTool = async (data: ToolPayload): Promise<Tool> => {
  const res = await apiClient.post('/tools/', data);
  return res.data;
};

export const updateTool = async (id: string, data: Partial<ToolPayload>): Promise<Tool> => {
  const res = await apiClient.put(`/tools/${id}/`, data);
  return res.data;
};

export type NamingField = Pick<FormField, "id" | "name" | "type" | "currentValue" | "dependsOn"> & { options?: boolean };

/** The name a new document would get by default, e.g. "Jane Doe - USA Passport". */
export const suggestDocumentName = async (templateId: string, fields: NamingField[]): Promise<{ name: string }> => {
  const res = await apiClient.post('/purchased-templates/suggest-name/', { template: templateId, fields });
  return res.data;
};

export const addTemplatesToTool = async (
  toolId: string,
  templateIds: string[],
): Promise<{ moved: number; already_in_tool: number; templates_count: number }> => {
  const res = await apiClient.post(`/tools/${toolId}/add-templates/`, { template_ids: templateIds });
  return res.data;
};

// Countries templates are grouped under (alongside tools)
export const getCountries = async (): Promise<Country[]> => {
  const res = await apiClient.get('/countries/');
  return res.data;
};

export const getCountry = async (id: string): Promise<Country> => {
  const res = await apiClient.get(`/countries/${id}/`);
  return res.data;
};

export const createCountry = async (data: { code: string; name: string }): Promise<Country> => {
  const res = await apiClient.post('/countries/', data);
  return res.data;
};

export const deleteCountry = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/countries/${id}/`);
  return res.data;
};

export const addTemplatesToCountry = async (
  countryId: string,
  templateIds: string[],
): Promise<{ moved: number; already_in_country: number; templates_count: number }> => {
  const res = await apiClient.post(`/countries/${countryId}/add-templates/`, { template_ids: templateIds });
  return res.data;
};

export const removeTemplatesFromCountry = async (
  countryId: string,
  templateIds: string[],
): Promise<{ removed: number; templates_count: number }> => {
  const res = await apiClient.post(`/countries/${countryId}/remove-templates/`, { template_ids: templateIds });
  return res.data;
};

export const deleteTool = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/tools/${id}/`);
  return res.data;
};

export const removeBackground = async (image: File | string): Promise<{ success: boolean; image: string; message: string }> => {
  if (typeof image === 'string') {
    const res = await apiClient.post('/remove-background/', { image });
    return res.data;
  }
  const formData = new FormData();
  formData.append('image', image);

  const res = await apiClient.post('/remove-background/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getFonts = async (): Promise<Font[]> => {
  const res = await apiClient.get('/fonts/');
  return res.data;
};

export const addFont = async (data: FormData): Promise<Font> => {
  const res = await apiClient.post('/fonts/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteFont = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/fonts/${id}/`);
  return res.data;
};

export const updateFont = async (id: string, data: FormData): Promise<Font> => {
  const res = await apiClient.patch(`/fonts/${id}/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Tutorials API
export const getTutorials = async (toolId?: string, search?: string): Promise<Tutorial[]> => {
  const params = new URLSearchParams();
  if (toolId) params.append('tool', toolId);
  if (search) params.append('search', search);

  const queryString = params.toString();
  const res = await apiClient.get(`/tutorials/${queryString ? `?${queryString}` : ''}`);
  return res.data;
};

export const createTutorial = async (data: Partial<Tutorial>): Promise<Tutorial> => {
  const res = await apiClient.post('/tutorials/', data);
  return res.data;
};

export const updateTutorial = async (id: string, data: Partial<Tutorial>): Promise<Tutorial> => {
  const res = await apiClient.patch(`/tutorials/${id}/`, data);
  return res.data;
};

export const deleteTutorial = async (id: string): Promise<unknown> => {
  const res = await apiClient.delete(`/tutorials/${id}/`);
  return res.data;
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const res = await apiClient.get('/settings/');
  return res.data;
};

export const updateSiteSettings = async (data: Partial<SiteSettings> & { two_factor_code: string }): Promise<SiteSettings> => {
  const res = await apiClient.patch('/settings/1/', data);
  return res.data;
};

export const getApiAccessStatus = async (): Promise<ApiAccessStatus> => {
  const res = await apiClient.get('/api-access/');
  return res.data;
};

export const activateApiAccess = async (): Promise<ApiAccessStatus> => {
  const res = await apiClient.post('/api-access/activate/', {});
  return res.data;
};

export const updateApiConfiguration = async (data: {
  allowed_origins?: string[];
  theme?: Partial<ApiTheme>;
}): Promise<ApiAccessStatus['configuration']> => {
  const res = await apiClient.patch('/api-access/configuration/', data);
  return res.data;
};

export const createApiKey = async (data: {
  name: string;
  scopes?: string[];
  allowed_origins?: string[];
}): Promise<ApiKeyRecord> => {
  const res = await apiClient.post('/api-access/keys/', data);
  return res.data;
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await apiClient.delete(`/api-access/keys/${id}/`);
};

export const rotateApiKey = async (id: string): Promise<ApiKeyRecord> => {
  const res = await apiClient.post(`/api-access/keys/${id}/rotate/`, {});
  return res.data;
};

import type { TransformVariable } from "@/types";

export const getTransformVariables = async (): Promise<TransformVariable[]> => {
  const res = await apiClient.get('/transform-variables/');
  return res.data;
};

export const createTransformVariable = async (data: Partial<TransformVariable>): Promise<TransformVariable> => {
  const res = await apiClient.post('/transform-variables/', data);
  return res.data;
};

export const deleteTransformVariable = async (id: number): Promise<unknown> => {
  const res = await apiClient.delete(`/transform-variables/${id}/`);
  return res.data;
};
export const submitContactForm = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ message: string }> => {
  const res = await apiClient.post('/contact/', data);
  return res.data;
};

// Fernway Bank Simulator Management Endpoints
export interface FernwayTransaction {
  id: string;
  account_id: string;
  direction: 'credit' | 'debit';
  amount: number;
  fee: number;
  counterparty: string;
  counterparty_detail?: string;
  bank_name?: string;
  recipient_account_number?: string;
  recipient_routing_number?: string;
  narration?: string;
  category: string;
  channel: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  occurred_at: string;
  created_at: string;
}

export interface FernwayCard {
  id: string;
  label: string;
  kind: 'physical' | 'virtual';
  brand: 'visa' | 'mastercard';
  card_number: string;
  last4: string;
  expiry: string;
  cvv: string;
  pin?: string;
  holder_name: string;
  monthly_limit: number;
  is_frozen: boolean;
  online_payments: boolean;
  created_at: string;
}

export interface FernwayAccount {
  id: string;
  account_type: 'checking' | 'savings';
  name: string;
  account_number: string;
  routing_number: string;
  balance: number;
  apy_bps: number;
  transactions?: FernwayTransaction[];
  created_at: string;
}

export interface FernwayProfile {
  id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  email_verified?: boolean;
  email_verified_at?: string | null;
  credentials_email_sent_at?: string | null;
  credentials_email_sent?: boolean;
  credentials_email_error?: string;
  owner_email?: string;
  owner_email_verified?: boolean;
  phone: string;
  address: string;
  password: string;
  transaction_pin?: string;
  theme: string;
  auth_token: string;
  is_created?: boolean;
  is_test?: boolean;
  is_live?: boolean;
  subscription_status?: 'test' | 'active' | 'expired';
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  days_remaining?: number;
  needs_renewal_reminder?: boolean;
  tool_price?: number;
  monthly_price?: number;
  wallet_balance?: number;
  existing_accounts_count?: number;
  accounts: FernwayAccount[];
  cards: FernwayCard[];
  recent_transactions: FernwayTransaction[];
  pending_transfers?: FernwayTransaction[];
  pending_transfers_count?: number;
  total_balance: number;
  owner?: {
    id: number;
    username: string;
    email: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface FernwayAdminAccountsResponse {
  results: FernwayProfile[];
  count: number;
  monthly_price: number;
  online_banking_url?: string;
  stats: {
    total_accounts: number;
    live_accounts: number;
    test_accounts: number;
    expired_accounts: number;
    pending_transfers_total: number;
  };
}

export interface FernwayAccountsListResponse {
  results: FernwayProfile[];
  count: number;
  active_subscriptions_count: number;
  monthly_total_due: number;
  expiring_soon_count: number;
  expired_count: number;
  pending_transfers_total?: number;
  monthly_price: number;
  wallet_balance: number;
  online_banking_url?: string;
  owner_email?: string;
  owner_email_verified?: boolean;
}

export interface FernwayEmailVerificationChallenge {
  challenge_id: string;
  email_hint: string;
  expires_in: number;
}

export interface FernwayEmailVerificationGrant {
  verification_token: string;
  email: string;
}

export interface OwnerEmailVerificationRequestResponse {
  already_verified?: boolean;
  challenge_id?: string;
  email_hint?: string;
  expires_in?: number;
  owner_email?: string;
  owner_email_verified?: boolean;
}

export const requestOwnerEmailVerification = async (): Promise<OwnerEmailVerificationRequestResponse> => {
  const res = await apiClient.post('/accounts/email-verification/request/');
  return res.data;
};

export const confirmOwnerEmailVerification = async (data: {
  challenge_id: string;
  code: string;
}): Promise<{ owner_email: string; owner_email_verified: boolean }> => {
  const res = await apiClient.post('/accounts/email-verification/confirm/', data);
  return res.data;
};

export const requestFernwayEmailVerification = async (data: {
  email: string;
  profile_id?: string | null;
}): Promise<FernwayEmailVerificationChallenge> => {
  const res = await apiClient.post('/fernway/email-verification/request/', data);
  return res.data;
};

export const confirmFernwayEmailVerification = async (data: {
  challenge_id: string;
  code: string;
}): Promise<FernwayEmailVerificationGrant> => {
  const res = await apiClient.post('/fernway/email-verification/confirm/', data);
  return res.data;
};

export const getFernwayAccounts = async (): Promise<FernwayAccountsListResponse> => {
  const res = await apiClient.get('/fernway/accounts/');
  return res.data;
};

export const getFernwayAccountById = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.get(`/fernway/accounts/${profileId}/`);
  return res.data;
};

export const updateFernwayAccountById = async (
  profileId: string,
  data: Record<string, unknown>
): Promise<FernwayProfile> => {
  const res = await apiClient.put(`/fernway/accounts/${profileId}/`, data);
  return res.data;
};

export interface FernwaySendCredentialsResponse {
  sent: boolean;
  recipient: string;
  credentials_email_sent_at: string | null;
  profile: FernwayProfile;
}

export const sendFernwayCredentialsEmail = async (
  profileId: string
): Promise<FernwaySendCredentialsResponse> => {
  const res = await apiClient.post(`/fernway/accounts/${profileId}/send-credentials/`);
  return res.data;
};

export const sendAdminFernwayCredentialsEmail = async (
  profileId: string
): Promise<FernwaySendCredentialsResponse> => {
  const res = await apiClient.post(`/fernway/admin/accounts/${profileId}/send-credentials/`);
  return res.data;
};

export const deleteFernwayAccount = async (profileId: string): Promise<unknown> => {
  const res = await apiClient.delete(`/fernway/accounts/${profileId}/`);
  return res.data;
};

export const upgradeFernwayAccountById = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.post(`/fernway/accounts/${profileId}/upgrade/`);
  return res.data;
};

export const renewFernwayAccount = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.post(`/fernway/accounts/${profileId}/renew/`);
  return res.data;
};

export const resetFernwayAccountById = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.post(`/fernway/accounts/${profileId}/reset/`);
  return res.data;
};

export const createFernwayAccountTransaction = async (
  profileId: string,
  data: {
    account_id?: string;
    direction: 'credit' | 'debit';
    amount: number;
    counterparty: string;
    bank_name?: string;
    recipient_account_number?: string;
    recipient_routing_number?: string;
    narration?: string;
    category?: string;
    channel?: string;
    occurred_at?: string;
    adjust_balance?: boolean;
  }
): Promise<FernwayTransaction> => {
  const res = await apiClient.post(`/fernway/accounts/${profileId}/transaction/`, data);
  return res.data;
};

export const deleteFernwayAccountTransaction = async (
  profileId: string,
  transactionId: string
): Promise<unknown> => {
  const res = await apiClient.delete(`/fernway/accounts/${profileId}/transaction/${transactionId}/`);
  return res.data;
};

export const approveFernwayTransfer = async (
  profileId: string,
  transactionId: string
): Promise<FernwayProfile> => {
  const res = await apiClient.post(
    `/fernway/accounts/${profileId}/transaction/${transactionId}/approve/`
  );
  return res.data;
};

export const declineFernwayTransfer = async (
  profileId: string,
  transactionId: string
): Promise<FernwayProfile> => {
  const res = await apiClient.post(
    `/fernway/accounts/${profileId}/transaction/${transactionId}/decline/`
  );
  return res.data;
};

export const getFernwayProfile = async (): Promise<FernwayProfile> => {
  const res = await apiClient.get('/fernway/manage/');
  return res.data;
};

export const updateFernwayProfile = async (data: Partial<FernwayProfile>): Promise<FernwayProfile> => {
  const res = await apiClient.put('/fernway/manage/', data);
  return res.data;
};

export const updateFernwayAccount = async (
  accountId: string,
  data: Partial<FernwayAccount>
): Promise<FernwayAccount> => {
  const res = await apiClient.put(`/fernway/manage/account/${accountId}/`, data);
  return res.data;
};

export const createFernwayTransaction = async (data: {
  account_id?: string;
  direction: 'credit' | 'debit';
  amount: number;
  counterparty: string;
  narration?: string;
  category?: string;
  channel?: string;
  occurred_at?: string;
  adjust_balance?: boolean;
}): Promise<FernwayTransaction> => {
  const res = await apiClient.post('/fernway/manage/transaction/', data);
  return res.data;
};

export const deleteFernwayTransaction = async (transactionId: string): Promise<unknown> => {
  const res = await apiClient.delete(`/fernway/manage/transaction/${transactionId}/`);
  return res.data;
};

export const updateFernwayCard = async (
  cardId: string,
  data: Partial<FernwayCard>
): Promise<FernwayCard> => {
  const res = await apiClient.put(`/fernway/manage/card/${cardId}/`, data);
  return res.data;
};

export const resetFernwayProfile = async (): Promise<FernwayProfile> => {
  const res = await apiClient.post('/fernway/manage/reset/');
  return res.data;
};

export const createFernwayAccount = async (data: Record<string, unknown>): Promise<FernwayProfile> => {
  const res = await apiClient.post('/fernway/accounts/', data);
  return res.data;
};

export const upgradeFernwayAccount = async (): Promise<FernwayProfile> => {
  const res = await apiClient.post('/fernway/manage/upgrade/');
  return res.data;
};

// SharpToolz Admin Fernway Management Endpoints
export const getAdminFernwaySettings = async (): Promise<{ online_banking_url: string }> => {
  const res = await apiClient.get('/fernway/admin/settings/');
  return res.data;
};

export const updateAdminFernwaySettings = async (
  online_banking_url: string,
): Promise<{ online_banking_url: string }> => {
  const res = await apiClient.patch('/fernway/admin/settings/', { online_banking_url });
  return res.data;
};

export const getAdminFernwayAccounts = async (params?: {
  search?: string;
  status?: 'all' | 'active' | 'test' | 'expired' | 'pending_transfers';
  include_drafts?: boolean;
}): Promise<FernwayAdminAccountsResponse> => {
  const res = await apiClient.get('/fernway/admin/accounts/', { params });
  return res.data;
};

export const getAdminFernwayAccountById = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.get(`/fernway/admin/accounts/${profileId}/`);
  return res.data;
};

export const updateAdminFernwayAccount = async (
  profileId: string,
  data: Record<string, unknown>
): Promise<FernwayProfile> => {
  const res = await apiClient.put(`/fernway/admin/accounts/${profileId}/`, data);
  return res.data;
};

export const deleteAdminFernwayAccount = async (profileId: string): Promise<unknown> => {
  const res = await apiClient.delete(`/fernway/admin/accounts/${profileId}/`);
  return res.data;
};

export const updateAdminFernwaySubscription = async (
  profileId: string,
  action: 'activate' | 'extend' | 'set_test' | 'expire',
  days = 30
): Promise<FernwayProfile> => {
  const res = await apiClient.post(`/fernway/admin/accounts/${profileId}/subscription/`, {
    action,
    days,
  });
  return res.data;
};

export const resetAdminFernwayAccount = async (profileId: string): Promise<FernwayProfile> => {
  const res = await apiClient.post(`/fernway/admin/accounts/${profileId}/reset/`);
  return res.data;
};

export const createAdminFernwayTransaction = async (
  profileId: string,
  data: {
    account_id?: string;
    direction: 'credit' | 'debit';
    amount: number;
    counterparty: string;
    bank_name?: string;
    recipient_account_number?: string;
    recipient_routing_number?: string;
    narration?: string;
    category?: string;
    channel?: string;
    occurred_at?: string;
    adjust_balance?: boolean;
  }
): Promise<FernwayTransaction> => {
  const res = await apiClient.post(`/fernway/admin/accounts/${profileId}/transaction/`, data);
  return res.data;
};

export const deleteAdminFernwayTransaction = async (
  profileId: string,
  transactionId: string
): Promise<unknown> => {
  const res = await apiClient.delete(`/fernway/admin/accounts/${profileId}/transaction/${transactionId}/`);
  return res.data;
};

export const approveAdminFernwayTransfer = async (
  profileId: string,
  transactionId: string
): Promise<FernwayProfile> => {
  const res = await apiClient.post(
    `/fernway/admin/accounts/${profileId}/transaction/${transactionId}/approve/`
  );
  return res.data;
};

export const declineAdminFernwayTransfer = async (
  profileId: string,
  transactionId: string
): Promise<FernwayProfile> => {
  const res = await apiClient.post(
    `/fernway/admin/accounts/${profileId}/transaction/${transactionId}/decline/`
  );
  return res.data;
};
