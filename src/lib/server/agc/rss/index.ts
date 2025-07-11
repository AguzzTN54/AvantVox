import { fetchBingNews } from './bing';
import { fetchGoogleNews } from './google';

type NewsApis = 'google' | 'bing';

interface NewsFeedOptions {
	fetch: App.Fetch;
	newsApi: NewsApis;
	lang?: App.Lang;
	query?: string;
}

export class NewsFeed {
	#fetch: App.Fetch;
	#newsApi: NewsApis;
	#lang: App.Lang;
	#query: string;
	#providers: Record<NewsApis, App.NewsProviderFn>;

	constructor({ fetch, newsApi, lang = 'en', query = '' }: NewsFeedOptions) {
		this.#fetch = fetch;
		this.#newsApi = newsApi;
		this.#lang = lang;
		this.#query = query;
		this.#providers = {
			google: fetchGoogleNews,
			bing: fetchBingNews
		};
	}

	async fetchRssFeeds(): Promise<App.ArticleContents[] | null> {
		const provider = this.#providers[this.#newsApi];
		const fetch = this.#fetch;
		const lang = this.#lang;
		const query = this.#query;
		return provider?.({ fetch, lang, query }) ?? null;
	}
}
