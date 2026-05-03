from functools import lru_cache
import os
from typing import Dict, Optional, Tuple

from langdetect import detect
from transformers import pipeline

try:
    from deep_translator import GoogleTranslator
except Exception:  # pragma: no cover - optional dependency
    GoogleTranslator = None


SUPPORTED_LANGUAGES = {"en", "hi", "te"}

NLLB_MODEL = "facebook/nllb-200-distilled-600M"
NLLB_LANG_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "te": "tel_Telu",
}


class TranslationService:
    def __init__(self) -> None:
        self.translation_models: Dict[Tuple[str, str], str] = {
            ("hi", "en"): "Helsinki-NLP/opus-mt-hi-en",
            ("en", "hi"): "Helsinki-NLP/opus-mt-en-hi",
        }
        self.pipeline_cache: Dict[Tuple[str, str], object] = {}
        self.nllb_cache: Dict[Tuple[str, str], object] = {}
        self.enable_nllb_fallback = os.getenv("ENABLE_NLLB_FALLBACK", "false").lower() == "true"
        self.enable_web_fallback = os.getenv("ENABLE_WEB_TRANSLATION_FALLBACK", "true").lower() == "true"

    def _detect_language(self, text: str) -> str:
        try:
            detected = detect(text)
            return detected if detected in SUPPORTED_LANGUAGES else "en"
        except Exception:
            return "en"

    def detect_language(self, text: str) -> str:
        return self._detect_language(text)

    def _get_pipeline(self, source_lang: str, target_lang: str):
        pair = (source_lang, target_lang)
        if pair not in self.translation_models:
            return None

        if pair not in self.pipeline_cache:
            self.pipeline_cache[pair] = pipeline(
                task="translation",
                model=self.translation_models[pair],
            )

        return self.pipeline_cache[pair]

    def _get_nllb_pipeline(self, source_lang: str, target_lang: str):
        if not self.enable_nllb_fallback:
            return None

        source_code = NLLB_LANG_CODES.get(source_lang)
        target_code = NLLB_LANG_CODES.get(target_lang)

        if not source_code or not target_code:
            return None

        pair = (source_lang, target_lang)
        if pair not in self.nllb_cache:
            self.nllb_cache[pair] = pipeline(
                task="translation",
                model=NLLB_MODEL,
                src_lang=source_code,
                tgt_lang=target_code,
            )

        return self.nllb_cache[pair]

    def _translate_with_web_fallback(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        if not self.enable_web_fallback or GoogleTranslator is None:
            return None

        try:
            translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
            return translated if isinstance(translated, str) and translated.strip() else None
        except Exception:
            return None

    def resolve_language(self, requested_language: Optional[str], question: str) -> str:
        if requested_language and requested_language in SUPPORTED_LANGUAGES:
            return requested_language
        return self._detect_language(question)

    def to_english(self, text: str, source_lang: str) -> str:
        if source_lang == "en":
            return text

        try:
            translator = self._get_pipeline(source_lang, "en")
            if translator is None:
                translator = self._get_nllb_pipeline(source_lang, "en")
            if translator is None:
                fallback = self._translate_with_web_fallback(text, source_lang, "en")
                return fallback if fallback else text

            translated = translator(text, max_length=512)
            return str(translated[0]["translation_text"])
        except Exception:
            fallback = self._translate_with_web_fallback(text, source_lang, "en")
            return fallback if fallback else text

    def from_english(self, text: str, target_lang: str) -> str:
        if target_lang == "en":
            return text

        try:
            translator = self._get_pipeline("en", target_lang)
            if translator is None:
                translator = self._get_nllb_pipeline("en", target_lang)
            if translator is None:
                fallback = self._translate_with_web_fallback(text, "en", target_lang)
                return fallback if fallback else text

            translated = translator(text, max_length=512)
            return str(translated[0]["translation_text"])
        except Exception:
            fallback = self._translate_with_web_fallback(text, "en", target_lang)
            return fallback if fallback else text


@lru_cache(maxsize=1)
def get_translation_service() -> TranslationService:
    return TranslationService()
