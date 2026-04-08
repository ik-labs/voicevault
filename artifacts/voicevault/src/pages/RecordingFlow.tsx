import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic, Square, RotateCcw, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROMPTS = [
  "Say your name and where you're from, as if introducing yourself to a friend.",
  "Tell me about your favorite meal — what is it and why do you love it?",
  "Read this aloud: 'The quick brown fox jumps over the lazy dog near the bank of the river.'",
  "Pretend you just got amazing news. Say: 'Oh my god, I can't believe it! This is incredible!'",
  "Say this gently, like you're comforting someone: 'Hey, it's okay. Everything is going to be alright.'",
  "Read this aloud: 'She sells seashells by the seashore. Peter Piper picked a peck of pickled peppers.'",
  "Say whatever you want — a message to someone you love, a joke, anything."
];

const VU_BAR_COUNT = 24;

export default function RecordingFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Blob[]>(Array(PROMPTS.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number>();
  const isRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContext.current) audioContext.current.close();
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  const tickAudioLevel = useCallback(() => {
    if (!analyser.current || !isRecordingRef.current) return;
    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average);
    animationFrame.current = requestAnimationFrame(tickAudioLevel);
  }, []);

  const startLevelMonitor = useCallback(() => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(tickAudioLevel);
  }, [tickAudioLevel]);

  const stopLevelMonitor = useCallback(() => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    setAudioLevel(0);
  }, []);

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      }
      mediaRecorder.current = new MediaRecorder(stream, options);

      const ctx = new window.AudioContext();
      audioContext.current = ctx;
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.75;
      analyser.current = node;
      ctx.createMediaStreamSource(stream).connect(node);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setRecordings(prev => {
          const next = [...prev];
          next[currentStep] = blob;
          return next;
        });
        audioChunks.current = [];
      };

      return true;
    } catch {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record your voice.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleRecording = async () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
      stopLevelMonitor();
      mediaRecorder.current?.stop();
    } else {
      if (!mediaRecorder.current) {
        const success = await initAudio();
        if (!success) return;
      }
      audioChunks.current = [];
      mediaRecorder.current?.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      startLevelMonitor();
    }
  };

  const submitRecordings = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      recordings.forEach((blob, i) => {
        if (blob) formData.append("files", blob, `prompt-${i}.webm`);
      });
      formData.append("name", "My Voice");

      const res = await fetch("/api/clone-voice", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { voice_id: string };

      localStorage.setItem("voice_id", data.voice_id);
      setLocation("/playground");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create your voice clone. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-foreground">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
        <h2 className="text-2xl font-bold text-center">Creating your voice clone...</h2>
        <p className="text-muted-foreground mt-2 text-center text-lg">This takes about 30 seconds.</p>
      </div>
    );
  }

  const isCompleted = currentStep >= PROMPTS.length;
  const hasRecordingForStep = !!recordings[currentStep];

  // Normalize audioLevel (0–255 avg) to 0–1
  const normalizedLevel = Math.min(audioLevel / 60, 1);
  // Ring scale: 1.0 (silence) → 1.35 (loud)
  const ringScale = 1 + normalizedLevel * 0.35;
  // Ring opacity: 0.15 (silence) → 0.8 (loud)
  const ringOpacity = 0.15 + normalizedLevel * 0.65;

  if (isCompleted) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-foreground animate-in fade-in duration-500">
        <CheckCircle2 className="w-20 h-20 text-[hsl(var(--success))] mb-6" />
        <h2 className="text-3xl font-bold text-center mb-4">All Prompts Recorded</h2>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-md">
          Thank you. Your recordings are ready to be securely processed.
        </p>
        <Button
          size="lg"
          onClick={submitRecordings}
          className="min-h-[64px] min-w-[280px] text-xl rounded-xl"
          aria-label="Create My Voice"
        >
          Create My Voice
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col max-w-3xl mx-auto p-6 bg-background text-foreground">
      <div className="w-full mt-4 mb-8">
        <Progress value={(currentStep / PROMPTS.length) * 100} className="h-3" />
        <p className="text-sm text-muted-foreground mt-3 font-medium">
          Prompt {currentStep + 1} of {PROMPTS.length}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center w-full max-w-2xl min-h-[200px] flex items-center justify-center mb-12">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed tracking-tight"
            aria-live="polite"
          >
            {PROMPTS[currentStep]}
          </h2>
        </div>

        <div className="flex flex-col items-center w-full">
          {hasRecordingForStep && !isRecording ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full">
              {/* Static waveform preview after recording */}
              <div className="w-full max-w-md h-16 bg-secondary/50 rounded-xl mb-6 flex items-center justify-center border border-border px-4 gap-[3px]">
                {Array.from({ length: VU_BAR_COUNT }).map((_, i) => {
                  const h = 20 + Math.abs(Math.sin(i * 0.8 + 1.2)) * 80;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-primary/50 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.04}s` }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4 w-full max-w-sm">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const next = [...recordings];
                    next[currentStep] = null as unknown as Blob;
                    setRecordings(next);
                  }}
                  className="flex-1 min-h-[64px] text-lg rounded-xl"
                  aria-label="Re-record prompt"
                  data-testid="button-rerecord"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Re-record
                </Button>
                <Button
                  size="lg"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 min-h-[64px] text-lg rounded-xl"
                  aria-label="Next prompt"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Record button with live audio ring */}
              <div className="relative flex items-center justify-center w-36 h-36">
                {/* Outer glow ring — pulses with audio level */}
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none transition-all"
                    style={{
                      background: `radial-gradient(circle, rgba(224,122,95,${ringOpacity}) 0%, transparent 70%)`,
                      transform: `scale(${ringScale})`,
                      transition: "transform 80ms ease-out, background 80ms ease-out",
                    }}
                    aria-hidden="true"
                  />
                )}
                {/* Secondary expanding ring */}
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full border-4 pointer-events-none"
                    style={{
                      borderColor: `rgba(224,122,95,${ringOpacity * 0.6})`,
                      transform: `scale(${1 + normalizedLevel * 0.55})`,
                      transition: "transform 80ms ease-out, border-color 80ms ease-out",
                    }}
                    aria-hidden="true"
                  />
                )}

                <Button
                  variant="default"
                  size="icon"
                  className={`w-28 h-28 rounded-full shadow-xl z-10 relative transition-all duration-150 ${
                    isRecording
                      ? "bg-destructive hover:bg-destructive/90 scale-105"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  onPointerDown={(e) => { e.preventDefault(); if (!isRecordingRef.current) toggleRecording(); }}
                  onPointerUp={(e) => { e.preventDefault(); if (isRecordingRef.current) toggleRecording(); }}
                  onPointerLeave={(e) => { e.preventDefault(); if (isRecordingRef.current) toggleRecording(); }}
                  onClick={(e) => e.preventDefault()}
                  aria-label={isRecording ? "Stop recording" : "Hold or tap to record"}
                  aria-pressed={isRecording}
                  data-testid="button-record"
                >
                  {isRecording
                    ? <Square className="w-10 h-10" />
                    : <Mic className="w-12 h-12" />}
                </Button>
              </div>

              {/* VU meter bar — only visible while recording */}
              <div
                className="w-full max-w-xs transition-opacity duration-300"
                style={{ opacity: isRecording ? 1 : 0 }}
                aria-hidden="true"
              >
                <div className="flex items-end justify-center gap-[3px] h-10">
                  {Array.from({ length: VU_BAR_COUNT }).map((_, i) => {
                    const center = VU_BAR_COUNT / 2;
                    const distFromCenter = Math.abs(i - center) / center;
                    const barLevel = Math.max(0, normalizedLevel - distFromCenter * 0.3);
                    const minH = 10;
                    const height = minH + barLevel * 90;
                    const isActive = barLevel > 0.05;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isActive
                            ? `rgba(224,122,95,${0.4 + barLevel * 0.6})`
                            : "rgba(224,122,95,0.15)",
                          transition: "height 60ms ease-out, background-color 60ms ease-out",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase">
                  {normalizedLevel > 0.05 ? "Mic is picking up sound" : "Speak to see levels"}
                </p>
              </div>

              <p className="text-muted-foreground text-lg font-medium" aria-live="polite">
                {isRecording ? "Release or tap to stop" : "Hold or tap to record"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
