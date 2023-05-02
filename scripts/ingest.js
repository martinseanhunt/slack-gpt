import * as dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';
import { PuppeteerWebBaseLoader } from 'langchain/document_loaders/web/puppeteer';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const BASE_URL = 'https://js.langchain.com/docs/';

// Load content recursively from a URL and its subpages
async function loadRecursively(url, visited = new Set()) {
  if (visited.has(url)) return [];
  visited.add(url);

  console.log('Loading: ', url);

  try {
    // Configure the document loader
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
      async evaluate(page, browser) {
        // Extract content from divs with the class '.markdown'
        const content = await page.evaluate(() =>
          Array.from(document.querySelectorAll('.markdown')).map(
            (div) => div.innerHTML
          )
        );

        // Join the content (if there are multiple markdown sections) and return
        return NodeHtmlMarkdown.translate(content.join(''));
      },
    });

    // Load content from the current URL
    const doc = await loader.load();

    // Add the current document to a documents array
    const documents = [doc[0]];

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Get all links on the page
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((link) => link.href)
    );

    // Filter links to only subpages and exclude '#' and '/api/'
    const subpageLinks = links.filter(
      (link) =>
        link.startsWith(BASE_URL) &&
        !link.includes('#') &&
        !link.includes('/api/')
    );

    await browser.close();

    // Load content from subpages recursively
    for (const link of subpageLinks) {
      if (visited.has(link)) continue;
      const subDocuments = await loadRecursively(link, visited);
      documents.push(...subDocuments);
    }

    return documents.length > 1 ? documents : doc;
  } catch (error) {
    console.error('Error loading content:', error);
    return [];
  }
}

try {
  // Load the docs
  console.log('loading docs');
  const docs = await loadRecursively(BASE_URL);
  console.log(docs);

  // chunk the docs based on markdown sections
  console.log('Chunking docs');
  const splitter = new MarkdownTextSplitter();
  const output = await splitter.splitDocuments(docs);
  console.log(output);

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  // delete any old entries
  await index.delete1({
    deleteAll: true,
    namespace: process.env.PINECONE_NAME_SPACE,
  });

  //embed the PDF documents
  await PineconeStore.fromDocuments(output, new OpenAIEmbeddings(), {
    pineconeIndex: index,
    namespace: process.env.PINECONE_NAME_SPACE,
    textKey: 'text',
  });

  console.log('finished');
} catch (error) {
  console.error(error);
}
