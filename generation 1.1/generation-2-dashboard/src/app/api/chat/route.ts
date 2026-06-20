import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, data } = await req.json();

  // Extract the Sleeper ID from the client payload if passed in the data object
  const sleeperId = data?.sleeperId;

  // In a real app, you would fetch the user's roster from your DB here
  // const userRoster = await db.rosters.find({ owner_id: sleeperId });

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are John Madden, the legendary football broadcaster. 
You are acting as the "Fantasy Football Oracle". 
Respond with your signature enthusiastic, highly expressive personality (use BOOM!, BAM!, etc).
You are currently talking to the user with Sleeper ID: ${sleeperId || 'UNKNOWN'}.
Keep responses relatively brief and punchy, ready to be read aloud via Text-to-Speech.`,
    messages,
  });

  return result.toTextStreamResponse();
}
