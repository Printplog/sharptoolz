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

export interface AuthDialogProps {
  dialog?: boolean;
}

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
  displayText?: string; // Original text content from SVG element (preserves case)
}

export interface FormField {
  id: string; // Base field ID (e.g., "Product_Name", "Gender")
  name: string; // Display name (e.g., "Product Name", "Gender")
  type: string; // Field type extracted from extension
  svgElementId?: string;
  defaultValue?: string | number | boolean;
  currentValue?: string | number | boolean | null;
  max?: number; // Max value for number OR max length for text
  options?: SelectOption[]; // If options exist, it's automatically a select field
  dependsOn?: string; // Field dependency with optional extraction (e.g., "field_name[w1]", "field[ch1-4]")
  link?: string; // Link property for fields like Tracking_ID
  isTrackingId?: boolean; // Flag to identify tracking ID fields
  trackingRole?: string; // Role in tracking display (e.g., "name", "email", "weight")
  dateFormat?: string; // Date format string (e.g., "MM/DD/YYYY", "MMM DD", "MMMM D, YYYY")
  generationRule?: string; // Generation rule (e.g., "(rn[12])", "FL(rn[6])(rc[6])")
  maxGeneration?: string; // Max padding generation (e.g., "(A[10])")
  generationMode?: string; // Generation mode: "auto" for auto-generation, undefined for manual
  helperText?: string; // Contextual help text for the field (from data-helper attribute)
  aspectRatio?: number; // For image crop fields (width/height ratio)
  minWidth?: number; // Minimum width for image crop
  minHeight?: number; // Minimum height for image crop
  signatureWidth?: number; // Width for signature canvas
  signatureHeight?: number; // Height for signature canvas
  signatureBackground?: string; // Background color for signature canvas
  signaturePenColor?: string; // Pen color for signature drawing
  editable?: boolean; // Whether field remains editable after purchase (default: false)
  requiresGrayscale?: boolean; // Whether uploaded images should be forced to grayscale
  grayscaleIntensity?: number; // Grayscale intensity percentage (0-100)
  touched?: boolean; // Frontend-only flag to know if user modified the field
  rotation?: number; // Rotation in degrees for image fields (applied via transform)
} // Updated for signature fields, date formatting, generation/extraction, and helper text

export type FieldUpdate = {
  id: string;
  value?: string | number | boolean | null | Record<string, unknown>;
};

export type Tool = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Tutorial = {
  id: string;
  template: string;
  template_name?: string;
  template_tool?: string;
  template_tool_name?: string;
  url: string;
  title?: string;
  created_at: string;
  updated_at: string;
};

export type Font = {
  id: string;
  name: string;
  font_file?: string;
  font_url?: string;
  created_at: string;
};

export type Template = {
  id?: string;
  name: string;
  svg: string;
  form_fields: FormField[];
  type: "tool";
  tool?: string;
  hot: boolean;
  category?: string; // Category ID
  tutorial?: Tutorial;
  tutorial_url?: string;
  tutorial_title?: string;
  keywords: string[];
  fonts?: Font[];
  font_ids?: string[];
  created_at: string;
  updated_at: string;
  banner: string;
};

export type TemplateUpdatePayload = {
  name: string;
  svg: string;
  banner?: File | null;
  hot?: boolean;
  tool?: string;
  tutorialUrl?: string;
  tutorialTitle?: string;
  keywords?: string[];
  fontIds?: string[];
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
  link: string;   
  keywords: string[];
  fonts?: Font[];
  font_ids?: string[];
  banner?: string;
  field_updates?: FieldUpdate[];

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
  svg?: string; // Optional - backend will fetch from purchased_template_id if not provided
  type: "pdf" | "png";
  purchased_template_id: string; // Required - backend fetches SVG from this
  template_name?: string;
  side?: "front" | "back"; // For split downloads: which side to download
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

export interface DocSection {
  id: string;          // Unique identifier for the section
  title: string;       // Section title
  content: string;     // Markdown content
  codeExamples?: {     // Optional code examples
    title: string;     // Example title
    code: string;      // Code snippet (just the ID pattern)
    description?: string; // Optional description
  }[];
  subsections?: DocSection[]; // Nested subsections
  visualPreview?: {    // Optional visual preview component
    type: 'tracking-site';
    site: 'parcelfinda' | 'myflightlookup';
  };
}

export type SiteSettings = {
  crypto_address: string;
  whatsapp_number: string;
  manual_purchase_text: string;
  updated_at: string;
};
