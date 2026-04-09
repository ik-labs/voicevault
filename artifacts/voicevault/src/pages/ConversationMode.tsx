import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONTEXTS = [
  { id: "casual", label: "Casual chat" },
  { id: "serious", label: "Serious talk" },
  { id: "plans", label: "Making plans" },
  { id: "listening", label: "Just listening" },
];

type ChatEntry = {
  id: number;
  theySaid: string;
  iReplied: string | null;
};

type Phase = "idle" | "listening" | "thinking" | "responding";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ConversationMode({ voiceId }: { voiceId: string }) {
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [context, setContext] = useState("casual");
  const [heardText, setHeardText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);

  const historyEndRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast({
        title: "Not supported",
        description: "Speech recognition isn't available in this browser. Try Chrome.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setPhase("listening");
    setHeardText("");
    setSuggestions([]);
    setCustomText("");

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setHeardText(transcript);
      setPhase("thinking");
      await fetchSuggestions(transcript);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech") {
        toast({ title: "Didn't catch that", description: "No speech detected. Tap the mic to try again." });
      } else if (e.error !== "aborted") {
        toast({ title: "Mic error", description: `Recognition error: ${e.error}`, variant: "destructive" });
      }
      setPhase("idle");
    };

    recognition.onend = () => {
      if (phase === "listening") setPhase("idle");
    };

    recognition.start();
  }, [context, phase, toast]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setPhase("idle");
  };

  const fetchSuggestions = async (text: string) => {
    try {
      const res = await fetch("/api/suggest-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heard_text: text, context }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { suggestions: string[] };
      setSuggestions(data.suggestions);
      setPhase("responding");
    } catch {
      toast({ title: "Couldn't generate suggestions", description: "Type your own response instead.", variant: "destructive" });
      setPhase("responding");
    }
  };

  const speakResponse = async (responseText: string) => {
    if (!responseText.trim() || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: responseText, voice_id: voiceId }),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();

      setHistory((prev) => [
        ...prev,
        { id: ++entryIdRef.current, theySaid: heardText, iReplied: responseText },
      ]);
      setPhase("idle");
      setHeardText("");
      setSuggestions([]);
      setCustomText("");
      scrollToBottom();
    } catch {
      toast({ title: "Playback failed", description: "Could not generate speech.", variant: "destructive" });
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Context selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Conversation context</p>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((c) => (
            <Button
              key={c.id}
              variant={context === c.id ? "default" : "outline"}
              size="sm"
              className={`rounded-full min-h-[40px] px-4 text-sm font-medium transition-all ${
                context === c.id ? "bg-primary text-primary-foreground" : "hover:border-primary/50"
              }`}
              onClick={() => setContext(c.id)}
              aria-pressed={context === c.id}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main mic / listen area */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-lg font-medium text-muted-foreground text-center">
              When someone starts talking to you, tap the button below
            </p>
            <Button
              size="lg"
              className="w-40 h-40 rounded-full bg-primary hover:bg-primary/90 shadow-xl flex flex-col gap-2 text-base font-semibold"
              onClick={startListening}
              aria-label="Tap when they're talking to you"
            >
              <Mic className="w-10 h-10" />
              <span className="text-sm leading-tight text-center">Tap when they're<br />talking</span>
            </Button>
          </div>
        )}

        {phase === "listening" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex items-center justify-center w-40 h-40">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/10 animate-ping" style={{ animationDelay: "0.3s" }} />
              <Button
                size="lg"
                className="w-36 h-36 rounded-full bg-destructive hover:bg-destructive/90 shadow-xl flex flex-col gap-2 z-10 relative"
                onClick={stopListening}
                aria-label="Stop listening"
              >
                <MicOff className="w-10 h-10" />
                <span className="text-sm">Listening…</span>
              </Button>
            </div>
            <p className="text-muted-foreground text-base animate-pulse">Hearing what they said…</p>
          </div>
        )}

        {phase === "thinking" && (
          <div className="flex flex-col items-center gap-4 py-6">
            {heardText && (
              <div className="self-start max-w-[80%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">They said:</p>
                <p className="text-base">{heardText}</p>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Thinking of responses…</span>
            </div>
          </div>
        )}

        {phase === "responding" && (
          <div className="space-y-5">
            {/* What they said */}
            {heardText && (
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">They said:</p>
                  <p className="text-base">{heardText}</p>
                </div>
              </div>
            )}

            {/* Suggested responses */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tap to say it in your voice:</p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start h-auto min-h-[56px] text-base rounded-xl whitespace-normal text-left px-4 py-3 hover:bg-primary/10 hover:border-primary/50 hover:text-foreground transition-all"
                      onClick={() => speakResponse(s)}
                      disabled={isSpeaking}
                      aria-label={`Say: ${s}`}
                    >
                      {isSpeaking ? <Loader2 className="w-4 h-4 mr-2 shrink-0 animate-spin" /> : <span className="text-primary mr-2 shrink-0 font-bold">{i + 1}.</span>}
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom response */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Or type your own:</p>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type what you want to say…"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 min-h-[80px] text-base rounded-xl resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      speakResponse(customText);
                    }
                  }}
                />
                <Button
                  size="lg"
                  className="h-auto min-h-[80px] w-16 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
                  onClick={() => speakResponse(customText)}
                  disabled={isSpeaking || !customText.trim()}
                  aria-label="Speak custom response"
                >
                  {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Listen again */}
            <Button
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground hover:text-foreground"
              onClick={startListening}
              disabled={isSpeaking}
            >
              <Mic className="w-4 h-4 mr-2" />
              Listen again
            </Button>
          </div>
        )}
      </div>

      {/* Conversation history */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Conversation</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {history.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <div className="flex justify-start">
                  <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">They said:</p>
                    <p className="text-base">{entry.theySaid}</p>
                  </div>
                </div>
                {entry.iReplied && (
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2">
                      <p className="text-xs text-primary-foreground/70 mb-0.5 font-medium">You said:</p>
                      <p className="text-base text-primary-foreground">{entry.iReplied}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
