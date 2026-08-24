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
  try {
    await resend.emails.send({ from: fromEmail, ...params });
  } catch (error) {
    // Don't fail the auth request just because email delivery hiccuped —
    // log it so it's visible in server logs, but let signup/reset proceed.
    console.error(`Failed to send email "${params.subject}" to ${params.to}:`, error);
  }
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
    enabled: true,
    window: 60,
    max: 20,
  },
});
