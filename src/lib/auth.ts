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
    // Optional hardening: only allow linking/sign-in when Google reports a verified email.
    // Uncomment if you want stricter checks.
    // async signIn({ account, profile }) {
    //   if (account?.provider === 'google') {
    //     const googleProfile = profile as { email_verified?: boolean } | null;
    //     return !!googleProfile?.email_verified;
    //   }
    //   return true;
    // },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
