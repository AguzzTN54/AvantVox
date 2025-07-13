import { GeminiProvider } from './gemini';

type SupportedModels = 'gemini' | 'openai' | 'claude';

interface LLMOptions {
	model?: SupportedModels;
	apiKeys: {
		gemini?: string;
		openai?: string;
		claude?: string;
	};
}

export class LLM {
	#model: SupportedModels;
	#providers: Record<SupportedModels, App.LLMProvider>;

	constructor({ model = 'gemini', apiKeys }: LLMOptions) {
		this.#providers = {
			gemini: new GeminiProvider(apiKeys.gemini!),
			openai: new DummyProvider('OpenAI not implemented'),
			claude: new DummyProvider('Claude not implemented')
		};

		if (!this.#providers[model]) {
			throw new Error(`Unsupported model: ${model}`);
		}

		this.#model = model;
	}

	async rephrase(articles: App.BasicArticle[]): Promise<App.BasicArticle[]> {
		const result = await this.#providers[this.#model].rephrase(articles);
		return result;
	}
}

// Stub placeholder until you implement them
class DummyProvider implements App.LLMProvider {
	constructor(private message: string) {}
	async rephrase(): Promise<App.BasicArticle[]> {
		throw new Error(this.message);
	}
}
