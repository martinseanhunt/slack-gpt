import puppeteer from 'puppeteer';
import { PuppeteerWebBaseLoader } from 'langchain/document_loaders/web/puppeteer';
import { NodeHtmlMarkdown } from 'node-html-markdown';

// Extract links from the given page
async function getLinksFromPage(url) {
  // Open the page in puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Get all links on the page and filter them
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map((link) => link.href)
  );

  // close puppeteer
  await browser.close();

  // filter out unwanted links and return
  return links.filter(
    (link) =>
      link.startsWith(url) && !link.includes('#') && !link.includes('/api/')
  );
}

// Load a single page and extract content
async function loadPageContent(url) {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: 'domcontentloaded',
    },
    async evaluate(page, browser) {
      const content = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.markdown')).map(
          (div) => div.innerHTML
        )
      );

      // Convert the returned HTML to Markdown, join it if there
      // are multiple elements, and return
      return NodeHtmlMarkdown.translate(content.join(''));
    },
  });

  return loader.load();
}

export async function recursiveWebLoader(
  url,
  visited = new Set(),
  documents = []
) {
  if (visited.has(url)) return documents;
  visited.add(url);

  console.log('Loading: ', url);

  try {
    // Load content from the current URL
    const doc = await loadPageContent(url);
    documents.push(doc[0]);

    // Get links from the current page
    const subpageLinks = await getLinksFromPage(url);

    // Process subpage links and add the content to the documents array
    for (const link of subpageLinks) {
      if (visited.has(link)) continue;
      await recursiveWebLoader(link, visited, documents);
    }

    return documents;
  } catch (error) {
    console.error('Error loading content:', error);
    return documents;
  }
}
