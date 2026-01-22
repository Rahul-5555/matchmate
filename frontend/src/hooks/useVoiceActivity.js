import { useEffect, useRef, useState } from "react";

const SILENCE_THRESHOLD = 0.02; // tweakable
const SILENCE_TIME = 3000; // ms

const useVoiceActivity = (stream) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    const data = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);

    analyserRef.current = analyser;
    dataRef.current = data;

    const detect = () => {
      analyser.getByteFrequencyData(data);
      const avg =
        data.reduce((sum, v) => sum + v, 0) / data.length / 255;

      if (avg > SILENCE_THRESHOLD) {
        setIsSpeaking(true);
        clearTimeout(silenceTimerRef.current);
      } else {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
            silenceTimerRef.current = null;
          }, SILENCE_TIME);
        }
      }

      requestAnimationFrame(detect);
    };

    detect();

    return () => {
      audioCtx.close();
      clearTimeout(silenceTimerRef.current);
    };
  }, [stream]);

  return { isSpeaking };
};

export default useVoiceActivity;
