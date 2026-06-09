export interface ProviderConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export function loadConfigFromEnv(): ProviderConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || undefined,
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4o-mini",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "300", 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7")
  };
}
