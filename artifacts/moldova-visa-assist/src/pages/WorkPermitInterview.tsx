import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock3, Mic, Volume2, ShieldCheck, Camera, CameraOff } from "lucide-react";

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
  const [identityConsent, setIdentityConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selfieChecked, setSelfieChecked] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingMimeRef = useRef("video/webm");
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
  const timeoutSubmittedRef = useRef(false);
  const deadlineRef = useRef<number>(0);

  const stopMic = () => {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
  };

  async function finishAndUploadRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) throw new Error("Video/audio recording was not started. Please contact the administrator.");
    let blob: Blob;
    if (recorder.state !== "inactive") {
      blob = await new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener("stop", () => resolve(new Blob(recordingChunksRef.current, { type: recordingMimeRef.current })), { once: true });
        recorder.addEventListener("error", () => reject(new Error("The browser could not finish the recording.")), { once: true });
        try { recorder.stop(); } catch (error) { reject(error); }
      });
    } else {
      blob = new Blob(recordingChunksRef.current, { type: recordingMimeRef.current });
    }
    if (!blob.size) throw new Error("No video/audio data was recorded.");
    if (blob.size > 50 * 1024 * 1024) throw new Error("Recording exceeded 50 MB and could not be uploaded. Please contact the administrator.");
    const mimeType = (blob.type || recordingMimeRef.current).split(";")[0];
    const response = await fetch(`/api/interviews/${session!.interviewId}/recording`, {
      method: "PUT",
      headers: { "Content-Type": mimeType, "X-Interview-Token": session!.accessToken },
      body: blob,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save the video/audio recording.");
    mediaRecorderRef.current = null;
  }

  async function saveInterview(expired = false) {
    if (!session || saving || closed) return;
    setSaving(true);
    stopMic();
    try {
      await finishAndUploadRecording();
      const response = await fetch(`/api/interviews/${session.interviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current, accessToken: session.accessToken }),
      });
      const data = await response.json().catch(() => ({}));
      setClosed(true);
      if (!response.ok) {
        setStatusMessage(expired ? "Time is up. The interview is now closed." : (data.error || "The interview is closed."));
      } else {
        setStatusMessage(expired ? "Time is up. Your interview and recording have been submitted." : "Your interview and video/audio recording have been submitted.");
      }
    } catch (err: any) {
      setClosed(true);
      setStatusMessage((err?.message || "The recording could not be saved.") + " Please contact the administrator and provide your Work Permit Reference Number.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!session || closed) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !timeoutSubmittedRef.current) { timeoutSubmittedRef.current = true; void saveInterview(true); }
    };
    tick();
    const handle = window.setInterval(tick, 500);
    return () => window.clearInterval(handle);
  }, [session, closed]);

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

  useEffect(() => () => {
    stopMic();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  async function enableCamera() {
    setCameraError("");
    setSelfieChecked(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access. Please use an up-to-date browser.");
      }
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err: any) {
      setCameraReady(false);
      setCameraError(err?.message || "Camera access was denied. Allow camera permission and try again.");
    }
  }

  function confirmLiveFaceCheck() {
    if (!videoRef.current || !cameraStreamRef.current?.getVideoTracks().some(track => track.readyState === "live") ||
        videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      setCameraError("Please turn on the camera and wait until your live image appears.");
      return;
    }
    // Local live-camera check only; no image is captured or uploaded.
    setSelfieChecked(true);
    setCameraError("");
  }

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !identityConsent || !cameraReady || !selfieChecked) {
      toast({ title: "Identity check required", description: "Enable the camera, confirm your live image, and accept both consent statements before starting.", variant: "destructive" });
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast({ title: "Recording unavailable", description: "Please use an up-to-date browser that supports video/audio recording.", variant: "destructive" });
      return;
    }
    setStarting(true);
    let recordingStream: MediaStream | null = null;
    try {
      recordingStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15, max: 15 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = recordingStream;
      if (videoRef.current) { videoRef.current.srcObject = recordingStream; await videoRef.current.play().catch(() => {}); }
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: referenceNumber.trim().toUpperCase(), candidateName, consent: true, videoAudioConsent: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start interview");
      const preferredMime = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(recordingStream, { ...(preferredMime ? { mimeType: preferredMime } : {}), videoBitsPerSecond: 450000, audioBitsPerSecond: 64000 });
      recordingChunksRef.current = [];
      recordingMimeRef.current = recorder.mimeType || preferredMime || "video/webm";
      recorder.ondataavailable = event => { if (event.data?.size) recordingChunksRef.current.push(event.data); };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setSession(data);
      setAnswers(Array(data.questions.length).fill(""));
      setIndex(0);
      setSecondsLeft(data.durationSeconds);
      deadlineRef.current = Date.now() + data.durationSeconds * 1000;
      setClosed(false);
      timeoutSubmittedRef.current = false;
      setStatusMessage("");
    } catch (err: any) {
      recordingStream?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
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
          <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="rounded-full border border-white/30 px-4 py-2">10 questions</span><span className="rounded-full border border-white/30 px-4 py-2">10-minute limit</span><span className="rounded-full border border-white/30 px-4 py-2">Video + audio recorded with consent</span></div>
        </section>

        {!session ? (
          <form onSubmit={startInterview} className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm md:p-9">
            <h2 className="text-2xl font-bold text-primary">Start your interview</h2>
            <p className="text-muted-foreground">Use the Work Permit Reference Number shown when your application was submitted, for example <span className="font-mono">MVA-2026-ABC123</span>.</p>
            <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="reference">Work Permit Reference Number *</label><Input id="reference" required value={referenceNumber} onChange={e => setReferenceNumber(e.target.value.toUpperCase())} placeholder="MVA-2026-ABC123" autoCapitalize="characters" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="candidateName">Candidate name (optional)</label><Input id="candidateName" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Enter your name" /></div>
            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center gap-2 font-semibold"><Camera className="h-5 w-5" /> Live camera identity check</div>
              <p className="text-sm text-muted-foreground">Turn on your camera and check that your own face is visible before starting. The preview is not saved during this check. If you start the interview, your video and audio will be recorded and uploaded for authorised admin review, with your consent.</p>
              <video ref={videoRef} autoPlay muted playsInline className="mx-auto aspect-video w-full max-w-md rounded-lg bg-black object-cover" aria-label="Live camera preview" />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={enableCamera}><Camera className="mr-2 h-4 w-4" />{cameraReady ? "Restart camera" : "Turn on camera"}</Button>
                <Button type="button" variant="outline" onClick={confirmLiveFaceCheck} disabled={!cameraReady}><ShieldCheck className="mr-2 h-4 w-4" />Confirm my live face</Button>
                {cameraReady && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><CameraOff className="h-4 w-4" />Camera enabled</span>}
              </div>
              {selfieChecked && <p className="text-sm font-medium text-emerald-700">Live camera check confirmed on this device.</p>}
              {cameraError && <p role="alert" className="text-sm text-destructive">{cameraError}</p>}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm leading-6"><input className="mt-1" type="checkbox" checked={identityConsent} onChange={e => setIdentityConsent(e.target.checked)} /><span>I confirm that I am the applicant named on this application and I will personally complete this interview. I understand the camera preview alone cannot conclusively verify my identity.</span></label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-6"><input className="mt-1" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I explicitly consent to video and audio recording for the full interview (up to 10 minutes). The recording and my written answers will be securely stored on the server for authorised admin review. I understand the recording may contain my face and voice, and I can decline to proceed if I do not consent. This interview does not guarantee a job offer or work permit.</span></label>
            <Button type="submit" size="lg" className="w-full" disabled={starting || !consent || !identityConsent || !cameraReady || !selfieChecked}>{starting ? "Checking reference number…" : "Start interview"}</Button>
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
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Your video, audio, and answers are saved for admin review. The countdown cannot be paused. The interview will close automatically when the time limit ends.</p>
          </section>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">Moldova Visa Assist · Interview participation does not guarantee employment or permit approval.</p>
      </div>
    </div>
  );
}
