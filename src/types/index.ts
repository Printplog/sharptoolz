export type User = {
  pk: number;
  username: string;
  email: string;
  role?: string;
  total_purchases: number;
  downloads: number;
  wallet_balance: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (userData: User) => void;
  logout: () => void;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export type FieldType =
  | "text"
  | "textarea"
  | "checkbox"
  | "date"
  | "upload"
  | "number"
  | "email"
  | "tel"
  | "url"
  | "password"
  | "range"
  | "color"
  | "file";

// Select field options (auto-generated from .select_X elements)
export interface SelectOption {
  value: string; // The text content from SVG element
  label: string; // Same as value or formatted
  svgElementId: string; // Full SVG element ID
}

export interface FormField {
  id: string; // Base field ID (e.g., "Product_Name", "Gender")
  name: string; // Display name (e.g., "Product Name", "Gender")
  type: string; // Field type extracted from extension
  svgElementId?: string;
  defaultValue?: string | number | boolean;
  currentValue?: string | number | boolean;
  max?: number; // Max value for number OR max length for text
  options?: SelectOption[]; // If options exist, it's automatically a select field
  dependsOn?: string;
}

export type Template = {
  id?: string;
  name: string;
  svg: string;
  form_fields: FormField[];
  type: "tool";
  hot: boolean;
  created_at: string;
  updated_at: string;
  banner: string;
};

export type CreateDocument = {
  tracking_id: string;
  svg: string;
};

export type PurchasedTemplate = {
  id: string; // UUID
  buyer: number;
  template: string;
  name: string;

  svg: string;
  form_fields: FormField[]; // adjust type if fields are structured
  test: boolean;
  error_message: string | null; // Error message if any, null if no error

  tracking_id: string | null;
  status: string;

  created_at: string; // ISO datetime string
  updated_at: string;
};

export type CryptoPaymentData = {
  tx_id: string;
  ticker: string;
  amount: number;
  payment_address: string;
};

export type Transaction = {
  id: string;
  tx_id: string;
  type: "deposit" | "payment";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  tx_hash: string;
  address: string;
  created_at: string;
};

export type WalletData = {
  id: string;
  balance: number;
  transactions: Transaction[];
};

export type DownloadData = {
  svg: string;
  type: "pdf" | "png";
};

export type AdminOverview = {
  total_users: number;
  total_templates: number;
  total_purchased_docs: number;
  total_downloads: number;
  total_wallet_balance: number;
};

export type AdminUsers = {
  all_users: number;
  new_users: {
    today: number;
    past_7_days: number;
    past_14_days: number;
    past_30_days: number;
  };
  total_purchases_users: {
    today: number;
    past_7_days: number;
    past_14_days: number;
    past_30_days: number;
  };
  users: {
    results: User[]; // Replace 'any' with a User type/interface if available
    count: number;
    next: string | null;
    previous: string | null;
    current_page: number;
    total_pages: number;
  };
};

export type AdminUserDetails = {
  user: User;
  purchase_history: Array<{
    id: string;
    template_name: string;
    name: string;
    test: boolean;
    status: string;
    tracking_id: string;
    created_at: string;
    updated_at: string;
  }>;
  transaction_history: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    tx_id: string;
    address: string;
    created_at: string;
  }>;
  stats: {
    total_purchases: number;
    paid_purchases: number;
    test_purchases: number;
    total_downloads: number;
    days_since_joined: number;
  };
};
