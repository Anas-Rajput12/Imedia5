import { auth } from "@/lib/auth-config";
import { NextJSAdapter } from "better-auth/next-js"; // updated

const handler = NextJSAdapter(auth);

export { handler as GET, handler as POST };
