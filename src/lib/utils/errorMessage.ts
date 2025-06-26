interface ApiError extends Error {
  response?: {
    data:
      | {
          detail?: string;
          message?: string;
          error?: string;
          email?: string;
          username?: string;
          password?: string;
          tracking_id?: string;
        }
      | string
      | string[]
      | Record<string, string[]>;
  };
}

export default function errorMessage(error: ApiError): string {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data[0];
  }

  if (typeof data === "object" && data !== null) {
    return (
      data.detail ??
      data.message ??
      data.error ??
      data.email ??
      data.username ??
      data.password ??
      (data.tracking_id && "Generate a new tracking id") ??
      // Try to grab first error from any key like { field: ["some error"] }
      Object.values(data)[0]?.[0] ??
      error.message
    );
  }

  return error.message;
}
