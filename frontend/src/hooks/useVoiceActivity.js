import { useEffect, useRef, useState } from "react";

const DEFAULTS = {
  silenceTime: 800,   // ms
  smoothing: 0.95,    // noise floor smoothing
  sensitivity: 2.2,  // speech threshold multiplier
  fftSize: 1024,
};

const useVoiceActivity = (stream, options = {}) => {
  const {
    silenceTime,
    smoothing,
    sensitivity,
    fftSize,
  } = { ...DEFAULTS, ...options };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const lastStateRef = useRef(false);
  const noiseFloorRef = useRef(0.01);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!stream) return;

    mountedRef.current = true;
    let cancelled = false;

    const AudioCtx =
      window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.2;

    source.connect(analyser);
    analyserRef.current = analyser;

    const buffer = new Uint8Array(analyser.fftSize);

    const resumeAudio = async () => {
      if (audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch {
          /* ignore */
        }
      }
    };
    resumeAudio();

    const detect = () => {
      if (cancelled || !mountedRef.current) return;

      analyser.getByteTimeDomainData(buffer);

      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }

      const rms = Math.sqrt(sum / buffer.length);

      /* 🎯 Adaptive noise floor */
      noiseFloorRef.current =
        noiseFloorRef.current * smoothing +
        rms * (1 - smoothing);

      const threshold = noiseFloorRef.current * sensitivity;
      const speaking = rms > threshold;

      if (speaking !== lastStateRef.current) {
        lastStateRef.current = speaking;

        if (speaking) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;

          if (!isSpeaking) {
            setIsSpeaking(true);
          }
        } else {
          silenceTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setIsSpeaking(false);
            }
            silenceTimerRef.current = null;
          }, silenceTime);
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      mountedRef.current = false;
      cancelled = true;

      cancelAnimationFrame(rafRef.current);
      clearTimeout(silenceTimerRef.current);

      analyser.disconnect();
      source.disconnect();
      audioCtx.close();
    };
  }, [stream, silenceTime, smoothing, sensitivity, fftSize]);

  return { isSpeaking };
};

export default useVoiceActivity;
