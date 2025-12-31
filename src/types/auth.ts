export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string; 
}

export interface LoginCredentials {
  password: string;
  phoneNumber: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  email: string;
  role: string;
}