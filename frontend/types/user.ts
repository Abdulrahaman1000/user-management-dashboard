// types/user.ts
export interface User {
  _id: string;
  email: string;
  role?: string;
  name?: string;
  profilePhoto?: string;
}

export interface ApiResponse {
  users?: User[];
  data?: User[];
  pages?: number;
  totalCount?: number;
}

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}