import { client } from '../helper';

export class GeminiProvider implements App.LLMProvider {
	constructor(private apiKey: string) {
		if (!apiKey) throw new Error('Gemini API key is required');
	}

	async rephrase(articles: App.BasicArticle[]): Promise<App.BasicArticle[]> {
		const body = {
			system_instruction: {
				parts: [
					{
						text:
							'You are a helpful AI that rewrites and localizes news articles into id-ID language.\n' +
							'Use natural but formal Indonesian suitable for online news readers and follow the EYD rule.\n' +
							'Preserve any HTML tags in the content (e.g., <p>, <blockquote>, <img>).\n' +
							'For each article:\n' +
							'- Rewrite the title and content into localized Indonesian.\n' +
							'- Extract 3 relevant tags (keywords or topics) describing the article’s main subject.\n' +
							'Tag rules:\n' +
							'- Tags remain in English, all lowercase.\n' +
							'- At least 2 tags must be a single word, the third tag still prioritize to be a single words but two words is acceptable.\n' +
							'- Avoid country names, nationalities, or cultural identifiers (e.g., Indonesian, Chinese, Balinese).\n' +
							'- Avoid generic tags like "news", "article", "information".\n' +
							'- Be specific. Do not repeat similar tags (e.g., "football" and "soccer"). Pick only one.\n' +
							'\n' +
							'Return the result as a strict JSON string with this format:\n' +
							'[{"title": "...", "content": "...", "tags": ["...", "...", "..."]}, {...}]\n' +
							'Do not include explanations, headings, or extra text. Only return the stringified JSON array.'
					}
				]
			},
			contents: [
				{
					parts: [
						{
							text: `Articles:\n${JSON.stringify({ articles })}`
						}
					]
				}
			]
		};

		try {
			const res = await client.fetch(
				'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-goog-api-key': this.apiKey
					},
					body: JSON.stringify(body)
				}
			);

			const json = await res.json();
			const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
			const jsonResult = extractJson(text);
			const parsed: App.BasicArticle[] = JSON.parse(jsonResult);
			if (!Array.isArray(parsed)) throw new Error('Parsing Error');
			return parsed;
		} catch (e) {
			console.error('Failed proccess Gemini', { cause: e });
			return [];
		}
	}
}

const extractJson = (text: string): string => {
	const braceMatch = text.match(/\[[\s\S]+\]/);
	if (braceMatch) return braceMatch[0].trim();

	throw new Error('No JSON object found in response:\n' + text);
};
