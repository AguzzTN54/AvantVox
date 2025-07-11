import { env } from '$env/dynamic/private';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { LLM } from './llm';

const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0';

export const getArticleContents = async (
	fetch: typeof globalThis.fetch,
	link: string
): Promise<App.ArticleContents | null> => {
	try {
		const res = await fetch(link, {
			redirect: 'manual',
			headers: {
				'Accept-Language': 'en-US,en;q=0.9',
				'User-Agent': userAgent
			}
		});
		const location = res.headers.get('location');
		if (res.status >= 300 && res.status < 400 && location) {
			console.log(`🔁 Redirecting to: ${location}`);
			return getArticleContents(fetch, location);
		}

		const newshtml = await res.text();
		const { window } = new JSDOM(newshtml, { url: link, pretendToBeVisual: true, userAgent });
		const purify = DOMPurify(window);
		purify.setConfig({
			ALLOWED_TAGS: ['img', 'p', 'span', 'i', 'u', 'ul', 'ol', 'li', 'blockquote'],
			ALLOWED_ATTR: ['src', 'alt', 'title', 'width', 'height']
		});

		const reader = new Readability(window.document);
		const { content, siteName, title, textContent } = reader.parse() || {};
		const cleanContent = purify.sanitize(content || '');
		if (!content || !textContent || !(siteName && title)) return null;
		const source = { url: link, siteName };
		console.log('Article Fetched\n');
		return { content: cleanContent, textContent, title, source };
	} catch {
		return null;
	}
};

export const rephrase = async (articles: App.ArticleContents[]): Promise<App.ArticleContents[]> => {
	const result = articles.map(async ({ content, title, source, pubDate }) => {
		const llm = new LLM({
			model: 'gemini',
			apiKeys: { gemini: env.PRIVATE_GEMINI_KEY }
		});

		const result = await llm.rephrase({ title, content });
		return { ...result, pubDate, source };
	});

	return await Promise.all(result);
};
