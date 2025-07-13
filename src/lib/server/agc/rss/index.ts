import { fetchBingNews } from './bing';
import { fetchGoogleNews } from './google';
import { fetchGuardianNews } from './theguardian';

type NewsApis = 'google' | 'bing' | 'theguardian';

interface NewsFeedOptions {
	fetch: App.Fetch;
	newsApi: NewsApis;
	lang?: App.Lang;
	query?: string;
	length?: number;
}

export class NewsFeed {
	#fetch: App.Fetch;
	#newsApi: NewsApis;
	#lang: App.Lang;
	#length: number;
	#query: string;
	#providers: Record<NewsApis, App.NewsProviderFn>;

	constructor({ fetch, newsApi, lang = 'en', query = '', length }: NewsFeedOptions) {
		this.#fetch = fetch;
		this.#newsApi = newsApi;
		this.#lang = lang;
		this.#length = length || 1;
		this.#query = query;
		this.#providers = {
			google: fetchGoogleNews,
			bing: fetchBingNews,
			theguardian: fetchGuardianNews
		};
	}

	async fetchRssFeeds(): Promise<App.ArticleContents[] | null> {
		const provider = this.#providers[this.#newsApi];
		const fetch = this.#fetch;
		const lang = this.#lang;
		const query = this.#query;
		const length = this.#length;
		return provider?.({ fetch, lang, query, length }) ?? null;
	}
}
