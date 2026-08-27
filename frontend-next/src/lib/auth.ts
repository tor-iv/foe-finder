import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/db";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@foefinder.me";

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  // Resend's SDK resolves { data, error } instead of throwing on API failures,
  // so the error must be checked explicitly or sends fail with no trace.
  // Throwing here is safe: signup/reset paths run this in background (better-auth
  // swallows and logs), while the manual resend endpoint propagates it to the UI.
  const { data, error } = await resend.emails.send({ from: fromEmail, ...params });
  if (error) {
    console.error(
      `[email] FAILED "${params.subject}" to ${params.to}: ${error.name} - ${error.message}`
    );
    throw new Error(`Email delivery failed: ${error.message}`);
  }
  console.log(`[email] sent "${params.subject}" to ${params.to} (id: ${data?.id})`);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  baseURL: appUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [appUrl()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your FoeFinder password",
        html: `<p>Someone requested a password reset for your FoeFinder account.</p><p><a href="${url}">Reset your password</a></p><p>If this wasn't you, ignore this email.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your FoeFinder account",
        html: `<p>Welcome to FoeFinder. Confirm your email to find your nemesis.</p><p><a href="${url}">Verify your email</a></p>`,
      });
    },
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      hasCompletedQuestionnaire: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      marketingConsent: {
        type: "boolean",
        defaultValue: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (adminEmails().includes(user.email.toLowerCase())) {
            return { data: { ...user, isAdmin: true } };
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [twoFactor({ issuer: "FoeFinder" })],
  rateLimit: {
    // Dev/tests hammer get-session (parallel Playwright workers) — prod only
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 20,
  },
});
