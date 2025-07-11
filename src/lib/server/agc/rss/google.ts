import RSSParser from 'rss-parser';
import { getArticleContents } from '../helper';

const isValidUrl = (url: string): boolean => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

const getRssUrl = (query: string, lang?: App.Lang): string => {
	if (!query) return `https://news.google.com/rss?hl=${lang || 'en'}`;
	const encodedQuery = encodeURIComponent(query);
	const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${lang || 'en'}`;
	return url;
};

const fetchArticleUrl = async (
	fetch: App.Fetch,
	payload: { 'f.req': string }
): Promise<string | null> => {
	try {
		console.log('🔗 Resolving Article Url');
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
		};

		const response = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
			method: 'POST',
			headers,
			body: new URLSearchParams(payload).toString()
		});

		const rawText = await response.text();
		const arrayString = JSON.parse(rawText.replace(")]}'", ''))[0][2];
		const articleUrl = JSON.parse(arrayString)[1];
		if (!isValidUrl(articleUrl)) return null;
		return articleUrl;
	} catch (e) {
		console.error('Failed to Fetch Article Url', { cause: e });
		return null;
	}
};

const fetchGnewsArticle = async (
	fetch: App.Fetch,
	link: string
): Promise<App.ArticleContents | null> => {
	try {
		console.log('📰 Fetching GNews Server');

		const res = await fetch(link, { redirect: 'follow' });
		const gnews = await res.text();
		const [, cwizStart] = gnews.split('<c-wiz');
		const [cwizEnd] = cwizStart.split('</c-wiz');
		const [, dataStart] = cwizEnd.split('data-p="');
		const [data] = dataStart.split('"');
		const decoded = data.replace('%.@.', '["garturlreq",').replace(/&quot;/g, '"');
		const obj = JSON.parse(decoded);

		const payload = {
			'f.req': JSON.stringify([
				[['Fbv4je', JSON.stringify([...obj.slice(0, -6), ...obj.slice(-2)]), 'null', 'generic']]
			])
		};
		const articleUrl = await fetchArticleUrl(fetch, payload);
		if (!articleUrl) return null;

		const content = await getArticleContents(fetch, articleUrl);
		return content;
	} catch (e) {
		console.error(e);
		return null;
	}
};

export const fetchGoogleNews: App.NewsProviderFn = async ({ lang, query }) => {
	const url = getRssUrl(query, lang);
	const parser = new RSSParser();
	const parsedRSS = await parser.parseURL(url);
	const contents = [];

	for (let i = 0; i < parsedRSS.items.length; i++) {
		if (contents.length >= 1) break; // pick only 5 items
		const { link, pubDate } = parsedRSS.items[i];
		if (!link) continue; // move to the next item if has no article links
		const content = await fetchGnewsArticle(fetch, link);
		if (!content) continue; // move to the next item if can't get article contents
		contents.push({ ...content, pubDate });
	}

	return contents;
};
