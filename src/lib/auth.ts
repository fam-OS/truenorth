import { AuthOptions } from "next-auth";
import { randomUUID } from "crypto";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Derive MFA status from DB on each JWT refresh
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { mfaEnforced: true, otpCode: true, otpExpiresAt: true },
          });
          const needsOtp = dbUser?.mfaEnforced && Boolean(dbUser?.otpCode) && (!!dbUser?.otpExpiresAt && dbUser.otpExpiresAt > new Date());
          (token as any).mfaVerified = dbUser ? !needsOtp : false;
        } catch (e) {
          (token as any).mfaVerified = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session as any).mfaVerified = (token as any).mfaVerified ?? false;
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
          });
          if (existing) {
            // Check if this Google account is already linked for this user
            const linked = await prisma.account.findFirst({
              where: {
                userId: existing.id,
                provider: 'google',
                providerAccountId: account.providerAccountId,
              },
            });
            const alreadyLinked = Boolean(linked);
            if (!alreadyLinked) {
              await prisma.account.create({
                data: {
                  id: randomUUID(),
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

        // For credentials logins, issue OTP if enforced and not currently valid
        if (account?.provider === 'credentials' && user?.id && user?.email) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser?.mfaEnforced) {
            // Generate a 6-digit OTP and expiry (10 minutes)
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000);
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { otpCode: code, otpExpiresAt: expires },
            });
            try {
              await sendEmail({
                to: user.email,
                subject: 'Your TrueNorth verification code',
                text: `Your verification code is ${code}. It expires in 10 minutes.`,
                html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`,
              });
              if (process.env.NODE_ENV !== 'production') {
                console.log('[MFA][EmailOTP][DEV] Code for', user.email, 'is', code);
              }
              console.log('[MFA][EmailOTP] Sent code to', user.email);
            } catch (mailErr) {
              console.error('[MFA][EmailOTP] Failed to send code:', mailErr);
              // Fail sign-in if we enforce OTP but cannot send mail
              return false;
            }
          }
        }
        return true;
      } catch (err) {
        console.error('[NextAuth][signIn] linking error:', err);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Force credentials users with pending OTP to /auth/mfa
      // We cannot access token here, so allow frontend guard; keep default behavior
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
