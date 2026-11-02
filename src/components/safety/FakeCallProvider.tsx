import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BatteryFull, CircleUserRound, Grid2X2, Mic, MicOff, Phone, PhoneCall, PhoneOff, Signal, Volume2, VolumeX, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createFakeCallRingtone } from "@/lib/fakeCallAudio";
import { cn } from "@/lib/utils";

const FakeCallContext = createContext<{ caller: string; setCaller: (name: string) => void; start: () => void } | null>(null);

export function useFakeCall() {
  const value = useContext(FakeCallContext);
  if (!value) throw new Error("Fake call controls need FakeCallProvider");
  return value;
}

export function FakeCallProvider({ children }: { children: ReactNode }) {
  const [caller, setCaller] = useState("Mum");
  const [state, setState] = useState<"idle" | "incoming" | "connected">("idle");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [digits, setDigits] = useState("");
  const [clock, setClock] = useState("");
  const sound = useRef<ReturnType<typeof createFakeCallRingtone> | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const answerButton = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    try { setCaller(localStorage.getItem("saferoute.fake-call.caller") || "Mum"); } catch { /* Device storage unavailable. */ }
    return () => { sound.current?.stop(); try { navigator.vibrate?.(0); } catch { /* Unsupported. */ } };
  }, []);

  function stopRinging() {
    sound.current?.stop();
    sound.current = null;
    try { navigator.vibrate?.(0); } catch { /* Unsupported. */ }
  }

  function end() {
    stopRinging();
    setState("idle");
    window.setTimeout(() => startButton.current?.focus(), 0);
  }

  function start() {
    stopRinging();
    try {
      sound.current = createFakeCallRingtone();
      void sound.current.ready.catch(() => toast.error("Sound could not start. Check your browser sound settings."));
    } catch { toast.error("Ringing sound is unavailable in this browser."); }
    setSeconds(0); setMuted(false); setSpeaker(false); setKeypad(false); setDigits("");
    setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setState("incoming");
    try { localStorage.setItem("saferoute.fake-call.caller", caller.trim() || "Mum"); } catch { /* Optional preference. */ }
  }

  useEffect(() => {
    if (state === "idle") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    answerButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { sound.current?.stop(); setState("idle"); try { navigator.vibrate?.(0); } catch { /* Unsupported. */ } }
      if (event.key === "Tab") {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-call-screen] button"));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", escape); };
  }, [state]);

  useEffect(() => {
    if (state !== "incoming") return;
    const vibrate = () => { try { navigator.vibrate?.([400, 200, 400]); } catch { /* Unsupported. */ } };
    vibrate();
    const timer = window.setInterval(vibrate, 2800);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "connected") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  const name = caller.trim() || "Mum";
  return (
    <FakeCallContext.Provider value={{ caller, setCaller, start }}>
      {state === "idle" && pathname !== "/fake-call" && (
        <div className="fixed bottom-6 left-4 z-40 hidden lg:block lg:left-[17.5rem]">
        <Button ref={startButton} onClick={start} className="h-12 gap-2 rounded-full border border-call-text/15 bg-call-surface px-5 text-call-text shadow-lift hover:bg-call-control" aria-label="Start fake call" title="Start fake call">
          <PhoneCall className="size-5" /><span>Fake call</span>
        </Button>
        </div>
      )}
      {children}
      {state !== "idle" && (
        <div data-call-screen role="dialog" aria-modal="true" aria-label={state === "incoming" ? `Incoming call from ${name}` : `Call with ${name}`} className="fixed inset-0 z-[100] overflow-y-auto bg-call-surface text-call-text">
          <div className="call-screen mx-auto flex min-h-dvh w-full max-w-md flex-col px-8">
            <div className="flex items-center justify-between py-5 text-sm font-medium" aria-hidden="true">
              <span>{clock}</span><div className="flex items-center gap-2"><Signal className="size-4" /><Wifi className="size-4" /><BatteryFull className="size-6" /></div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className={cn("mb-7 grid size-28 shrink-0 place-items-center rounded-full bg-call-control", state === "incoming" && "call-avatar-ringing")}>
                <CircleUserRound className="size-20 stroke-1 text-call-muted" aria-hidden="true" />
              </div>
              <h1 className="max-w-full break-words text-4xl font-medium tracking-normal">{name}</h1>
              <p className="mt-3 text-base text-call-muted">{state === "incoming" ? "mobile · incoming call" : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}</p>
            </div>
            {state === "connected" && (
              <div className="mb-10">
                {keypad ? <><p className="mb-4 min-h-7 break-all text-center text-xl">{digits || " "}</p><div className="grid grid-cols-3 justify-items-center gap-3">{["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => <Button key={digit} variant="ghost" className="size-14 rounded-full bg-call-control text-2xl hover:bg-call-text/20" onClick={() => setDigits((s) => (s + digit).slice(-24))}>{digit}</Button>)}</div></> : null}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div><Button variant="ghost" size="icon" aria-label="Mute simulated call" aria-pressed={muted} onClick={() => setMuted(!muted)} className={cn("size-16 rounded-full bg-call-control hover:bg-call-text/20", muted && "bg-call-text text-call-surface hover:bg-call-text/90")}>{muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}</Button><p className="mt-2 text-xs">mute</p></div>
                  <div><Button variant="ghost" size="icon" aria-label="Toggle keypad" aria-pressed={keypad} onClick={() => setKeypad(!keypad)} className="size-16 rounded-full bg-call-control hover:bg-call-text/20"><Grid2X2 className="size-6" /></Button><p className="mt-2 text-xs">keypad</p></div>
                  <div><Button variant="ghost" size="icon" aria-label="Speaker simulated call" aria-pressed={speaker} onClick={() => setSpeaker(!speaker)} className={cn("size-16 rounded-full bg-call-control hover:bg-call-text/20", speaker && "bg-call-text text-call-surface hover:bg-call-text/90")}>{speaker ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}</Button><p className="mt-2 text-xs">speaker</p></div>
                </div>
              </div>
            )}
            <div className="flex justify-around gap-12 pb-12 pt-6">
              <div className="text-center"><Button size="icon" aria-label={state === "incoming" ? "Decline call" : "End call"} onClick={end} className="size-20 rounded-full bg-call-decline text-call-text hover:bg-call-decline/90 [&_svg]:size-8"><PhoneOff /></Button><p className="mt-3 text-sm text-call-muted">{state === "incoming" ? "Decline" : "End call"}</p></div>
              {state === "incoming" && <div className="text-center"><Button ref={answerButton} size="icon" aria-label="Answer call" onClick={() => { stopRinging(); setState("connected"); }} className="size-20 rounded-full bg-call-answer text-call-text hover:bg-call-answer/90 [&_svg]:size-8"><Phone className="call-phone-ringing" /></Button><p className="mt-3 text-sm text-call-muted">Accept</p></div>}
            </div>
          </div>
        </div>
      )}
    </FakeCallContext.Provider>
  );
}