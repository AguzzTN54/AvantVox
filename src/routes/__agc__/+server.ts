import { json } from '@sveltejs/kit';
import { rephrase } from '$lib/server/agc/helper';
import { NewsFeed } from '$lib/server/agc/news';

export const GET = async () => {
	try {
		const newsFeed = new NewsFeed({ newsApi: 'google', length: 2 });
		const contents = (await newsFeed.fetchRssFeeds()) || [];
		console.log('✅ Fetching Articles Done..');
		const rephrased = await rephrase(contents);
		console.log('🎉 All Task Finished\n');

		return json({ msg: 'success', contents: rephrased });
	} catch {
		return json({ msg: 'Internal Server Error' }, { status: 500 });
	}
};
