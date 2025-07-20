import RSSParser from 'rss-parser';
import { getArticleContents } from '../helper';

const resolveURL = (url: string): string | null => {
	try {
		const bingURL = new URL(url);
		const newsUrl = bingURL.searchParams.get('url');
		if (!(newsUrl && newsUrl.startsWith('http'))) return null;
		return newsUrl;
	} catch (e) {
		console.error('Invalid URL', { cause: e });
		return null;
	}
};

export const fetchBingNews: App.NewsProviderFn = async ({ lang, query, length }) => {
	const bingRSS = `https://www.bing.com/news/search?q=${query || 'cook'}&format=RSS&&setlang=${lang || 'en'}`;
	const parser = new RSSParser();
	const parsedRSS = await parser.parseURL(bingRSS);
	const contents = [];

	for (let i = 0; i < parsedRSS.items.length; i++) {
		if (contents.length >= length) break; // pick only 5 items
		const { link, pubDate } = parsedRSS.items[i];
		if (!link) continue; // move to the next item if has no article links
		const parsedUrl = resolveURL(link);
		if (!parsedUrl) continue; // move to the next item if URL is invalid
		const content = await getArticleContents(parsedUrl);
		if (!content) continue; // move to the next item if can't get article contents
		contents.push({ ...content, pubDate });
	}

	return contents;
};
