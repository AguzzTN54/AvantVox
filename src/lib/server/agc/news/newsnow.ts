import { JSDOM } from 'jsdom';
import { client, getArticleContents, userAgent } from '../helper';

const getListUrl = (query: string): string => {
	if (!query) return `https://www.newsnow.co.uk/h/World+News?type=ln`;
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.newsnow.co.uk/h/?search=${encodedQuery}&lang=en&searchheadlines=1`;
	return url;
};

const getPubDate = (timestamp: string) => {
	try {
		const unixTimestamp = parseInt(timestamp, 10);
		const date = new Date(unixTimestamp * 1000);
		const utcString = date.toUTCString();
		return utcString;
	} catch {
		const date = new Date();
		const utcString = date.toUTCString();
		return utcString;
	}
};

type ParsedArticle = { url: string; title: string; pubDate: string };
const htmlParser = (html: string, url: string): ParsedArticle[] => {
	const { window } = new JSDOM(html || '', { url });
	const domArticles = window.document.querySelectorAll('article');
	const articles: ParsedArticle[] = [];
	domArticles.forEach((article) => {
		const url = article.querySelector('a')?.getAttribute('href') || '';
		const title = article.querySelector('.article-title')?.textContent?.trim() || '';
		const time = article.querySelector('span[data-timestamp]');
		const timestamp = time?.getAttribute('data-timestamp') || '';
		const pubDate = getPubDate(timestamp);
		articles.push({ url, title, pubDate });
	});
	return articles;
};

const resolveURL = async (url: string): Promise<string | null> => {
	console.log('🔗 Resolving Article URL');
	const res = await client.fetch(url);
	const html = await res.text();
	const { window } = new JSDOM(html, { url, userAgent });
	const link = window.document.querySelector('.continue-button')?.getAttribute('href');
	return link || null;
};

export const fetchNewsNow: App.NewsProviderFn = async ({ query, length }) => {
	const url = getListUrl(query);
	const res = await client.fetch(url);
	const html = await res.text();
	const parsed = htmlParser(html, url);
	const contents = [];

	for (let i = 0; i < parsed.length; i++) {
		if (contents.length >= length) break; // pick only 5 items
		const { pubDate, url } = parsed[i];
		if (!url) continue; // move to the next item if has no article links
		const parsedUrl = await resolveURL(url);
		if (!parsedUrl || parsedUrl.match(/nzherald.co.nz/)) continue; // move to the next item if has no article links or is a live link
		const content = await getArticleContents(parsedUrl);
		if (!content) continue; // move to the next item if can't get article contents
		contents.push({ ...content, pubDate });
	}
	return contents;
};
