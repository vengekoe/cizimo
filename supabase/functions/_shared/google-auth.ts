// Google Service Account Authentication Helper
// Uses service account JSON to generate OAuth2 access tokens for Gemini API

import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

// Convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create JWT for service account authentication
async function createJwt(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/generative-language",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: exp,
  };

  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  
  const encodedHeader = arrayBufferToBase64Url(headerBytes.buffer as ArrayBuffer);
  const encodedPayload = arrayBufferToBase64Url(payloadBytes.buffer as ArrayBuffer);

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Parse the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  // Import the private key
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = arrayBufferToBase64Url(signature);

  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from service account
export async function getAccessToken(): Promise<string | null> {
  try {
    // Check if we have a valid cached token
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
      return cachedToken.token;
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.log("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
      return null;
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);

    // Create JWT
    const jwt = await createJwt(serviceAccount);

    // Exchange JWT for access token
    const tokenResponse = await fetch(serviceAccount.token_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      return null;
    }

    const tokenData: TokenResponse = await tokenResponse.json();

    // Cache the token
    cachedToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    console.log("Successfully obtained access token from service account");
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// Call Gemini API with service account authentication
export async function callGeminiWithServiceAccount(
  model: string,
  contents: any,
  generationConfig?: any
): Promise<Response> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error("Failed to get access token from service account");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  const body: any = { contents };
  if (generationConfig) {
    body.generationConfig = generationConfig;
  }

  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
