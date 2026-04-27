export const API_KEY_STORAGE = "attack_anthropic_api_key";

export function getStoredApiKey() {
  try { return localStorage.getItem(API_KEY_STORAGE) || ""; } catch { return ""; }
}

export function setStoredApiKey(key) {
  try { localStorage.setItem(API_KEY_STORAGE, key.trim()); } catch {}
}

export async function callAnthropicAPI(body) {
  const apiKey = getStoredApiKey();
  if (apiKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }
  // Fallback: dev proxy (uses VITE_ANTHROPIC_API_KEY from .env)
  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  return res.json();
}
