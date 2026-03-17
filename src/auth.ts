import NextAuth from "next-auth";
import type { NextAuthResult } from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";

let _instance: NextAuthResult | null = null;

function getInstance(): NextAuthResult {
  if (!_instance) {
    _instance = NextAuth({
      adapter: DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      providers: [Google],
      pages: {
        signIn: "/sign-in",
      },
      callbacks: {
        session({ session, user }) {
          session.user.id = user.id;
          return session;
        },
      },
    });
  }
  return _instance;
}

export const handlers: NextAuthResult["handlers"] = {
  GET: (req) => getInstance().handlers.GET(req),
  POST: (req) => getInstance().handlers.POST(req),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = ((...args: any[]) => (getInstance().auth as any)(...args)) as NextAuthResult["auth"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn = ((...args: any[]) => (getInstance().signIn as any)(...args)) as NextAuthResult["signIn"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut = ((...args: any[]) => (getInstance().signOut as any)(...args)) as NextAuthResult["signOut"];
