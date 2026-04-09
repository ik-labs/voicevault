import { Router } from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/clone-voice",
  upload.array("files"),
  async (req, res) => {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) {
      res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No audio files provided" });
      return;
    }

    const form = new FormData();
    form.append("name", (req.body.name as string) || "VoiceVault Clone");
    form.append("remove_background_noise", "false");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      form.append("files", file.buffer, {
        filename: `recording_${i + 1}.webm`,
        contentType: file.mimetype || "audio/webm",
      });
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          ...form.getHeaders(),
        },
        body: form as unknown as import("node-fetch").BodyInit,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        req.log.error({ status: response.status, body: errorBody }, "ElevenLabs clone-voice error");
        res.status(response.status).json({ error: `ElevenLabs API error: ${errorBody}` });
        return;
      }

      const data = await response.json() as { voice_id: string };
      res.json({ voice_id: data.voice_id });
    } catch (err) {
      req.log.error({ err }, "Failed to clone voice");
      res.status(500).json({ error: "Failed to clone voice" });
    }
  },
);

export default router;
