export interface CurrentUser {
  id: string;
  name: string;
  account: string;
  tenantId: string;
  tenantName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  account: string;
  password: string;
  tenantCode?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: CurrentUser;
}
