// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		type BasicArticle = { title: string; content: string };
		interface LLMProvider {
			rephrase(input: { title: string; content: string }): Promise<BasicArticle>;
		}
		interface ArticleContents extends BasicArticle {
			textContent?: string;
			source: { url: string; siteName: string };
			pubDate?: Date | string;
		}
	}
}

export {};
