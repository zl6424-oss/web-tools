function cleanTexts(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).map(item => String(item || "").slice(0, 2000));
}

function parseJson(raw) {
  const cleaned = String(raw || "").trim();
  if (!cleaned) throw new Error("Empty translation response");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No complete JSON object");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callDeepSeek(messages, jsonMode) {
  const requestBody = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
    messages,
    temperature: 0.1,
    max_tokens: 4000
  };
  if (jsonMode) requestBody.response_format = { type: "json_object" };

  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });
  const result = await upstream.json();
  if (!upstream.ok) throw new Error(result?.error?.message || "Translation API error");
  return result?.choices?.[0]?.message?.content || "";
}

export default async function translateHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return response.status(500).json({ error: "DEEPSEEK_API_KEY is not configured" });
  }

  const texts = cleanTexts(request.body?.texts);
  const target = request.body?.targetLanguage === "zh" ? "Simplified Chinese" : "English";
  if (!texts.length) return response.status(200).json({ translations: [] });

  const prompt = [
    {
      role: "system",
      content: `Translate every text into ${target}. Preserve electronic part numbers, measurements, symbols, and product names. Keep the tone natural and concise. Return ONLY valid JSON in this exact shape: {"translations":["first translation","second translation"]}. The array must contain exactly ${texts.length} strings in the original order.`
    },
    { role: "user", content: JSON.stringify({ texts }) }
  ];

  try {
    let parsed;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await callDeepSeek(prompt, attempt === 0);
      try {
        parsed = parseJson(raw);
        if (!Array.isArray(parsed.translations) || parsed.translations.length !== texts.length) {
          throw new Error("Translation count mismatch");
        }
        break;
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    return response.status(200).json({
      translations: parsed.translations.map(item => String(item))
    });
  } catch (error) {
    console.error("Translation failed", error.message);
    return response.status(502).json({ error: "Unable to translate conversation" });
  }
}
