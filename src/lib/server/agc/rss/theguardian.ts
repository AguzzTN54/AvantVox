import { env } from '$env/dynamic/private';

interface GuardianArticleField {
	headline: string;
	main: string;
	thumbnail: string;
	body: string;
}

interface GuardianArticle {
	id: string;
	type: string;
	sectionId: string;
	sectionName: string;
	webPublicationDate: Date | string;
	webTitle: string;
	webUrl: string;
	apiUrl: string;
	isHosted: boolean;
	pillarId: string;
	pillarName: string;
	fields?: Partial<GuardianArticleField>;
}

interface GuardianResponse {
	status: string;
	userTier: string;
	total: number;
	startIndex: number;
	pageSize: number;
	currentPage: number;
	pages: number;
	orderBy: 'newest' | 'relevance' | 'oldest';
	results: GuardianArticle[];
}

interface GuardianResult {
	response: GuardianResponse;
}

export const fetchGuardianNews: App.NewsProviderFn = async ({ fetch, query, length }) => {
	try {
		const encodedQuery = encodeURIComponent(query.trim());
		const url = new URL('https://content.guardianapis.com/search');
		url.searchParams.append('api-key', env.PRIVATE_THEGUARDIAN_KEY);
		url.searchParams.append('tag', 'world/world');
		url.searchParams.append('show-fields', 'main,headline,body,thumbnail');
		if (encodedQuery) url.searchParams.append('q', encodedQuery);

		const res = await fetch(url);
		const { response }: GuardianResult = (await res.json()) || {};
		if (!response) return null;
		const contents: App.ArticleContents[] = [];

		for (let i = 0; i < response.results.length; i++) {
			if (contents.length >= length) break; // pick only 5 items
			const { webPublicationDate: pubDate, fields, webUrl, webTitle: title } = response.results[i];
			if (!webUrl || webUrl.match(/\/live\//)) continue; // move to the next item if has no article links
			const content = fields?.body || '';
			if (!content) continue;
			const source = { url: webUrl, siteName: 'The Guardian' };
			contents.push({ pubDate, content, source, title });
		}
		return contents;
	} catch (e) {
		console.error('Failed to process TheGuardian News', { cause: e });
		return null;
	}
};
