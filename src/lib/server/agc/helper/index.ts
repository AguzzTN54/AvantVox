import { env } from '$env/dynamic/private';
import { Impit } from 'impit';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { LLM } from '../llm';

const originalConsoleError = console.error;
console.error = (msg, ...args) => {
	if (typeof msg === 'string' && msg.includes('Could not parse CSS stylesheet')) {
		return; // ignore this error
	}
	originalConsoleError(msg, ...args);
};

export const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

export const client = new Impit({
	browser: 'chrome',
	http3: true,
	ignoreTlsErrors: true,
	timeout: 1000 * 60 * 2 // 2 minutes
});

export const getArticleContents = async (link: string): Promise<App.ArticleContents | null> => {
	try {
		console.log(`🔁 Fetching ${link}`);
		const res = await client.fetch(link);
		const newshtml = await res.text();
		const { window } = new JSDOM(newshtml, { url: link, pretendToBeVisual: true, userAgent });
		const purify = DOMPurify(window);
		purify.setConfig({
			ALLOWED_TAGS: ['img', 'p', 'span', 'i', 'u', 'ul', 'ol', 'li', 'blockquote'],
			ALLOWED_ATTR: ['src', 'alt', 'title', 'width', 'height']
		});

		const reader = new Readability(window.document);
		const { content, siteName, title, textContent } = reader.parse() || {};
		const cleanContent = purify.sanitize(content || '').replace(/\s+/g, ' ');
		const cleanText = (textContent || '').replace(/\s+/g, ' ').trim();
		if (!content || !cleanText || !(siteName && title)) return null;
		const source = { url: link, siteName };
		console.log(`✨ Article from [${siteName}] is Fetched\n`);
		return { title, source, content: cleanContent, textContent: cleanText };
	} catch {
		return null;
	}
};

export const rephrase = async (articles: App.ArticleContents[]): Promise<App.ArticleContents[]> => {
	if (articles.length < 1) {
		console.log('❌ No Articles to Rephrase');
		return [];
	}

	console.log('⏳ Rephrase in process');

	const llmBody = articles.map(({ content, title }) => ({ title, content }));
	const llm = new LLM({
		model: 'gemini',
		apiKeys: { gemini: env.PRIVATE_GEMINI_KEY }
	});

	const llmResult = await llm.rephrase(llmBody);
	const result = articles.map(({ pubDate, source }, i) => {
		const { content, title, tags } = llmResult[i];
		return { title, pubDate, tags, source, content };
	});

	return result;
};
