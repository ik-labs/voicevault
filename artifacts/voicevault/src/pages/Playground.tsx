import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2, Play, Download, Sparkles, Wand2, Send,
  MessageSquarePlus, X, Share2, MessageCircle, Keyboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useExpandPhrase } from "@workspace/api-client-react";
import ConversationMode from "./ConversationMode";

const QUICK_PHRASES = [
  { label: "Good morning" },
  { label: "I love you" },
  { label: "Thank you" },
  { label: "I need help" },
  { label: "I'm in pain" },
  { label: "I need water" },
  { label: "Call my family" },
  { label: "I need the bathroom" },
  { label: "Tell me about your day" },
  { label: "That's really funny" },
  { label: "I miss you" },
  { label: "Let's go outside" },
];

const MAX_SAVED = 10;

type SavedMessage = {
  id: number;
  text: string;
  url: string;
  blob: Blob;
};

export default function Playground() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"type" | "convo">("type");

  // --- Quick speak ---
  const [text, setText] = useState("");
  const [isExpandEnabled, setIsExpandEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const expandPhrase = useExpandPhrase();

  // --- Voice message composer ---
  const [msgText, setMsgText] = useState("");
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [msgAudioUrl, setMsgAudioUrl] = useState<string | null>(null);
  const [msgAudioBlob, setMsgAudioBlob] = useState<Blob | null>(null);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const shareTooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  // --- Saved messages (session memory) ---
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const savedIdCounter = useRef(0);

  useEffect(() => {
    const id = localStorage.getItem("voice_id");
    if (!id) {
      setLocation("/");
    } else {
      setVoiceId(id);
    }
  }, [location, setLocation]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      savedMessages.forEach((m) => URL.revokeObjectURL(m.url));
      if (shareTooltipTimer.current) clearTimeout(shareTooltipTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Quick speak helpers ----
  const handleSpeak = async (textToSpeak: string = text) => {
    if (!textToSpeak.trim() || !voiceId) return;
    if (isExpandEnabled && textToSpeak === text) {
      try {
        setIsSpeaking(true);
        const res = await expandPhrase.mutateAsync({ data: { text: textToSpeak } });
        setText(res.expanded_text);
        setIsSpeaking(false);
        return;
      } catch {
        toast({ title: "Expansion failed", description: "Could not expand phrase.", variant: "destructive" });
        setIsSpeaking(false);
        return;
      }
    }
    executeSpeak(textToSpeak);
  };

  const executeSpeak = async (textToSpeak: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voice_id: voiceId }),
      });
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setLastAudioUrl(url);
      const audio = new Audio(url);
      await audio.play();
    } catch {
      toast({ title: "Playback failed", description: "Could not generate speech.", variant: "destructive" });
    } finally {
      setIsSpeaking(false);
    }
  };

  // ---- Voice message helpers ----
  const generateMessage = async () => {
    if (!msgText.trim() || !voiceId) return;
    setIsGeneratingMsg(true);
    setMsgAudioUrl(null);
    setMsgAudioBlob(null);
    setShowShareTooltip(false);
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgText.trim(), voice_id: voiceId }),
      });
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMsgAudioUrl(url);
      setMsgAudioBlob(blob);
    } catch {
      toast({ title: "Generation failed", description: "Could not generate message. Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingMsg(false);
    }
  };

  const downloadMessage = (url: string, filename = "voicevault-message.mp3") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const shareMessage = async () => {
    if (!msgAudioBlob || !msgAudioUrl) return;
    const file = new File([msgAudioBlob], "voicevault-message.mp3", { type: "audio/mpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Voice message from VoiceVault",
          files: [file],
        });
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") {
          toast({ title: "Share failed", description: "Could not share file.", variant: "destructive" });
        }
      }
    } else {
      // Fallback: download + tooltip
      downloadMessage(msgAudioUrl);
      setShowShareTooltip(true);
      if (shareTooltipTimer.current) clearTimeout(shareTooltipTimer.current);
      shareTooltipTimer.current = setTimeout(() => setShowShareTooltip(false), 5000);
    }
  };

  const saveAndNewMessage = () => {
    if (!msgAudioUrl || !msgAudioBlob || !msgText.trim()) return;
    setSavedMessages((prev) => {
      const entry: SavedMessage = {
        id: ++savedIdCounter.current,
        text: msgText.trim(),
        url: msgAudioUrl,
        blob: msgAudioBlob,
      };
      const next = [entry, ...prev].slice(0, MAX_SAVED);
      return next;
    });
    setMsgText("");
    setMsgAudioUrl(null);
    setMsgAudioBlob(null);
    setShowShareTooltip(false);
  };

  const playSaved = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {
      toast({ title: "Playback error", description: "Could not play audio.", variant: "destructive" });
    });
  };

  const removeSaved = (id: number) => {
    setSavedMessages((prev) => {
      const msg = prev.find((m) => m.id === id);
      if (msg) URL.revokeObjectURL(msg.url);
      return prev.filter((m) => m.id !== id);
    });
  };

  if (!voiceId) return null;

  return (
    <div className="min-h-[100dvh] w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col space-y-6 bg-background text-foreground animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex flex-col items-center justify-center py-6 text-center space-y-2 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          Your Voice is Ready! <Sparkles className="w-8 h-8 text-[hsl(var(--success))]" />
        </h1>
        <p className="text-muted-foreground text-lg">Speak in your voice — type or have a live conversation.</p>
      </header>

      {/* Tab switcher */}
      <div
        className="flex rounded-2xl bg-secondary/50 p-1 gap-1"
        role="tablist"
        aria-label="Playground modes"
      >
        <Button
          role="tab"
          aria-selected={activeTab === "type"}
          variant="ghost"
          className={`flex-1 min-h-[52px] rounded-xl text-base font-semibold gap-2 transition-all ${
            activeTab === "type"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("type")}
        >
          <Keyboard className="w-4 h-4" />
          Type to Speak
        </Button>
        <Button
          role="tab"
          aria-selected={activeTab === "convo"}
          variant="ghost"
          className={`flex-1 min-h-[52px] rounded-xl text-base font-semibold gap-2 transition-all ${
            activeTab === "convo"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("convo")}
        >
          <MessageCircle className="w-4 h-4" />
          Conversation Mode
        </Button>
      </div>

      {/* Conversation Mode tab */}
      {activeTab === "convo" && voiceId && (
        <ConversationMode voiceId={voiceId} />
      )}

      {/* Type to Speak tab */}
      {activeTab === "type" && (
        <>

      {/* Quick speak */}
      <section className="flex flex-col space-y-4" aria-label="Text to speech input">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-input" className="text-lg font-medium">What do you want to say?</Label>
          <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-2 rounded-lg">
            <Switch
              id="expand-mode"
              checked={isExpandEnabled}
              onCheckedChange={setIsExpandEnabled}
              aria-label="Expand my words toggle"
            />
            <Label htmlFor="expand-mode" className="cursor-pointer text-base flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Expand my words
            </Label>
          </div>
        </div>

        <Textarea
          id="text-input"
          placeholder="Type here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] text-xl p-4 rounded-xl resize-none"
          aria-label="Text to speak"
          data-testid="input-speak-text"
        />

        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 min-h-[64px] text-xl rounded-xl"
            onClick={() => handleSpeak()}
            disabled={isSpeaking || !text.trim()}
            aria-label={isExpandEnabled ? "Expand text" : "Speak text"}
            data-testid="button-speak"
          >
            {isSpeaking
              ? <Loader2 className="w-6 h-6 animate-spin mr-2" />
              : (isExpandEnabled ? <Wand2 className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />)}
            {isExpandEnabled ? "Expand Text" : "Speak"}
          </Button>

          {lastAudioUrl && (
            <Button
              size="lg"
              variant="outline"
              className="min-h-[64px] w-20 rounded-xl"
              asChild
              aria-label="Download audio"
            >
              <a href={lastAudioUrl} download="voice-message.mp3">
                <Download className="w-6 h-6" />
              </a>
            </Button>
          )}
        </div>

        {isExpandEnabled && (
          <p className="text-sm text-muted-foreground">
            Hint: Type a short phrase like "need water" and click Expand Text. You can review the sentence before speaking.
          </p>
        )}
      </section>

      {/* Quick Phrases */}
      <section className="space-y-4 pt-4" aria-label="Quick Phrases">
        <h2 className="text-xl font-semibold">Quick Phrases</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_PHRASES.map((phrase, i) => (
            <Button
              key={phrase.label}
              variant="secondary"
              className="h-auto min-h-[64px] py-4 text-base rounded-xl whitespace-normal text-center leading-tight hover:bg-primary/20 hover:text-primary transition-colors animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
              onClick={() => { setText(phrase.label); executeSpeak(phrase.label); }}
              disabled={isSpeaking}
              aria-label={`Speak phrase: ${phrase.label}`}
              data-testid={`button-phrase-${i}`}
            >
              {phrase.label}
            </Button>
          ))}
        </div>
      </section>

      {/* ===== Send a Voice Message ===== */}
      <section
        className="rounded-2xl border border-border bg-card p-6 space-y-5"
        aria-label="Send a Voice Message"
        data-testid="section-voice-message"
      >
        <div className="flex items-start gap-3">
          <Send className="w-6 h-6 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold">Send a Voice Message</h2>
            <p className="text-muted-foreground text-base mt-0.5">
              Create a message in your voice and share it with someone you love
            </p>
          </div>
        </div>

        <Textarea
          placeholder="Type your message here... e.g. Hey sweetheart, I just wanted to say I love you and I'm thinking about you today."
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          className="min-h-[130px] text-lg p-4 rounded-xl resize-none"
          aria-label="Voice message text"
          data-testid="input-message-text"
        />

        <Button
          size="lg"
          className="w-full min-h-[60px] text-lg rounded-xl bg-primary hover:bg-primary/90"
          onClick={generateMessage}
          disabled={isGeneratingMsg || !msgText.trim()}
          aria-label="Generate voice message"
          data-testid="button-generate-message"
        >
          {isGeneratingMsg
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating...</>
            : <><MessageSquarePlus className="w-5 h-5 mr-2" /> Generate Message</>}
        </Button>

        {/* Audio player + actions */}
        {msgAudioUrl && (
          <div
            className="space-y-4 rounded-xl bg-secondary/40 border border-border p-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
            data-testid="message-audio-player"
          >
            {/* HTML5 audio player */}
            <audio
              controls
              src={msgAudioUrl}
              className="w-full rounded-lg"
              aria-label="Preview your voice message"
              style={{ colorScheme: "dark" }}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 min-h-[52px] rounded-xl text-base"
                onClick={() => downloadMessage(msgAudioUrl)}
                aria-label="Download voice message as MP3"
                data-testid="button-download-message"
              >
                <Download className="w-5 h-5 mr-2" />
                Download MP3
              </Button>

              <div className="relative flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full min-h-[52px] rounded-xl text-base"
                  onClick={shareMessage}
                  aria-label="Share voice message"
                  data-testid="button-share-message"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
                {showShareTooltip && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl bg-foreground text-background text-sm px-4 py-3 text-center shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200"
                    role="status"
                    aria-live="polite"
                  >
                    Downloaded! You can now share this file via email, WhatsApp, or any messaging app.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                  </div>
                )}
              </div>

              <Button
                size="lg"
                variant="secondary"
                className="flex-1 min-h-[52px] rounded-xl text-base"
                onClick={saveAndNewMessage}
                aria-label="Save and create new message"
                data-testid="button-new-message"
              >
                New Message
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ===== Saved Messages ===== */}
      {savedMessages.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
          aria-label="Saved Messages"
          data-testid="section-saved-messages"
        >
          <h2 className="text-xl font-semibold">Saved Messages</h2>
          <p className="text-sm text-muted-foreground -mt-2">
            {savedMessages.length} of {MAX_SAVED} messages saved this session
          </p>
          <ul className="space-y-3" role="list">
            {savedMessages.map((msg) => (
              <li
                key={msg.id}
                className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200"
                data-testid={`saved-message-${msg.id}`}
              >
                <p className="flex-1 text-base truncate text-foreground" title={msg.text}>
                  {msg.text.length > 50 ? msg.text.slice(0, 50) + "…" : msg.text}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-11 h-11 rounded-full hover:bg-primary/20 hover:text-primary"
                    onClick={() => playSaved(msg.url)}
                    aria-label={`Play saved message: ${msg.text.slice(0, 30)}`}
                    data-testid={`button-play-saved-${msg.id}`}
                  >
                    <Play className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-11 h-11 rounded-full hover:bg-primary/20 hover:text-primary"
                    onClick={() => downloadMessage(msg.url, `voicevault-message-${msg.id}.mp3`)}
                    aria-label={`Download saved message: ${msg.text.slice(0, 30)}`}
                    data-testid={`button-download-saved-${msg.id}`}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-11 h-11 rounded-full hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => removeSaved(msg.id)}
                    aria-label={`Remove saved message: ${msg.text.slice(0, 30)}`}
                    data-testid={`button-remove-saved-${msg.id}`}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

        </>
      )}

    </div>
  );
}
