import { useEffect, useRef, useState } from "react";

const SILENCE_TIME = 800;

const useVoiceActivity = (stream) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastStateRef = useRef(false);
  const noiseFloorRef = useRef(0.01); // adaptive baseline

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;

    const resumeContext = async () => {
      if (audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch { }
      }
    };
    resumeContext();

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    const data = new Uint8Array(analyser.fftSize);
    source.connect(analyser);

    analyserRef.current = analyser;

    const detect = () => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      // 🔥 adaptive threshold
      noiseFloorRef.current =
        noiseFloorRef.current * 0.95 + rms * 0.05;

      const threshold = noiseFloorRef.current * 2.2;
      const speaking = rms > threshold;

      if (speaking !== lastStateRef.current) {
        lastStateRef.current = speaking;

        if (speaking) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setIsSpeaking(true);
        } else {
          silenceTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
            silenceTimerRef.current = null;
          }, SILENCE_TIME);
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(silenceTimerRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return { isSpeaking };
};

export default useVoiceActivity;
