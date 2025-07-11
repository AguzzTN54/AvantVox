export class GeminiProvider implements App.LLMProvider {
	constructor(private apiKey: string) {
		if (!apiKey) throw new Error('Gemini API key is required');
	}

	async rephrase({ title, content }: App.BasicArticle): Promise<App.BasicArticle> {
		const body = {
			system_instruction: {
				parts: [
					{
						text:
							// 'You are a helpful AI that rewrites articles for clarity and engagement.\n' +
							// 'Return your response as strict JSON with two fields: `title` and `content`.\n' +
							// 'Do not change the excerpt inside the singlequote or doublequote' +
							// 'Preserve HTML tags in the content (e.g. <p>, <blockquote>, <img>).\n' +
							// 'Do NOT include explanations or formatting outside the JSON object.\n' +
							// 'Example output: { "title": "...", "content": "..." }'

							'You are a helpful AI that rewrites and localizes news articles into Indonesian language.\n' +
							'Return the result as a stringify from strict JSON object with two fields: "title" and "content".\n' +
							'Use natural but follow EYD rule, formal Indonesian suitable for online news readers.\n' +
							'Preserve any HTML tags in the content (e.g. <p>, <blockquote>, <img>).\n' +
							'Do not include explanations or extra text — only return the stringified JSON object\n' +
							// 'Example output: { "title": "Judul Terjemahan", "content": "<p>Artikel</p>" }'
							'Example output: { "title": "...", "content": "..." }'
					}
				]
			},
			contents: [
				{
					parts: [{ text: `Title:\n${title}` }, { text: `Article:\n${content}` }]
				}
			]
		};

		try {
			const res = await fetch(
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
			const parsed = JSON.parse(jsonResult);
			if (!parsed.title || !parsed.content) throw new Error('Missing fields');
			return {
				title: parsed.title.trim(),
				content: parsed.content.trim()
			};
		} catch (e) {
			console.error('Failed proccess Gemini', { cause: e });
			return { content: '', title: '' };
		}
	}
}

const extractJson = (text: string): string => {
	const braceMatch = text.match(/{[\s\S]+}/);
	if (braceMatch) return braceMatch[0].trim();

	throw new Error('No JSON object found in response:\n' + text);
};
