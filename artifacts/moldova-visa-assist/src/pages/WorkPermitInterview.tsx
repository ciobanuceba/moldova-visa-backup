import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock3, Mic, Volume2, ShieldCheck } from "lucide-react";

type InterviewSession = {
  interviewId: number;
  accessToken: string;
  referenceNumber: string;
  candidateName: string;
  jobTitle: string;
  questions: string[];
  durationSeconds: number;
  expiresAt: string;
};

export default function WorkPermitInterview() {
  const { toast } = useToast();
  const [referenceNumber, setReferenceNumber] = useState(() => new URLSearchParams(window.location.search).get("reference")?.toUpperCase() || "");
  const [candidateName, setCandidateName] = useState("");
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const answersRef = useRef<string[]>([]);
  const deadlineRef = useRef<number>(0);

  const stopMic = () => {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
  };

  async function saveInterview(expired = false) {
    if (!session || saving || closed) return;
    setSaving(true);
    stopMic();
    try {
      const response = await fetch(`/api/interviews/${session.interviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, accessToken: session.accessToken }),
      });
      const data = await response.json().catch(() => ({}));
      setClosed(true);
      if (!response.ok) {
        setStatusMessage(expired ? "Time is up. The interview is now closed." : (data.error || "The interview is closed."));
      } else {
        setStatusMessage(expired ? "Time is up. Your interview has been closed." : "Your interview answers have been submitted.");
      }
    } catch {
      setClosed(true);
      setStatusMessage("The interview has closed, but we could not confirm that your answers were saved. Please contact the administrator and provide your Work Permit Reference Number.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!session || closed) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) void saveInterview(true);
    };
    tick();
    const handle = window.setInterval(tick, 500);
    return () => window.clearInterval(handle);
  }, [session, closed, answers]);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (!session || closed) return;
    const handle = window.setInterval(() => {
      if (Date.now() >= deadlineRef.current) return;
      fetch(`/api/interviews/${session.interviewId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current, accessToken: session.accessToken }),
      }).catch(() => {});
    }, 5000);
    return () => window.clearInterval(handle);
  }, [session, closed]);

  useEffect(() => () => stopMic(), []);

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Consent required", description: "Please confirm that you understand this AI interview demonstration.", variant: "destructive" });
      return;
    }
    setStarting(true);
    try {
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: referenceNumber.trim().toUpperCase(), candidateName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start interview");
      setSession(data);
      setAnswers(Array(data.questions.length).fill(""));
      setIndex(0);
      setSecondsLeft(data.durationSeconds);
      deadlineRef.current = Date.now() + data.durationSeconds * 1000;
      setClosed(false);
      setStatusMessage("");
    } catch (err: any) {
      toast({ title: "Unable to start interview", description: err.message || "Please check the reference number.", variant: "destructive" });
    } finally {
      setStarting(false);
    }
  }

  function readQuestion() {
    const text = session?.questions[index];
    if (!text || !("speechSynthesis" in window)) {
      toast({ title: "Audio unavailable", description: "Your browser cannot read the question aloud. You can still read and answer it on screen." });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function startMic() {
    if (!session || closed || secondsLeft <= 0) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Microphone speech input not supported", description: "Please use Chrome or type your answer into the answer box.", variant: "destructive" });
      return;
    }
    stopMic();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const spoken = Array.from(event.results as any).slice(event.resultIndex).map((result: any) => result[0].transcript).join(" ");
      if (spoken) setAnswers(prev => prev.map((a, i) => i === index ? (a ? a + " " : "") + spoken : a));
    };
    recognition.onerror = () => toast({ title: "Microphone issue", description: "Check browser microphone permission or type your answer." });
    recognitionRef.current = recognition;
    recognition.start();
  }

  const updateAnswer = (value: string) => setAnswers(prev => prev.map((a, i) => i === index ? value : a));
  const goNext = () => { stopMic(); setIndex(i => Math.min((session?.questions.length || 1) - 1, i + 1)); };
  const goPrevious = () => { stopMic(); setIndex(i => Math.max(0, i - 1)); };
  const timeLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">MVA</div>
          <div><div className="font-semibold text-primary">Moldova Visa Assist</div><div className="text-sm text-muted-foreground">Greenhouse Worker Interview</div></div>
        </div>
        <section className="mb-6 rounded-3xl bg-emerald-900 p-7 text-white md:p-10">
          <p className="mb-3 text-xs font-bold tracking-[.18em] text-emerald-100">AI INTERVIEW · ENGLISH</p>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Greenhouse Worker Interview</h1>
          <p className="max-w-2xl text-lg leading-8 text-emerald-50">Enter the Work Permit Reference Number already issued for your application. Answer 10 questions in English within 10 minutes.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="rounded-full border border-white/30 px-4 py-2">10 questions</span><span className="rounded-full border border-white/30 px-4 py-2">10-minute limit</span><span className="rounded-full border border-white/30 px-4 py-2">No audio recording saved</span></div>
        </section>

        {!session ? (
          <form onSubmit={startInterview} className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm md:p-9">
            <h2 className="text-2xl font-bold text-primary">Start your interview</h2>
            <p className="text-muted-foreground">Use the Work Permit Reference Number shown when your application was submitted, for example <span className="font-mono">MVA-2026-ABC123</span>.</p>
            <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="reference">Work Permit Reference Number *</label><Input id="reference" required value={referenceNumber} onChange={e => setReferenceNumber(e.target.value.toUpperCase())} placeholder="MVA-2026-ABC123" autoCapitalize="characters" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="candidateName">Candidate name (optional)</label><Input id="candidateName" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Enter your name" /></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-6"><input className="mt-1" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I understand this is an AI interview. My written/transcribed answers will be saved against my Work Permit Reference Number for admin review. Audio recordings are not saved. This interview does not guarantee a job offer or work permit.</span></label>
            <Button type="submit" size="lg" className="w-full" disabled={starting || !consent}>{starting ? "Checking reference number…" : "Start interview"}</Button>
          </form>
        ) : closed ? (
          <section className="rounded-3xl border bg-card p-7 shadow-sm md:p-9">
            <div className="mb-4 flex items-center gap-2 text-emerald-700"><ShieldCheck className="h-6 w-6" /><span className="font-semibold">Interview closed</span></div>
            <h2 className="mb-3 text-2xl font-bold">{statusMessage}</h2>
            <p className="mb-2 text-muted-foreground">Work Permit Reference Number</p>
            <p className="mb-6 break-all rounded-lg bg-muted p-3 font-mono font-bold">{session.referenceNumber}</p>
            <p className="text-sm text-muted-foreground">Keep this number for any follow-up with Moldova Visa Assist.</p>
            <Button asChild variant="outline" className="mt-6"><Link href="/">Return to Home</Link></Button>
          </section>
        ) : (
          <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-9">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">Question {index + 1} of {session.questions.length}</span>
              <span className={`flex items-center gap-2 font-mono text-lg font-bold ${secondsLeft <= 60 ? "text-red-600" : "text-primary"}`}><Clock3 className="h-5 w-5" />{timeLabel} remaining</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-700 transition-all" style={{ width: `${((index + 1) / session.questions.length) * 100}%` }} /></div>
            <div className="mb-3 text-sm text-muted-foreground">Reference: <span className="font-mono font-semibold text-foreground">{session.referenceNumber}</span></div>
            <h2 className="mb-6 text-2xl font-bold leading-snug text-primary md:text-3xl">{session.questions[index]}</h2>
            <div className="mb-5 flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={readQuestion}><Volume2 className="mr-2 h-4 w-4" />Read question aloud</Button><Button type="button" variant="secondary" onClick={startMic}><Mic className="mr-2 h-4 w-4" />Start microphone</Button><Button type="button" variant="outline" onClick={stopMic}>Stop microphone</Button></div>
            <label htmlFor="answer" className="mb-2 block font-semibold">Your answer (English)</label>
            <Textarea id="answer" value={answers[index] || ""} onChange={e => updateAnswer(e.target.value)} disabled={secondsLeft <= 0 || saving} rows={5} maxLength={12000} placeholder="Speak using the microphone or type your answer here…" className="mb-5 text-base" />
            <div className="flex flex-wrap justify-between gap-3"><Button type="button" variant="outline" onClick={goPrevious} disabled={index === 0 || secondsLeft <= 0}>Previous</Button>{index < session.questions.length - 1 ? <Button type="button" onClick={goNext} disabled={secondsLeft <= 0}>Save answer & continue</Button> : <Button type="button" onClick={() => void saveInterview(false)} disabled={saving}>{saving ? "Submitting…" : "Submit interview"}</Button>}</div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Your answers are saved for admin review. The countdown cannot be paused. The interview will close automatically when the time limit ends.</p>
          </section>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">Moldova Visa Assist · Interview participation does not guarantee employment or permit approval.</p>
      </div>
    </div>
  );
}
