import { Router } from "express";

const router = Router();

const PHRASE_MAP: Record<string, string> = {
  "cold": "Hey, when you get a chance, I'm feeling a little cold. Could you grab me a blanket?",
  "hungry": "I'm starting to get hungry. What do you think we should have for dinner?",
  "tired": "I'm getting pretty tired. I think I might need to rest for a bit.",
  "pain": "I'm having some pain right now. Could you help me get comfortable?",
  "yes": "Yes, that sounds good to me!",
  "no": "No, I don't think so, but thank you for asking.",
  "love you": "I love you so much. You mean the world to me.",
  "thank you": "Thank you so much, I really appreciate that.",
  "hello": "Hey there! It's good to see you. How are you doing?",
  "goodbye": "Take care! I'll see you soon. Love you.",
  "help": "Could you help me out for a moment? I'd really appreciate it.",
  "water": "Could I please have some water? I'm quite thirsty.",
  "bathroom": "I need to use the bathroom. Could you help me get there?",
  "doctor": "I think I need to see the doctor. Something doesn't feel right.",
  "okay": "I'm doing okay, thank you for asking.",
  "good morning": "Good morning! I hope you slept well. It's great to see you.",
  "good night": "Good night! Sleep well and sweet dreams.",
};

router.post("/expand-phrase", (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const normalized = text.trim().toLowerCase();
  const expanded = PHRASE_MAP[normalized] ?? text;

  res.json({ expanded_text: expanded });
});

export default router;
