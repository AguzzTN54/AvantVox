import RSSParser from 'rss-parser';
import { getArticleContents } from '../helper';

export const fetchBingNews: App.NewsProviderFn = async ({ fetch, lang, query }) => {
	const bingRSS = `https://www.bing.com/news/search?q=${query || 'the'}&format=RSS&&setlang=${lang || 'en'}`;
	const parser = new RSSParser();
	const parsedRSS = await parser.parseURL(bingRSS);
	const contents = [];

	for (let i = 0; i < parsedRSS.items.length; i++) {
		if (contents.length >= 1) break; // pick only 5 items
		const { link, pubDate } = parsedRSS.items[i];
		if (!link) continue; // move to the next item if has no article links
		const content = await getArticleContents(fetch, link);
		if (!content) continue; // move to the next item if can't get article contents
		contents.push({ ...content, pubDate });
	}

	return contents;
};
