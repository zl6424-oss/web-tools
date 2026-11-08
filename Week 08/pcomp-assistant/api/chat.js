const allowedRoles = new Set(["user", "assistant"]);

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(item => item && allowedRoles.has(item.role) && typeof item.content === "string")
    .slice(-12)
    .map(item => ({ role: item.role, content: item.content.slice(0, 4000) }));
}

function cleanPlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const safeList = (value, max) => Array.isArray(value) ? value.slice(0, max) : [];
  return {
    input: {
      idea: String(plan.input?.idea || "—").slice(0, 160),
      space: String(plan.input?.space || "Not confirmed").slice(0, 80),
      power: String(plan.input?.power || "Not confirmed").slice(0, 80),
      budget: String(plan.input?.budget || "Not confirmed").slice(0, 80)
    },
    solution: String(plan.solution || "").slice(0, 600),
    why: String(plan.why || "").slice(0, 300),
    parts: safeList(plan.parts, 10).map(part => ({
      name: String(part?.name || "Unknown part").slice(0, 120),
      quantity: Math.max(1, Number(part?.quantity) || 1),
      size: String(part?.size || "Confirm seller dimensions").slice(0, 120),
      reason: String(part?.reason || "").slice(0, 160)
    })),
    flow: safeList(plan.flow, 8).map(item => String(item).slice(0, 100)),
    wiring: safeList(plan.wiring, 12).map(item => ({
      from: String(item?.from || "").slice(0, 120),
      to: String(item?.to || "").slice(0, 120),
      note: String(item?.note || "").slice(0, 160)
    })),
    tests: safeList(plan.tests, 6).map(item => String(item).slice(0, 200)),
    esp32Upgrade: plan.esp32Upgrade ? String(plan.esp32Upgrade).slice(0, 800) : ""
  };
}

function systemPrompt(language, currentPlan) {
  const outputLanguage = language === "zh" ? "Simplified Chinese" : "English";
  return `You are PCom Assistant, a practical planning assistant for product designers building their first functional physical-computing prototype.

Apply these planning skills silently before you answer:

SKILL 1 — Scope Clarifier
Identify the intended behavior, output, internal space, power source, budget, and parts the user already owns. Ask only ONE short question at a time. Do not repeat answered questions.

SKILL 2 — Simplifier
Find the smallest circuit that proves the core function. Never add a microcontroller when a switch, button, resistor, transistor, timer, or basic module can solve the task.

SKILL 3 — Component Selector
Choose common, easy-to-buy DIY components. Normally use no more than 6 main components. If more are truly required, every extra part must have a clear purpose. Use ESP32-C3 SuperMini only for programmable behavior, sensors, timing logic, or wireless control.

SKILL 4 — Power and Safety Checker
Match supply voltage and expected current to the parts. Prefer low-voltage USB or battery prototypes. Check polarity and mention current limits. For an LED and resistor, show the Ohm's law basis: R = (supply voltage - LED forward voltage) / target current. Unless a specific LED datasheet clearly allows more, treat 20 mA as the maximum for a common indicator LED and prefer a conservative standard resistor value. Never guide the user to wire mains voltage.

SKILL 5 — Size Checker
Compare component reference dimensions with the available internal space. Never invent an exact dimension or a size difference between two parts. If the exact manufacturer and model are not known, write "Confirm seller dimensions" instead of giving a precise measurement. Do not decide the final physical placement for the designer.

SKILL 6 — Wiring Planner
Create a short point-to-point wiring table. Name positive, negative, input, output, and required common ground clearly. Avoid unnecessary connections.

SKILL 7 — Shopping List Builder
Give each recommended part a quantity, purpose, and reference size. Prefer a specific common module only when you are confident about its function.

SKILL 8 — First-Test Coach
Break testing into safe stages: inspect without power, verify voltage and polarity, connect the output briefly, then check heat and behavior.

Before returning a plan, run a simplicity audit: challenge every component and remove it if the core function still works safely. The final plan must be the simplest safe plan that satisfies the confirmed requirements. If a simpler alternative changes size, brightness, runtime, cost, or another requirement, choose the best fit and state that tradeoff briefly.

Keep all text concise and use ${outputLanguage}.
- assistantMessage: at most 2 short sentences.
- solution: at most 60 words.
- why: at most 30 words.
- each component reason: at most 12 words.
- each wiring note: at most 10 words.
- at most 5 test steps, each at most 15 words.
- Do not repeat the same explanation in multiple sections.

Return ONLY one complete valid JSON object, with no markdown.
Before enough information is available:
{"assistantMessage":"One short reply or question.","projectTitle":"Short name","plan":null}

When enough information is available:
{
  "assistantMessage":"Short summary and invitation to request changes.",
  "projectTitle":"Short name",
  "plan":{
    "input":{"idea":"","space":"","power":"","budget":""},
    "solution":"",
    "why":"",
    "parts":[{"name":"","quantity":1,"size":"","reason":""}],
    "flow":["Power","Control","Output"],
    "wiring":[{"from":"","to":"","note":""}],
    "tests":[""],
    "esp32Upgrade":""
  }
}

Keep the full response under 900 words. Use at most 8 wiring rows and 5 test steps.
If an existing plan must change, return the entire updated plan.
Set esp32Upgrade to an empty string unless it is genuinely useful.
Current plan: ${JSON.stringify(currentPlan || null)}`;
}

