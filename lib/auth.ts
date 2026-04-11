import { headers } from "next/headers";
import { createAuthInstance } from "@/lib/auth-config";

export const auth = createAuthInstance();

export async function getServerSession() {
  const requestHeaders = await headers();
  return auth.api.getSession({
    headers: requestHeaders,
  });
}
