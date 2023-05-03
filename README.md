# Slack-GPT

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Creating and installing the application](#creating-and-installing-the-application)
4. [Configuration](#configuration)
5. [Starting the app](#starting-the-app)
6. [Next Steps](#next-steps)
7. [Sample Implementations](#sample-implementations)
8. [TODO's](#todo)

## Introduction

A simple starter for a Slack app / chatbot that uses the Bolt.js Slack app framework, Langchain, openAI and a Pinecone vectorstore to provide LLM generated answers to user questions based on a custom data set.

## Prerequisites

You'll need an existing pinecone index with your data stored as embeddings. An example of how to do this will be added to this repository in soon.

## Creating and installing the application

1. **Step 1**: Log in to your slack account and visit: https://api.slack.com/apps
2. **Step 2**: Click the "Create New App" button and choose to create the app "from manifest"
3. **Step 3**: Choose the slack workspace to which you want to add the chat bot
4. **Step 4**: Paste in the following manifest and edit the name of your app accordingly

```display_information:
  name: [YOUR_APP_NAME_HERE]
features:
  bot_user:
    display_name: [YOUR_APP_DISPLAY_NAME_HERE]
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - chat:write.customize
      - im:history
      - im:write
      - app_mentions:read
      - im:read
settings:
  event_subscriptions:
    bot_events:
      - app_mention
      - message.im
  interactivity:
    is_enabled: true
  org_deploy_enabled: false
  socket_mode_enabled: true
  token_rotation_enabled: false
```

5. **Step 5**: Click next and then click the button confirming the creation of your app
6. **Step 6**: Navigate to the "basic information" page and click the "generate token and scopes" button under the app level tokens section
7. **Step 7**: Create a token called Websockets and add the "connections:write" scope, copy your token and keep it somewhere safe
8. **Step 8**: Navigate to "app home" and check the box "Allow users to send Slash commands and messages from the messages tab"
9. **Step 9**: Navigate to the "Oauth and permissions" page and click the "install to workspace" button, then click to allow the installation and nececarry permissions. You should now see your Application in your apps list when opening your slack workspace

## Configuration

1. **Step 1**: Create a .env file in the root of your project and copy the .env.sample contents in to the new file
2. **Step 2**: Add your websockets app level token we created earlier to the SLACK_APP_TOKEN variable
3. **Step 3**: Head back to "Oath and permissions" and copy the "Bot User OAuth Token", and add it to the SLACK_BOT_TOKEN variable
4. **Step 4**: Head to "Basic information" and copy your "Signing Secret" and save it to the SLACK_SIGNING_SECRET variable
5. **Step 5**: Fill out your openai and pinecone related environment variables (Again, you'll need to have set up a pinecone index with your data embeddings)

## Starting the app

1. **Step 1**: Navigate to your application roon and run `npm start`
   You should now see that the bolt app is running and that your application has made a successful connection to slack
1. **Step 2**: Navigate to your slack workspace and try sending your new bot a DM!

## Next steps

- Try editing the prompts for your use case which can be found in `/config/prompts.js`
- Set up a production employment and start your bot on a server somewhere other than your local machine - https://render.com/ is a good, simple option for this.

## Sample implementations

1. [**HR assistant**](https://github.com/martinseanhunt/slack-gpt-hr-bot): A helpful slack bot that ingests data from a companies confluence space to provide HR assistance, includes full ingestsion pipeline.

## TODO

- Document deployment process
- Investigate implementing response streaming
- Better loading state
