import { getArticleContents, rephrase } from '$lib/server/agc';
import { json } from '@sveltejs/kit';
import RSSParser from 'rss-parser';

// const googleRSS = 'https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id';
const bingRSS = 'https://www.bing.com/news/search?q=the&format=RSS';
const parser = new RSSParser();
export const GET = async ({ fetch }) => {
	try {
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

		console.log('Fetching Articles Done..');
		const rephrased = await rephrase(contents);
		// console.log(rephrased);

		return json({ msg: 'success', contents: rephrased });
	} catch {
		return json({ msg: 'Internal Server Error' }, { status: 500 });
	}
};
