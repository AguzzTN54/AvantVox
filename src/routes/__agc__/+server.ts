import { json } from '@sveltejs/kit';
import { rephrase } from '$lib/server/agc/helper';
import { NewsFeed } from '$lib/server/agc/rss';

export const GET = async () => {
	try {
		const newsFeed = new NewsFeed({ newsApi: 'theguardian', length: 2, query: 'lemper' });
		const contents = (await newsFeed.fetchRssFeeds()) || [];
		console.log('✅ Fetching Articles Done..');
		const rephrased = await rephrase(contents);
		console.log('🎉 All Task Finished\n');

		return json({ msg: 'success', contents: rephrased });
	} catch {
		return json({ msg: 'Internal Server Error' }, { status: 500 });
	}
};
