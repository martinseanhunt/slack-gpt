import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

import { QA_PROMPT, CONDENSE_PROMPT } from '../config/prompts.js';

export const getLLMResponse = async (question, history) => {
  // Sanitise the question - OpenAI reccomends replacing newlines with spaces
  question = question.trim().replace('\n', ' ');

  // Inntialise pinecone client
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  // Set Pinecone index name
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  // Set up index
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    {
      pineconeIndex: pineconeIndex,
      textKey: 'text',
      namespace: process.env.PINECONE_NAME_SPACE,
    }
  );

  // Initialise the model
  const model = new OpenAI({
    temperature: 0,
    maxTokens: 2500,
    modelName: 'gpt-3.5-turbo',
    cache: true,
  });

  // Set up the chain
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(5),
    {
      returnSourceDocuments: true,
      questionGeneratorTemplate: CONDENSE_PROMPT,
      qaTemplate: QA_PROMPT,
    }
  );

  // Call the chain, pass the question and chat history
  const response = await chain.call({
    question,
    chat_history: [], // temporarily disable chat history
  });

  return response;
};
