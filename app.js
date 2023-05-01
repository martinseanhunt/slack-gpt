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
        text: 'Processing your request...',
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

      // Get a response from the LLM
      const response = await getLLMResponse(event.text);

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
