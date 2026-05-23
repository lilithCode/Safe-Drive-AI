import { useCallback } from "react";

export const useAudio = () => {
  // 1. GENERATE BEEP (Master Alarm)
  const playAlarm = useCallback(() => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "square"; // Piercing "emergency" sound
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  }, []);

  // 2. AI VOICE ASSISTANCE
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any current speech to avoid overlapping
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice (Professional & Fast)
    utterance.rate = 1.1; // Slightly faster for urgency
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a specific high-quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female"));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  return { playAlarm, speak };
};