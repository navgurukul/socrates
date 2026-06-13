import Ably from "ably";
import { getCurrentUser } from "@/lib/auth/get-user";

// Issues a short-lived Ably token to authenticated clients so the secret API
// key never reaches the browser. The Ably Realtime client points its authUrl
// here (see hooks/useVersusChannel.ts).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Ably not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Ably.Rest(apiKey);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: user.id,
  });

  return Response.json(tokenRequest);
}