async function callDeepSeek(body, maxTokens, jsonMode) {
  const requestBody = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
    messages: body,
    temperature: 0.2,
    max_tokens: maxTokens
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
  if (!upstream.ok) {
    console.error("DeepSeek error", upstream.status, result?.error?.message || "Unknown error");
    throw new Error("AI service error");
  }
  const choice = result?.choices?.[0];
  const content = choice?.message?.content || "";
  if (!content) {
    console.warn("DeepSeek returned empty content", {
      finishReason: choice?.finish_reason || "unknown",
      reasoningLength: choice?.message?.reasoning_content?.length || 0
    });
  }
  return content;
}

function parseJson(raw) {
  const cleaned = raw.trim();
  if (!cleaned) throw new Error("Empty AI response");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No complete JSON object");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return response.status(500).json({ error: "DEEPSEEK_API_KEY is not configured" });
  }

  const messages = cleanMessages(request.body?.messages);
  if (!messages.length) return response.status(400).json({ error: "No valid messages" });

  const promptMessages = [
    { role: "system", content: systemPrompt(request.body?.language, request.body?.currentPlan) },
    ...messages
  ];

  try {
    let parsed;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await callDeepSeek(promptMessages, attempt === 0 ? 3600 : 5000, attempt === 0);
      try {
        parsed = parseJson(raw);
        break;
      } catch (parseError) {
        console.warn("DeepSeek returned incomplete JSON; retrying", attempt + 1);
      }
    }

    if (!parsed) {
      const fallbackPrompt = [
        ...promptMessages,
        {
          role: "system",
          content: "The structured response could not be read. Reply with only one short conversational question that moves the prototype forward. Do not use JSON or markdown."
        }
      ];
      const fallbackMessage = await callDeepSeek(fallbackPrompt, 700, false);
      parsed = {
        assistantMessage: fallbackMessage.trim() || "What other detail should the prototype plan consider?",
        projectTitle: "",
        plan: null
      };
    }

    return response.status(200).json({
      assistantMessage: String(parsed.assistantMessage || "Tell me more about your prototype."),
      projectTitle: String(parsed.projectTitle || "").slice(0, 80),
      plan: cleanPlan(parsed.plan)
    });
  } catch (error) {
    console.error("Chat route failed", error.message);
    return response.status(502).json({ error: "The AI response was incomplete. Please try again." });
  }
}






