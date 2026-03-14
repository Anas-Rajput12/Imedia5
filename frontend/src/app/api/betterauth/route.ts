import { auth } from "@/lib/auth-config";
import { nextJSAdapter } from "better-auth/next-js";

// Create the API handler for Better Auth
const handler = nextJSAdapter(auth);

export { handler as GET, handler as POST };