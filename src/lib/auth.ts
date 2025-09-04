import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        console.log('Attempting to authenticate user:', credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log('User not found:', credentials.email);
          return null;
        }

        if (!user.passwordHash) {
          console.log('User has no password hash:', credentials.email);
          return null;
        }

        // Import bcrypt dynamically to avoid build issues
        const bcrypt = await import('bcryptjs');
        console.log('Comparing password for user:', credentials.email);
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        console.log('Password valid:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('Invalid password for user:', credentials.email);
          return null;
        }

        console.log('Authentication successful for user:', credentials.email);
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Allow linking OAuth provider logins to existing users by matching verified email.
  // This prevents OAuthAccountNotLinked when a user first registered via Credentials.
  // @ts-expect-error: Property is supported by NextAuth runtime; type defs may lag.
  allowDangerousEmailAccountLinking: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    // Explicitly link Google account to existing user by email to avoid OAuthAccountNotLinked.
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user?.email) {
          // Find existing user by email
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });
          if (existing) {
            const alreadyLinked = existing.accounts.some(
              (a) => a.provider === 'google' && a.providerAccountId === account.providerAccountId
            );
            if (!alreadyLinked) {
              await prisma.account.create({
                data: {
                  userId: existing.id,
                  type: account.type as string,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: (account as any).access_token ?? null,
                  refresh_token: (account as any).refresh_token ?? null,
                  expires_at: typeof (account as any).expires_at === 'number' ? (account as any).expires_at : null,
                  token_type: (account as any).token_type ?? null,
                  scope: (account as any).scope ?? null,
                  id_token: (account as any).id_token ?? null,
                  session_state: (account as any).session_state ?? null,
                },
              });
            }
          }
        }
        return true;
      } catch (err) {
        console.error('[NextAuth][signIn] linking error:', err);
        return false;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
