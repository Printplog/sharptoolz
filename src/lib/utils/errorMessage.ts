interface ApiError extends Error {
  response?: {
    data: {
      detail: string;
      email: string;
      username: string;
      password: string;
      message: string;
      error: string;
    };
  };
}

export default function errorMessage(error: ApiError) {
  return (
    error.response?.data.detail ??
    error.response?.data.message ??
    error.response?.data.error ??
    error.response?.data.email ??
    error.response?.data.password ??
    error.response?.data.password ??
    error.response?.data.username ??
    error.message
  );
}