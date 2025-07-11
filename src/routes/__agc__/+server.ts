import { rephrase } from '$lib/server/agc/helper';
import { NewsFeed } from '$lib/server/agc/rss/index.js';
import { json } from '@sveltejs/kit';

// const googleRSS = 'https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id';

export const GET = async ({ fetch }) => {
	try {
		const newsFeed = new NewsFeed({ fetch, newsApi: 'google' });
		const contents = (await newsFeed.fetchRssFeeds()) || [];
		console.log('Fetching Articles Done..');
		const rephrased = await rephrase(contents);
		console.log(rephrased);

		return json({ msg: 'success', contents: rephrased });
	} catch {
		return json({ msg: 'Internal Server Error' }, { status: 500 });
	}
};
