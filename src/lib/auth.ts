import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ENTRY_CONFIG } from "@/entry.config";

export const AUTH_COOKIE_NAME = "gemini_admin_session";

function getSecretKey(): Uint8Array {
  const secret = ENTRY_CONFIG.JWT_SECRET || "default-secret-key-please-change-in-production-min32";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string): Promise<string> {
  const secretKey = getSecretKey();
  const token = await new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  return token;
}

export async function verifySessionToken(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      username: (payload.username as string) || "admin",
      role: (payload.role as string) || "admin",
    };
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, pass: string): boolean {
  const expectedUser = ENTRY_CONFIG.ADMIN_USERNAME;
  const expectedPass = ENTRY_CONFIG.ADMIN_PASSWORD;

  return username === expectedUser && pass === expectedPass;
}

export async function getSession(): Promise<{ username: string; role: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
