declare global {
	namespace App {
		type Fetch = typeof globalThis.fetch;
		type Lang = 'en' | 'id';
		type BasicArticle = { title: string; content: string; tags?: string[] };
		interface LLMProvider {
			rephrase(articles: BasicArticle[]): Promise<BasicArticle[]>;
		}
		interface ArticleContents extends BasicArticle {
			textContent?: string;
			thumbnail: string;
			source: { url: string; siteName: string };
			pubDate?: Date | string;
		}

		interface NewsProviderOptions {
			lang: Lang;
			length: number;
			query: string;
		}
		type NewsProviderFn = (opt: NewsProviderOptions) => Promise<App.ArticleContents[] | null>;
	}
}

export {};
