import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/speak", async (req, res) => {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
    return;
  }

  const { text, voice_id } = req.body as { text?: string; voice_id?: string };

  if (!text || !voice_id) {
    res.status(400).json({ error: "text and voice_id are required" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      req.log.error({ status: response.status, body: errorBody }, "ElevenLabs speak error");
      res.status(response.status).json({ error: `ElevenLabs API error: ${errorBody}` });
      return;
    }

    const audioBuffer = await response.buffer();
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(audioBuffer.length));
    res.send(audioBuffer);
  } catch (err) {
    req.log.error({ err }, "Failed to generate speech");
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

export default router;
