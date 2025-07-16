import RSSParser from 'rss-parser';
import { getArticleContents, client } from '../helper';

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

const fetchArticleUrl = async (payload: { 'f.req': string }): Promise<string | null> => {
	try {
		console.log('🔗 Resolving Article URL');
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			Referer: 'https://news.google.com/',
			Origin: 'https://news.google.com'
		};
		const url = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
		const response = await client.fetch(url, {
			headers,
			method: 'POST',
			body: new URLSearchParams(payload).toString()
		});

		const rawText = await response.text();
		const arrayString = JSON.parse(rawText.replace(")]}'", ''))[0][2];
		const articleUrl = JSON.parse(arrayString)[1];
		if (!isValidUrl(articleUrl)) return null;
		return articleUrl;
	} catch (e) {
		console.error('Failed to Parse Article URL', { cause: e });
		return null;
	}
};

const fetchGnewsArticle = async (link: string): Promise<App.ArticleContents | null> => {
	try {
		console.log('📰 Fetching GNews Server');

		const res = await client.fetch(link);
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
		const articleUrl = await fetchArticleUrl(payload);
		if (!articleUrl) return null;
		const content = await getArticleContents(articleUrl);
		return content;
	} catch (e) {
		console.error(e);
		return null;
	}
};

export const fetchGoogleNews: App.NewsProviderFn = async ({ lang, query, length }) => {
	const url = getRssUrl(query, lang);

	const res = await client.fetch(url);
	const xml = await res.text();

	const parser = new RSSParser();
	const parsedRSS = await parser.parseString(xml);
	const contents = [];

	for (let i = 0; i < parsedRSS.items.length; i++) {
		if (contents.length >= length) break; // pick only 5 items
		const { link, pubDate } = parsedRSS.items[i];
		if (!link) continue; // move to the next item if has no article links
		const content = await fetchGnewsArticle(link);
		if (!content) continue; // move to the next item if can't get article contents
		contents.push({ ...content, pubDate });
	}

	return contents;
};
