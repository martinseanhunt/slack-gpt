import * as dotenv from 'dotenv';
dotenv.config();
import bolt from '@slack/bolt';
const { App } = bolt;

import { getLLMResponse } from './lib/getLLMResponse.js';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.event('message', async ({ event, client }) => {
  try {
    // Check if the message is from a direct message channel
    if (event.channel_type === 'im' && event.text) {
      // Send a loading message
      const loadingMessageResponse = await client.chat.postMessage({
        channel: event.channel,
        text: 'Thinking...',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Thinking... :thinking_face:',
            },
          },
        ],
      });

      // Fetch the last 6 messages in the conversation history
      const historyResult = await client.conversations.history({
        channel: event.channel,
        latest: event.ts, // Fetch history up to the current message timestamp
        inclusive: false, // Exclude the current message from the history
        limit: 6, // Limit the number of messages fetched
      });

      // Create a new array of QUESTION, RESPONSE strings to pass to the LLM
      const formattedHistory = historyResult.messages
        .map((message) => {
          const messageType =
            message.user === event.user ? 'USER MESSAGE' : 'SYSTEM RESPONSE';
          return `${messageType}:${message.text}`;
        })
        .reverse();

      // Get a response from the LLM
      const response = await getLLMResponse(event.text, formattedHistory);

      // TODO: Investigate streaming a response

      // Update the loading message with the chat function's response
      await client.chat.update({
        channel: event.channel,
        ts: loadingMessageResponse.ts,
        text: response.text,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: response.text,
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
