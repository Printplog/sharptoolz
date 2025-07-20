
export type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  total_purchases: number;
  downloads: number;
  wallet_balance: string;
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
}

export type RegisterPayload = {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'checkbox' 
  | 'date' 
  | 'upload' 
  | 'number' 
  | 'email' 
  | 'tel' 
  | 'url' 
  | 'password' 
  | 'range' 
  | 'color'
  | 'file';

// Select field options (auto-generated from .select_X elements)
export interface SelectOption {
  value: string;                 // The text content from SVG element
  label: string;                 // Same as value or formatted
  svgElementId: string;          // Full SVG element ID
}

export interface FormField {
  id: string;                    // Base field ID (e.g., "Product_Name", "Gender")
  name: string;                  // Display name (e.g., "Product Name", "Gender")
  type: string;               // Field type extracted from extension
  svgElementId?: string;   
  defaultValue?: string | number | boolean;
  currentValue?: string | number | boolean;
  max?: number;                  // Max value for number OR max length for text
  options?: SelectOption[];      // If options exist, it's automatically a select field
  dependsOn?: string;
}

export type Template = {
  id?: string;
  name: string;
  svg: string;
  form_fields: FormField[]
  type: "tool";
  hot: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateDocument = {
  tracking_id: string;
  svg: string;
}


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
}

export type Transaction = {
  id: string;
  tx_id: string;
  type: 'deposit' | 'payment';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
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
  type: 'pdf' | 'png';
}