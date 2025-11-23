// src/services/config.ts

export const getApiKey = (): string => {
  // In a real application, you would fetch this from a secure location.
  // For this example, we'll pass it as a command-line argument.
  const apiKey = (window as any).__API_KEY__;
  if (!apiKey) {
    throw new Error("API_KEY is not defined");
  }
  return apiKey;
};
