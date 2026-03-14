import { betterAuth } from "better-auth";

// Configure Better Auth with proper validation and security settings
export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: process.env.DATABASE_URL || "./db.sqlite",
  },
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development",
  baseEndpoint: "/api/betterauth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    password: {
      // Configure password strength requirements
      minLength: 6,
      requireNumbers: false,
      requireSymbols: false,
      requireLowercase: false,
      requireUppercase: false,
    },
  },
  socialProviders: {
    // Add social providers here if needed
  },
  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session age every 24 hours
  },
  // Account configuration
  account: {
    accountModel: {
      createEnabled: true,
    },
  },
  // Hooks for customizing behavior
  hooks: {
    afterUserCreated: [
      // Perform actions after user creation
      async (ctx) => {
        console.log(`New user created: ${ctx.user.email}`);
        // Add any custom logic here (e.g., sending welcome emails)
      }
    ]
  },
  // Custom error messages
  plugins: [],
});