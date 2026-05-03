import base64
import contextlib
import tempfile
import wave
from functools import lru_cache
from pathlib import Path
from typing import Optional

from gtts import gTTS
import pyttsx3
from vosk import KaldiRecognizer, Model


class SpeechService:
    def __init__(self, vosk_model_path: Optional[str] = None) -> None:
        self.tts_engine = pyttsx3.init()
        self.vosk_model = None
        if vosk_model_path:
            model_path = Path(vosk_model_path)
            if model_path.exists():
                self.vosk_model = Model(str(model_path))

    def _synthesize_with_pyttsx3(self, text: str) -> tuple[str, str]:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            wav_path = temp_file.name

        self.tts_engine.save_to_file(text, wav_path)
        self.tts_engine.runAndWait()

        with open(wav_path, "rb") as audio_file:
            audio_b64 = base64.b64encode(audio_file.read()).decode("utf-8")

        Path(wav_path).unlink(missing_ok=True)
        return audio_b64, "audio/wav"

    def _synthesize_with_gtts(self, text: str, language: str) -> tuple[str, str]:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            mp3_path = temp_file.name

        tts = gTTS(text=text, lang=language, slow=False)
        tts.save(mp3_path)

        with open(mp3_path, "rb") as audio_file:
            audio_b64 = base64.b64encode(audio_file.read()).decode("utf-8")

        Path(mp3_path).unlink(missing_ok=True)
        return audio_b64, "audio/mpeg"

    def synthesize_text(self, text: str, language: Optional[str] = "en") -> tuple[str, str]:
        normalized_language = (language or "en").strip().lower()

        if normalized_language in {"hi", "te"}:
            try:
                return self._synthesize_with_gtts(text, normalized_language)
            except Exception:
                # Fall back to system TTS if online multilingual synthesis is unavailable.
                pass

        return self._synthesize_with_pyttsx3(text)

    def transcribe_wav_bytes(self, wav_bytes: bytes) -> str:
        if self.vosk_model is None:
            raise RuntimeError("Vosk model is not configured on server.")

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(wav_bytes)
            wav_path = temp_file.name

        with contextlib.closing(wave.open(wav_path, "rb")) as wav_file:
            if wav_file.getnchannels() != 1:
                raise RuntimeError("Audio must be mono WAV for Vosk.")

            recognizer = KaldiRecognizer(self.vosk_model, wav_file.getframerate())
            while True:
                chunk = wav_file.readframes(4000)
                if len(chunk) == 0:
                    break
                recognizer.AcceptWaveform(chunk)

        Path(wav_path).unlink(missing_ok=True)
        result = recognizer.FinalResult()
        return result


@lru_cache(maxsize=1)
def get_speech_service(vosk_model_path: Optional[str]) -> SpeechService:
    return SpeechService(vosk_model_path=vosk_model_path)
