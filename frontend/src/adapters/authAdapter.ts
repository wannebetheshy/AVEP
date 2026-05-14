import type { Session, User } from "../domain/types";
import { API_ENDPOINTS, ApiClient } from "./apiClient";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

const buildSession = (data: {
  token: string;
  user: User;
}): Session => ({
  token: data.token,
  user: data.user,
});

export const readSession = async (): Promise<Session | null> => {
  const token = ApiClient.getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await ApiClient.post<{
      status: string;
      valid: boolean;
      user: User;
    }>(API_ENDPOINTS.verify, {});

    if (!response.valid) {
      ApiClient.clearToken();
      return null;
    }

    return buildSession({ token, user: response.user });
  } catch {
    ApiClient.clearToken();
    return null;
  }
};

export const loginUser = async (
  identity: string,
  password: string,
): Promise<Session> => {
  logger.info(logEvents.authLoginAttempt, { identity });

  const response = await ApiClient.post<{
    status: string;
    token: string;
    user: User;
  }>(API_ENDPOINTS.login, {
    login: identity,
    password,
  });

  ApiClient.setToken(response.token);
  logger.info(logEvents.authLoginSuccess, { userId: response.user.id });

  return buildSession({
    token: response.token,
    user: response.user,
  });
};

export const registerUser = async (
  email: string,
  username: string,
  password: string,
): Promise<Session> => {
  logger.info(logEvents.authRegisterAttempt, { email, username });

  const response = await ApiClient.post<{
    status: string;
    token: string;
    user: User;
  }>(API_ENDPOINTS.register, {
    username,
    email,
    password,
  });

  ApiClient.setToken(response.token);
  logger.info(logEvents.authRegisterSuccess, { userId: response.user.id });

  return buildSession({
    token: response.token,
    user: response.user,
  });
};

export const loginAdmin = async (
  username: string,
  password: string,
): Promise<Session> => {
  logger.info(logEvents.authAdminLoginAttempt, { username });

  const response = await ApiClient.post<{
    status: string;
    token: string;
    user: User;
  }>(API_ENDPOINTS.adminLogin, {
    username,
    password,
  });

  ApiClient.setToken(response.token);
  logger.info(logEvents.authAdminLoginSuccess, { userId: response.user.id });

  return buildSession({
    token: response.token,
    user: response.user,
  });
};

export const logoutUser = async (): Promise<void> => {
  try {
    await ApiClient.post(API_ENDPOINTS.logout);
  } catch {
    // Logout endpoint may not exist yet, but we still clear the token
  }

  ApiClient.clearToken();
  logger.info(logEvents.authLogout);
};
