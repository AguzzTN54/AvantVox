import { fetchBingNews } from './bing';
import { fetchGoogleNews } from './google';
import { fetchNewsNow } from './newsnow';
import { fetchGuardianNews } from './theguardian';

type NewsApis = 'google' | 'bing' | 'theguardian' | 'newsnow';

interface NewsFeedOptions {
	newsApi: NewsApis;
	lang?: App.Lang;
	query?: string;
	length?: number;
}

export class NewsFeed {
	#newsApi: NewsApis;
	#lang: App.Lang;
	#length: number;
	#query: string;
	#providers: Record<NewsApis, App.NewsProviderFn>;

	constructor({ newsApi, lang = 'en', query = '', length }: NewsFeedOptions) {
		this.#newsApi = newsApi;
		this.#lang = lang;
		this.#length = length || 1;
		this.#query = query;
		this.#providers = {
			google: fetchGoogleNews,
			bing: fetchBingNews,
			theguardian: fetchGuardianNews,
			newsnow: fetchNewsNow
		};
	}

	async fetchRssFeeds(): Promise<App.ArticleContents[] | null> {
		const provider = this.#providers[this.#newsApi];
		const lang = this.#lang;
		const query = this.#query;
		const length = this.#length;
		return provider?.({ lang, query, length }) ?? null;
	}
}
