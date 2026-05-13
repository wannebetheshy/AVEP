import type { Session, User } from "../domain/types";
import { MOCK_DELAY_MS } from "./constants";
import { logEvents } from "./logEvents";
import { logger } from "./logger";
import { addUser, generateId, getUsers, sleep } from "./inMemoryStore";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "./storage";

const buildSession = (user: User): Session => ({
  token: `token_${user.id}`,
  user,
});

export const readSession = () => getStoredSession();

export const loginUser = async (identity: string, password: string) => {
  await sleep(MOCK_DELAY_MS);

  const trimmedIdentity = identity.trim();
  logger.info(logEvents.authLoginAttempt, { identity: trimmedIdentity });
  logger.debug(logEvents.authLoginCredentials, {
    identity: trimmedIdentity,
    password,
  });
  const userRecord = getUsers().find(
    (user) =>
      user.username === trimmedIdentity ||
      user.email === trimmedIdentity,
  );

  if (!userRecord || userRecord.password !== password) {
    logger.warn(logEvents.authLoginFailed, { identity: trimmedIdentity });
    throw new Error("Invalid credentials");
  }

  if (userRecord.role !== "user") {
    logger.warn(logEvents.authLoginRoleMismatch, { identity: trimmedIdentity });
    throw new Error("Use admin login for administrative access");
  }

  const session = buildSession(userRecord);
  setStoredSession(session);
  logger.info(logEvents.authLoginSuccess, { userId: userRecord.id });
  return session;
};

export const registerUser = async (
  email: string,
  username: string,
  password: string,
) => {
  await sleep(MOCK_DELAY_MS);

  const trimmedEmail = email.trim();
  const trimmedUsername = username.trim();
  logger.info(logEvents.authRegisterAttempt, {
    email: trimmedEmail,
    username: trimmedUsername,
  });
  logger.debug(logEvents.authRegisterCredentials, {
    email: trimmedEmail,
    username: trimmedUsername,
    password,
  });

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const alreadyExists = getUsers().some(
    (user) => user.email === trimmedEmail || user.username === trimmedUsername,
  );

  if (alreadyExists) {
    logger.warn(logEvents.authRegisterDuplicate, {
      email: trimmedEmail,
      username: trimmedUsername,
    });
    throw new Error("User already exists");
  }

  const user: User = {
    id: generateId(),
    username: trimmedUsername,
    email: trimmedEmail,
    role: "user",
  };

  addUser({ ...user, password });

  const session = buildSession(user);
  setStoredSession(session);
  logger.info(logEvents.authRegisterSuccess, { userId: user.id });
  return session;
};

export const loginAdmin = async (username: string, password: string) => {
  await sleep(MOCK_DELAY_MS);

  const trimmedUsername = username.trim();
  logger.info(logEvents.authAdminLoginAttempt, { username: trimmedUsername });
  logger.debug(logEvents.authAdminLoginCredentials, {
    username: trimmedUsername,
    password,
  });
  const adminRecord = getUsers().find(
    (user) => user.role === "admin" && user.username === trimmedUsername,
  );

  if (!adminRecord || adminRecord.password !== password) {
    logger.warn(logEvents.authAdminLoginFailed, { username: trimmedUsername });
    throw new Error("Invalid admin credentials");
  }

  const session = buildSession(adminRecord);
  setStoredSession(session);
  logger.info(logEvents.authAdminLoginSuccess, { userId: adminRecord.id });
  return session;
};

export const logoutUser = async () => {
  await sleep(MOCK_DELAY_MS);
  clearStoredSession();
  logger.info(logEvents.authLogout);
};
