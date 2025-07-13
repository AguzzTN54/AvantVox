import { rephrase } from '$lib/server/agc/helper';
import { NewsFeed } from '$lib/server/agc/rss';
import { json } from '@sveltejs/kit';

export const GET = async ({ fetch }) => {
	try {
		const newsFeed = new NewsFeed({ fetch, newsApi: 'bing', length: 2, query: 'crypto' });
		const contents = (await newsFeed.fetchRssFeeds()) || [];
		console.log('✅ Fetching Articles Done..');
		const rephrased = await rephrase(contents);
		console.log('🎉 All Task Finished\n');

		return json({ msg: 'success', contents: rephrased });
	} catch {
		return json({ msg: 'Internal Server Error' }, { status: 500 });
	}
};
