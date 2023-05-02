import * as dotenv from 'dotenv';
dotenv.config();
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

import { recursiveWebLoader } from '../utils/recursiveWebLoader.js';

try {
  // Load the docs
  console.log('loading docs');
  const docs = await recursiveWebLoader('https://js.langchain.com/docs/');

  // chunk the docs based on markdown sections
  console.log('Chunking docs');
  const splitter = new MarkdownTextSplitter();
  const output = await splitter.splitDocuments(docs);

  // Initialise pinecone client and index
  console.log('Initialising pinecone');
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  // Get information on the namespace from pinecone
  console.log('Getting namespace info');
  const stats = await index.describeIndexStats({
    describeIndexStatsRequest: {},
  });

  // delete any old entries already attached to the namespace
  // if it already exists
  if (stats?.namespaces[process.env.PINECONE_NAME_SPACE]) {
    console.log('namespace exists, deleting old vectors');

    await index.delete1({
      deleteAll: true,
      namespace: process.env.PINECONE_NAME_SPACE,
    });
  }

  //embed the PDF documents
  console.log('Embedding docs and storing in pinecone');
  await PineconeStore.fromDocuments(output, new OpenAIEmbeddings(), {
    pineconeIndex: index,
    namespace: process.env.PINECONE_NAME_SPACE,
    textKey: 'text',
  });

  console.log('finished');
} catch (error) {
  console.error(error);
}
