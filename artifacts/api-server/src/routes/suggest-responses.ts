import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/suggest-responses", async (req, res) => {
  const { heard_text, context } = req.body as { heard_text?: string; context?: string };

  if (!heard_text?.trim()) {
    res.status(400).json({ error: "heard_text is required" });
    return;
  }

  const contextLabel = context || "casual";

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Someone said to me: "${heard_text.trim()}"

Context: ${contextLabel}

Generate exactly 3 natural, warm, human responses I might want to say back. Keep each under 20 words. Return ONLY a JSON array with no extra text: ["response1", "response2", "response3"]. Match the tone — if they asked a casual question, give casual answers. If they said something emotional, give emotional answers.`,
        },
      ],
      system:
        "You are helping someone who cannot speak respond to conversation. Generate exactly 3 natural, warm, human responses they might want to say back. Keep each under 20 words. Return ONLY a valid JSON array: [\"response1\", \"response2\", \"response3\"]. No markdown, no explanation, just the JSON array.",
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    const raw = block.text.trim();
    const suggestions = JSON.parse(raw) as string[];

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("Invalid suggestions format");
    }

    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (err) {
    req.log.error({ err }, "suggest-responses error");
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
