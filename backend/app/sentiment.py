from functools import lru_cache

from transformers import pipeline


NEGATIVE_EMOTION_WORDS = {
    "anxious",
    "angry",
    "depressed",
    "disappointed",
    "frustrated",
    "hopeless",
    "overwhelmed",
    "sad",
    "stressed",
    "upset",
    "worried",
}

POSITIVE_EMOTION_WORDS = {
    "confident",
    "excited",
    "glad",
    "great",
    "happy",
    "motivated",
    "relieved",
    "thankful",
}


class SentimentService:
    def __init__(self) -> None:
        self.classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
        )

    def analyze(self, text: str) -> str:
        normalized = text.lower().strip()
        if not normalized:
            return "neutral"

        tokens = set(normalized.replace("?", " ").replace("!", " ").split())

        if tokens & NEGATIVE_EMOTION_WORDS:
            return "negative"

        if tokens & POSITIVE_EMOTION_WORDS:
            return "positive"

        result = self.classifier(text[:512])[0]
        label = str(result.get("label", "NEUTRAL")).lower()
        score = float(result.get("score", 0.0))

        if score < 0.75:
            return "neutral"

        factual_starters = (
            "what",
            "when",
            "where",
            "which",
            "how",
            "can you",
            "please explain",
            "tell me",
        )

        if normalized.endswith("?") and normalized.startswith(factual_starters):
            return "neutral"

        if "neg" in label:
            return "negative"

        if "pos" in label:
            return "positive"

        return "neutral"

    def apply_empathy(self, text: str, sentiment: str) -> str:
        if sentiment == "negative":
            return f"Hello! {text}"
        return text


@lru_cache(maxsize=1)
def get_sentiment_service() -> SentimentService:
    return SentimentService()
