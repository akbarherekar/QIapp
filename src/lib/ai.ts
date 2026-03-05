import Anthropic from "@anthropic-ai/sdk"

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic }

function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn(
      "[AI] ANTHROPIC_API_KEY is not set. AI features (inbox processing, meeting notes) will fail."
    )
  }
  return new Anthropic({ apiKey })
}

export const anthropic =
  globalForAnthropic.anthropic || createAnthropicClient()

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic
