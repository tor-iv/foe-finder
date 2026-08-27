import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// No baseURL: requests go to the same origin the app is served from
// (/api/auth/*), so the same client build works pre- and post-DNS-cutover.
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  twoFactor,
} = authClient;
