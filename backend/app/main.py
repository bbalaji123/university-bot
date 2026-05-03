import json
import os
import re
from difflib import get_close_matches
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .model import get_embedding_model
from .search import FALLBACK_REPLY, SemanticSearchEngine
from .sentiment import get_sentiment_service
from .speech import get_speech_service
from .translation import get_translation_service


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "university_data.txt"
CONFIDENCE_THRESHOLD = float(os.getenv("RAG_CONFIDENCE_THRESHOLD", "0.45"))


class ChatTurn(BaseModel):
    sender: Literal["user", "bot"]
    text: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    language: Optional[Literal["en", "hi", "te"]] = "en"
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    sentiment: Literal["positive", "neutral", "negative"]
    confidence: float


class SuggestResponse(BaseModel):
    suggestions: list[str]


class SpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: Optional[Literal["en", "hi", "te"]] = "en"


app = FastAPI(title="University AI Chatbot Service", version="1.0.0")

default_origins = ",".join(
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
)

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", default_origins).split(",") if origin.strip()]
cors_origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatEngine:
    SUGGESTION_STOPWORDS = {
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "for",
        "from",
        "how",
        "i",
        "in",
        "is",
        "it",
        "me",
        "of",
        "on",
        "or",
        "please",
        "tell",
        "the",
        "to",
        "want",
        "what",
        "when",
        "where",
        "with",
        "you",
        "about",
        "know",
        "details",
        "information",
    }

    SHORT_PREFIX_PRIORITY = {
        "v": ("vignan university", "vignan"),
        "vi": ("vignan university", "vignan"),
        "f": ("fees", "fee structure", "hostel fee", "tuition fee", "admission fee"),
        "fe": ("fees", "fee structure", "hostel fee", "tuition fee", "admission fee"),
        "s": ("scholarship", "scholarship eligibility", "how to apply scholarship"),
        "sc": ("scholarship", "scholarship eligibility", "how to apply scholarship"),
        "c": ("credits", "course credits", "courses", "course registration"),
        "cr": ("credits", "course credits", "add on credits"),
        "a": ("admission process", "admission", "admission eligibility"),
        "ad": ("admission process", "admission", "admission eligibility"),
        "h": ("hostel fee", "hostel facilities", "hostel"),
        "ho": ("hostel fee", "hostel facilities", "hostel"),
        "p": ("placement training", "placements", "placement"),
        "pl": ("placement training", "placements", "placement"),
        "t": ("transport routes", "transport", "transport fee"),
        "tr": ("transport routes", "transport", "transport fee"),
    }

    IMPORTANT_SUGGESTION_TOKENS = {
        "vignan",
        "university",
        "admission",
        "admissions",
        "fee",
        "fees",
        "tuition",
        "hostel",
        "scholarship",
        "scholarships",
        "eligibility",
        "credits",
        "credit",
        "course",
        "courses",
        "registration",
        "placement",
        "placements",
        "package",
        "internship",
        "internships",
        "transport",
        "routes",
        "library",
        "timings",
        "campus",
        "facilities",
        "dual",
        "degree",
        "cse",
        "ece",
        "eee",
        "mba",
        "mca",
        "btech",
        "mtech",
        "phd",
    }

    DOMAIN_MODIFIER_TOKENS = {
        "process",
        "eligibility",
        "apply",
        "application",
        "deadline",
        "fee",
        "fees",
        "timings",
        "routes",
        "training",
        "package",
        "registration",
        "facilities",
        "rules",
        "details",
        "structure",
    }

    GREETING_PHRASES = {
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "what's up",
        "whats up",
        "yo",
    }

    NON_GREETING_INTENT_WORDS = {
        "admission",
        "academic",
        "fee",
        "fees",
        "hostel",
        "scholarship",
        "placement",
        "transport",
        "library",
        "course",
        "result",
        "exam",
        "help",
        "support",
        "policy",
        "deadline",
        "when",
        "where",
        "how",
        "why",
        "what",
    }

    YES_NO_STARTERS = {
        "can",
        "could",
        "is",
        "are",
        "do",
        "does",
        "did",
        "will",
        "would",
        "should",
        "has",
        "have",
        "had",
        "may",
        "might",
        "am",
        "was",
        "were",
    }

    AFFIRMATIVE_SIGNALS = {
        "can",
        "allowed",
        "available",
        "provided",
        "offers",
        "offer",
        "supports",
        "eligible",
        "yes",
    }

    NEGATIVE_SIGNALS = {
        "cannot",
        "can't",
        "not",
        "no",
        "unavailable",
        "not allowed",
        "not available",
        "ineligible",
    }

    SCHOLARSHIP_TERMS = {
        "scholarship",
        "scholarships",
        "scholar ship",
        "स्कॉलरशिप",
        "स्कालरशिप",
        "छात्रवृत्ति",
    }

    APPLY_TERMS = {
        "apply",
        "application",
        "eligibility",
        "how to",
        "process",
        "कैसे",
        "अप्लाई",
        "आवेदन",
        "దరఖాస్తు",
        "ఎలా",
    }

    SCHOLARSHIP_URL = "http://160.187.169.12/student/scholarshipeligibilitynext22.jsp"

    ABUSIVE_TERMS = {
        "abuse",
        "bastard",
        "bitch",
        "bloody fool",
        "damn",
        "dumb",
        "fool",
        "fuck",
        "idiot",
        "loser",
        "moron",
        "nonsense",
        "shit",
        "stupid",
        "useless",
        "shut up",
        "shutup",
        "waste of time",
        "waste fellow",
        "bad ",
        "worst",
    }

    ABUSIVE_REGEX = re.compile(r"\b(?:" + "|".join(re.escape(term) for term in ABUSIVE_TERMS) + r")\b", re.IGNORECASE)

    DIRECT_TOKEN_CORRECTIONS = {
        "fir": "for",
        "fr": "for",
        "foor": "for",
        "feee": "fee",
        "feeses": "fees",
        "strcture": "structure",
        "strucure": "structure",
        "strcuture": "structure",
        "stucture": "structure",
        "sturcture": "structure",
        "admision": "admission",
        "admssion": "admission",
        "scholarhsip": "scholarship",
        "scholorship": "scholarship",
        "schlarship": "scholarship",
        "hosel": "hostel",
        "hostle": "hostel",
        "libary": "library",
        "tranport": "transport",
        "trasport": "transport",
        "plcement": "placement",
        "dint": "didnt",
    }

    KNOWN_QUERY_TERMS = {
        "a",
        "an",
        "and",
        "apply",
        "application",
        "are",
        "available",
        "branch",
        "campus",
        "can",
        "cse",
        "ece",
        "eee",
        "civil",
        "computer",
        "course",
        "date",
        "dates",
        "deadline",
        "details",
        "didnt",
        "eligibility",
        "exam",
        "fee",
        "fees",
        "for",
        "from",
        "hostel",
        "how",
        "i",
        "is",
        "it",
        "library",
        "mechanical",
        "need",
        "of",
        "payment",
        "placement",
        "policy",
        "process",
        "scholarship",
        "science",
        "semester",
        "structure",
        "support",
        "timings",
        "to",
        "transport",
        "tuition",
        "what",
        "when",
        "where",
        "year",
    }

    LOW_SIGNAL_TOKENS = {
        "a",
        "an",
        "and",
        "cse",
        "ece",
        "eee",
        "hi",
        "hello",
        "hey",
        "hmm",
        "k",
        "kk",
        "ok",
        "okay",
        "pls",
        "plz",
        "please",
        "test",
        "the",
        "yo",
    }

    SHORT_QUERY_EXPANSIONS = {
        "fees": "what is the fee structure",
        "fee": "what is the fee structure",
        "hostel": "what are the hostel facilities and hostel fee",
        "admission": "what is the admission process",
        "scholarship": "what scholarships are available",
        "placements": "what is the placement support process",
        "placement": "what is the placement support process",
        "library": "what are the library timings and rules",
        "transport": "what are the transport routes and fees",
    }

    SHORT_QUERY_CLARIFICATIONS = {
        "fees": "Do you mean hostel fee, tuition fee, or total yearly fee?",
        "fee": "Do you mean hostel fee, tuition fee, or total yearly fee?",
        "hostel": "Do you need hostel fee details, room facilities, or hostel rules?",
        "admission": "Do you need eligibility, required documents, or the admission timeline?",
        "scholarship": "Do you need scholarship eligibility, application steps, or deadline details?",
        "transport": "Do you need bus routes, transport timings, or transport fee details?",
        "placement": "Do you need placement training, eligibility, or recent placement statistics?",
        "placements": "Do you need placement training, eligibility, or recent placement statistics?",
    }

    INTENT_KEYWORDS = {
        "fee": {"fee", "fees", "tuition"},
        "scholarship": {"scholarship", "scholarships"},
        "credit": {"credit", "credits"},
        "course": {"course", "courses"},
        "admission": {"admission", "admissions"},
        "hostel": {"hostel", "hostels", "accommodation"},
        "placement": {"placement", "placements"},
        "transport": {"transport", "bus", "buses"},
    }

    INTENT_SPECIFIER_TOKENS = {
        "fee": {"hostel", "tuition", "admission", "registration", "semester", "annual", "yearly", "total"},
        "scholarship": {"eligibility", "apply", "application", "deadline", "documents", "criteria"},
        "credit": {"required", "earned", "total", "course", "degree", "lab", "lecture", "add", "honors", "minor"},
        "course": {"registration", "process", "credits", "deadline", "semester", "subjects", "list"},
        "admission": {"eligibility", "documents", "timeline", "dates", "entrance", "exam", "process"},
        "hostel": {"fee", "ac", "non", "rules", "facilities", "mess", "registration", "rooms"},
        "placement": {"training", "eligibility", "average", "highest", "package", "internship", "companies"},
        "transport": {"routes", "timings", "fee", "town", "city", "schedule"},
    }

    INTENT_CLARIFICATIONS = {
        "fee": "Do you mean hostel fee, tuition fee, admission fee, or total yearly fee?",
        "scholarship": "Do you want scholarship eligibility, how to apply, or deadline details?",
        "credit": "Do you want to know course credits, total credits required, or add-on credits?",
        "course": "Do you want course list details, course registration process, or course-credit rules?",
        "admission": "Do you need admission eligibility, required documents, or admission timeline details?",
        "hostel": "Do you need hostel fee details, room facilities, or hostel rules?",
        "placement": "Do you need placement training details, eligibility, or package statistics?",
        "transport": "Do you need bus routes, timings, or transport fee details?",
    }

    CLARIFICATION_FILLER_TOKENS = {
        "what",
        "about",
        "details",
        "detail",
        "info",
        "information",
        "tell",
        "me",
        "please",
        "need",
        "want",
        "know",
    }

    DISSATISFACTION_PHRASES = {
        "not helpful",
        "didn't help",
        "didnt help",
        "this is wrong",
        "wrong answer",
        "not correct",
        "you are wrong",
        "confusing",
        "does not make sense",
        "doesnt make sense",
    }

    SLANG_TOKEN_MAP = {
        "clg": "college",
        "uni": "university",
        "bro": "",
        "pls": "please",
        "plz": "please",
        "u": "you",
        "ur": "your",
        "wht": "what",
        "abt": "about",
        "msg": "message",
    }

    MIXED_LANGUAGE_REPLACEMENTS = {
        "kya hai": "what is",
        "kya": "what",
        "kaise": "how",
        "kitna": "how much",
        "kab": "when",
        "entha": "how much",
        "enti": "what",
        "ela": "how",
        "eppudu": "when",
        "enti bro": "what",
    }

    CONTEXTUAL_STARTERS = {
        "and",
        "also",
        "then",
        "what about",
        "how about",
        "that",
        "it",
        "its",
        "those",
        "these",
    }

    QUERY_WRAPPER_PHRASES = (
        "can you tell me about",
        "i want to know about",
        "please tell me about",
        "i need information about",
        "give me information about",
        "i want to know",
        "tell me about",
        "give me details on",
        "give me details about",
        "i need info on",
        "i need info about",
        "i need details about",
    )

    def __init__(self) -> None:
        self.search = SemanticSearchEngine(
            dataset_path=str(DATASET_PATH),
            embedding_model=get_embedding_model(),
            confidence_threshold=CONFIDENCE_THRESHOLD,
        )
        self.known_query_terms = set(self.KNOWN_QUERY_TERMS)
        self.known_query_terms.update(self._build_dataset_vocabulary())
        self.suggestion_phrases = self._build_suggestion_phrases()
        self.translation = get_translation_service()
        self.sentiment = get_sentiment_service()
        self.speech = get_speech_service(os.getenv("VOSK_MODEL_PATH"))

    def _build_dataset_vocabulary(self) -> set[str]:
        vocabulary: set[str] = set()
        for document in self.search.documents:
            for token in re.findall(r"[a-z0-9']+", document.lower()):
                if len(token) >= 2:
                    vocabulary.add(token)
        return vocabulary

    def _strip_query_wrappers(self, text: str) -> str:
        normalized = re.sub(r"\s+", " ", text.strip().lower())
        for phrase in self.QUERY_WRAPPER_PHRASES:
            prefix = f"{phrase} "
            if normalized.startswith(prefix):
                return normalized[len(prefix) :].strip()
        return normalized

    def _build_suggestion_phrases(self) -> list[str]:
        seed_suggestions: set[str] = {
            "vignan university",
            "fees",
            "hostel fee",
            "tuition fee",
            "admission fee",
            "scholarship",
            "scholarship eligibility",
            "how to apply scholarship",
            "credits",
            "course credits",
            "add on credits",
            "admission process",
            "hostel facilities",
            "placement training",
            "transport routes",
            "library timings",
        }
        suggestions: set[str] = set(seed_suggestions)

        token_frequency: dict[str, int] = {}
        for document in self.search.documents:
            for token in re.findall(r"[a-z0-9']+", document.lower()):
                token_frequency[token] = token_frequency.get(token, 0) + 1

        for document in self.search.documents:
            chunks = re.split(r"[\n\.!?;:]+", document.lower())
            for chunk in chunks:
                tokens = [token for token in re.findall(r"[a-z0-9']+", chunk) if token]
                if not tokens:
                    continue

                for token in tokens:
                    if len(token) < 2:
                        continue
                    if token in self.SUGGESTION_STOPWORDS:
                        continue
                    if token in self.IMPORTANT_SUGGESTION_TOKENS:
                        suggestions.add(token)

                upper_bound = min(3, len(tokens))
                for size in range(2, upper_bound + 1):
                    for start in range(len(tokens) - size + 1):
                        phrase_tokens = tokens[start : start + size]
                        if all(token in self.SUGGESTION_STOPWORDS for token in phrase_tokens):
                            continue

                        if not any(token in self.IMPORTANT_SUGGESTION_TOKENS for token in phrase_tokens):
                            continue

                        if phrase_tokens[0] in self.SUGGESTION_STOPWORDS:
                            continue

                        if phrase_tokens[0] not in self.IMPORTANT_SUGGESTION_TOKENS:
                            continue

                        important_count = sum(token in self.IMPORTANT_SUGGESTION_TOKENS for token in phrase_tokens)
                        modifier_count = sum(token in self.DOMAIN_MODIFIER_TOKENS for token in phrase_tokens)
                        if important_count < 2 and modifier_count == 0:
                            continue

                        phrase = " ".join(phrase_tokens).strip()
                        if 3 <= len(phrase) <= 40:
                            suggestions.add(phrase)

        filtered = {
            phrase
            for phrase in suggestions
            if any(token in self.IMPORTANT_SUGGESTION_TOKENS for token in re.findall(r"[a-z0-9']+", phrase))
            and (
                phrase in seed_suggestions
                or re.findall(r"[a-z0-9']+", phrase)[0] in self.IMPORTANT_SUGGESTION_TOKENS
            )
        }

        return sorted(filtered)

    def suggest(self, query: str, limit: int = 6) -> list[str]:
        normalized_query = re.sub(r"\s+", " ", query.lower()).strip()
        if not normalized_query:
            return []

        core_query = self._strip_query_wrappers(normalized_query)
        normalized_core = self._normalize_question_for_search(core_query)
        if not normalized_core:
            return []

        last_token = normalized_core.split()[-1]
        short_prefix = normalized_core if " " not in normalized_core and len(normalized_core) <= 2 else None
        priority_candidates = set(self.SHORT_PREFIX_PRIORITY.get(short_prefix, ())) if short_prefix else set()
        ranked: list[tuple[int, str]] = []

        for phrase in self.suggestion_phrases:
            score = -1
            if phrase.startswith(normalized_core):
                score = 300 - len(phrase)
            elif phrase.startswith(last_token):
                score = 220 - len(phrase)
            elif f" {last_token}" in phrase:
                score = 120 - len(phrase)

            if score < 0:
                continue

            if phrase in {"vignan university", "fees", "scholarship", "credits", "admission process"}:
                score += 20

            if priority_candidates and phrase in priority_candidates:
                score += 500

            ranked.append((score, phrase))

        ranked.sort(key=lambda item: (-item[0], item[1]))

        results: list[str] = []
        seen: set[str] = set()
        for _, phrase in ranked:
            if phrase in seen:
                continue
            seen.add(phrase)
            results.append(phrase)
            if len(results) >= max(1, min(limit, 10)):
                break

        return results

    @staticmethod
    def _time_based_greeting() -> str:
        hour = datetime.now().hour
        if hour < 12:
            return "Good morning"
        if hour < 17:
            return "Good afternoon"
        return "Good evening"

    def _is_greeting_only(self, text: str) -> bool:
        normalized = re.sub(r"[^a-z\s']", " ", text.lower()).strip()
        if not normalized:
            return False

        token_set = set(normalized.split())
        if token_set & self.NON_GREETING_INTENT_WORDS:
            return False

        if normalized in self.GREETING_PHRASES:
            return True

        for phrase in self.GREETING_PHRASES:
            if normalized.startswith(f"{phrase} ") and len(normalized.split()) <= 6:
                return True

        return False

    def _build_greeting_reply(self) -> str:
        salutation = self._time_based_greeting()
        return f"{salutation}! Hey there, I am your AI university assistant. How can I help you today?"

    def _is_yes_no_question(self, text: str) -> bool:
        normalized = re.sub(r"\s+", " ", text.lower()).strip()
        if not normalized:
            return False

        words = normalized.split()
        if not words:
            return False

        first_word = words[0]
        return first_word in self.YES_NO_STARTERS

    def _classify_binary_answer(self, answer: str) -> str:
        normalized = re.sub(r"\s+", " ", answer.lower()).strip()

        if any(signal in normalized for signal in self.NEGATIVE_SIGNALS):
            return "No"

        if any(signal in normalized for signal in self.AFFIRMATIVE_SIGNALS):
            return "Yes"

        return "Yes"

    def _format_binary_reply(self, answer: str) -> str:
        decision = self._classify_binary_answer(answer)
        return f"{decision}. {answer}"

    def _contains_any_term(self, text: str, terms: set[str]) -> bool:
        normalized = text.lower()
        return any(term in normalized for term in terms)

    def _is_scholarship_apply_intent(self, original_question: str, english_question: str) -> bool:
        normalized_original = re.sub(r"\s+", " ", original_question.lower()).strip()
        normalized_english = re.sub(r"\s+", " ", english_question.lower()).strip()

        has_scholarship = self._contains_any_term(normalized_original, self.SCHOLARSHIP_TERMS) or self._contains_any_term(
            normalized_english, self.SCHOLARSHIP_TERMS
        )
        has_apply = self._contains_any_term(normalized_original, self.APPLY_TERMS) or self._contains_any_term(
            normalized_english, self.APPLY_TERMS
        )

        return has_scholarship and has_apply

    def _build_scholarship_reply(self, target_language: str) -> str:
        if target_language == "hi":
            return (
                "स्कॉलरशिप के लिए आवेदन करने का तरीका:\n"
                f"लिंक खोलें: {self.SCHOLARSHIP_URL}\n"
                "1. ऑनलाइन scholarship application form भरें।\n"
                "2. जरूरी documents जमा करें (transcripts, essays, recommendation letters)।\n"
                "3. eligibility criteria पूरा करें (GPA/Enrollment status)।\n"
                "4. deadline से पहले apply करें (आमतौर पर Fall semester के लिए 15 March के आसपास)।\n"
                "Merit-based और need-based scholarships उपलब्ध हैं।"
            )

        if target_language == "te":
            return (
                "స్కాలర్‌షిప్‌కు అప్లై చేయడానికి విధానం:\n"
                f"ఈ లింక్ ఓపెన్ చేయండి: {self.SCHOLARSHIP_URL}\n"
                "1. ఆన్‌లైన్ scholarship application form పూర్తి చేయండి.\n"
                "2. అవసరమైన documents అప్లోడ్/సబ్మిట్ చేయండి (transcripts, essays, recommendation letters).\n"
                "3. eligibility criteria పూర్తి చేయండి (GPA/Enrollment status).\n"
                "4. deadline కి ముందే apply చేయండి (సాధారణంగా Fall semester కోసం March 15 ప్రాంతంలో).\n"
                "Merit-based మరియు need-based scholarships అందుబాటులో ఉన్నాయి."
            )

        return (
            "To apply for scholarships:\n"
            f"Visit this link: {self.SCHOLARSHIP_URL}\n"
            "1. Complete the scholarship application form online.\n"
            "2. Submit required documents (transcripts, essays, recommendation letters).\n"
            "3. Meet the eligibility criteria (GPA requirements, enrollment status).\n"
            "4. Apply before deadlines (typically around March 15 for fall semester).\n"
            "Merit-based and need-based scholarships are available."
        )

    def _contains_abusive_language(self, original_question: str, english_question: str) -> bool:
        normalized_original = re.sub(r"\s+", " ", original_question.lower()).strip()
        normalized_english = re.sub(r"\s+", " ", english_question.lower()).strip()
        return bool(self.ABUSIVE_REGEX.search(normalized_original) or self.ABUSIVE_REGEX.search(normalized_english))

    def _build_safety_disclaimer(self, target_language: str) -> str:
        if target_language == "hi":
            return (
                "कृपया सम्मानजनक भाषा का उपयोग करें। "
                "मैं केवल शैक्षणिक और विश्वविद्यालय सहायता से जुड़े प्रश्नों में मदद कर सकता/सकती हूं।"
            )

        if target_language == "te":
            return (
                "దయచేసి మర్యాదపూర్వక భాష ఉపయోగించండి. "
                "నేను విద్యా మరియు విశ్వవిద్యాలయ సహాయానికి సంబంధించిన ప్రశ్నలకే సహాయం చేస్తాను."
            )

        return (
            "Please use respectful language. "
            "I can help with academic and university support questions."
        )

    def _is_low_information_question(self, english_question: str) -> bool:
        normalized = re.sub(r"[^a-z0-9\s]", " ", english_question.lower())
        tokens = [token for token in normalized.split() if token]

        if not tokens:
            return True

        if len(tokens) == 1:
            return True

        if len(tokens) <= 3 and all(token in self.LOW_SIGNAL_TOKENS for token in tokens):
            return True

        alpha_chars = re.sub(r"[^a-z]", "", normalized)
        if alpha_chars and len(set(alpha_chars)) <= 2 and len(alpha_chars) >= 4:
            return True

        return False

    def _build_question_guidance_reply(self, target_language: str) -> str:
        if target_language == "hi":
            return (
                "कृपया एक स्पष्ट और पूरा प्रश्न पूछें। "
                "सिर्फ Vignan University से संबंधित प्रश्न पूछें, जैसे admissions, fees, scholarships, hostel, placements आदि।"
            )

        if target_language == "te":
            return (
                "దయచేసి స్పష్టమైన మరియు పూర్తి ప్రశ్న అడగండి. "
                "Vignan University కి సంబంధించిన ప్రశ్నలనే అడగండి, ఉదా: admissions, fees, scholarships, hostel, placements."
            )

        return (
            "Please ask a clear and complete question. "
            "Ask only Vignan University related questions, such as admissions, fees, scholarships, hostel, and placements."
        )

    def _normalize_question_for_search(self, text: str) -> str:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        tokens = [token for token in cleaned.split() if token]

        corrected_tokens: list[str] = []
        for token in tokens:
            if token.isdigit():
                corrected_tokens.append(token)
                continue

            if token in self.DIRECT_TOKEN_CORRECTIONS:
                corrected_tokens.append(self.DIRECT_TOKEN_CORRECTIONS[token])
                continue

            if token.endswith("s") and token[:-1] in self.known_query_terms:
                corrected_tokens.append(token[:-1])
                continue

            if len(token) >= 3 and token not in self.known_query_terms:
                close_match = get_close_matches(token, self.known_query_terms, n=1, cutoff=0.78)
                if close_match:
                    corrected_tokens.append(close_match[0])
                    continue

            corrected_tokens.append(token)

        normalized = " ".join(corrected_tokens)
        return re.sub(r"\s+", " ", normalized).strip()

    def _normalize_user_input(self, text: str) -> str:
        normalized = re.sub(r"\s+", " ", text.lower()).strip()

        for phrase, replacement in self.MIXED_LANGUAGE_REPLACEMENTS.items():
            normalized = re.sub(rf"\b{re.escape(phrase)}\b", replacement, normalized)

        tokens = re.findall(r"[a-z0-9']+", normalized)
        rewritten_tokens: list[str] = []
        for token in tokens:
            mapped = self.SLANG_TOKEN_MAP.get(token, token)
            if mapped:
                rewritten_tokens.append(mapped)

        cleaned_query = re.sub(r"\s+", " ", " ".join(rewritten_tokens)).strip()
        return self._strip_query_wrappers(cleaned_query)

    def _expand_short_query(self, english_question: str) -> str:
        tokens = [token for token in english_question.split() if token]
        if not tokens:
            return english_question

        if len(tokens) == 1 and tokens[0] in self.SHORT_QUERY_EXPANSIONS:
            return self.SHORT_QUERY_EXPANSIONS[tokens[0]]

        if len(tokens) == 2:
            compact = " ".join(tokens)
            if compact in self.SHORT_QUERY_EXPANSIONS:
                return self.SHORT_QUERY_EXPANSIONS[compact]

        return english_question

    def _detect_ambiguous_intent(self, english_question: str) -> Optional[str]:
        tokens = [token for token in self._normalize_question_for_search(english_question).split() if token]
        if not tokens:
            return None

        if len(tokens) > 5:
            return None

        matched_intents: list[str] = []
        for intent, keywords in self.INTENT_KEYWORDS.items():
            if any(token in keywords for token in tokens):
                matched_intents.append(intent)

        if len(matched_intents) != 1:
            return None

        intent = matched_intents[0]
        specifiers = self.INTENT_SPECIFIER_TOKENS.get(intent, set())
        if any(token in specifiers for token in tokens):
            return None

        core_tokens = [token for token in tokens if token not in self.CLARIFICATION_FILLER_TOKENS]
        if len(core_tokens) <= 2:
            return intent

        return None

    def _build_clarification_prompt(
        self,
        english_question: str,
        target_language: str,
        history: Optional[list[ChatTurn]] = None,
    ) -> Optional[str]:
        ambiguous_intent = self._detect_ambiguous_intent(english_question)
        if ambiguous_intent:
            clarification = self.INTENT_CLARIFICATIONS.get(ambiguous_intent)
            if clarification:
                return self.translation.from_english(clarification, target_lang=target_language)

        tokens = [token for token in english_question.split() if token]
        if not tokens:
            return self.translation.from_english("Could you share your question with a bit more detail?", target_lang=target_language)

        if len(tokens) == 1:
            key = tokens[0]
            clarification = self.SHORT_QUERY_CLARIFICATIONS.get(key)
            if clarification:
                return self.translation.from_english(clarification, target_lang=target_language)

        return None

    def _extract_last_user_question(self, history: list[ChatTurn]) -> Optional[str]:
        for turn in reversed(history):
            if turn.sender == "user" and turn.text.strip():
                return turn.text.strip()
        return None

    def _requires_contextual_merge(self, english_question: str) -> bool:
        normalized = english_question.strip().lower()
        if not normalized:
            return False

        if normalized in {"it", "that", "those", "these", "this"}:
            return True

        return any(normalized.startswith(starter + " ") for starter in self.CONTEXTUAL_STARTERS)

    def _merge_with_context(self, english_question: str, history: list[ChatTurn]) -> str:
        if not self._requires_contextual_merge(english_question):
            return english_question

        previous_question = self._extract_last_user_question(history)
        if not previous_question:
            return english_question

        previous_english = self.translation.to_english(previous_question, self.translation.detect_language(previous_question))
        previous_normalized = self._normalize_question_for_search(previous_english)
        current_normalized = self._normalize_question_for_search(english_question)

        if not previous_normalized:
            return current_normalized

        if not current_normalized:
            return previous_normalized

        return f"{previous_normalized} {current_normalized}".strip()

    def _is_dissatisfied_message(self, english_question: str) -> bool:
        normalized = re.sub(r"\s+", " ", english_question.lower()).strip()
        return any(phrase in normalized for phrase in self.DISSATISFACTION_PHRASES)

    def _build_retry_response(self, history: list[ChatTurn], target_language: str) -> Optional[ChatResponse]:
        previous_question = self._extract_last_user_question(history)
        if not previous_question:
            apology = "I'm sorry if that didn't help. Could you please provide more details so I can assist better?"
            return ChatResponse(
                reply=self.translation.from_english(apology, target_lang=target_language),
                sentiment="neutral",
                confidence=1.0,
            )

        previous_english = self.translation.to_english(previous_question, self.translation.detect_language(previous_question))
        previous_normalized = self._normalize_question_for_search(previous_english)
        search_result = self.search.search(previous_normalized)

        if search_result.answer == FALLBACK_REPLY:
            retry_message = (
                "I'm sorry if that didn't help. I still need more detail to answer correctly. "
                "Could you share the exact program, year, or category?"
            )
            return ChatResponse(
                reply=self.translation.from_english(retry_message, target_lang=target_language),
                sentiment="neutral",
                confidence=round(search_result.confidence, 4),
            )

        retry_message = (
            "I'm sorry if that didn't help. Let me try again. "
            f"{search_result.answer} "
            "If you want, I can narrow this down to your specific course or year."
        )

        return ChatResponse(
            reply=self.translation.from_english(retry_message, target_lang=target_language),
            sentiment="neutral",
            confidence=round(search_result.confidence, 4),
        )

    def ask(self, question: str, requested_language: Optional[str], history: Optional[list[ChatTurn]] = None) -> ChatResponse:
        conversation_history = history or []
        target_language = self.translation.resolve_language(requested_language, question)
        normalized_input = self._normalize_user_input(question)
        source_language = self.translation.detect_language(normalized_input or question)
        english_question = self.translation.to_english(normalized_input or question, source_lang=source_language)
        normalized_english_question = self._normalize_question_for_search(english_question)

        clarification_prompt = self._build_clarification_prompt(
            normalized_english_question,
            target_language,
            conversation_history,
        )
        if clarification_prompt:
            return ChatResponse(
                reply=clarification_prompt,
                sentiment="neutral",
                confidence=1.0,
            )

        expanded_english_question = self._expand_short_query(english_question)
        contextual_question = self._merge_with_context(expanded_english_question, conversation_history)
        normalized_english_question = self._normalize_question_for_search(contextual_question)

        if self._is_dissatisfied_message(normalized_english_question):
            retry_response = self._build_retry_response(conversation_history, target_language)
            if retry_response is not None:
                return retry_response

        if self._contains_abusive_language(question, normalized_english_question):
            return ChatResponse(
                reply=self._build_safety_disclaimer(target_language),
                sentiment="neutral",
                confidence=1.0,
            )

        if self._is_greeting_only(normalized_english_question):
            greeting_reply = self._build_greeting_reply()
            localized_greeting = self.translation.from_english(greeting_reply, target_lang=target_language)
            return ChatResponse(
                reply=localized_greeting,
                sentiment="neutral",
                confidence=1.0,
            )

        if self._is_low_information_question(normalized_english_question):
            return ChatResponse(
                reply=self._build_question_guidance_reply(target_language),
                sentiment="neutral",
                confidence=1.0,
            )

        if self._is_scholarship_apply_intent(question, normalized_english_question):
            return ChatResponse(
                reply=self._build_scholarship_reply(target_language),
                sentiment="neutral",
                confidence=0.99,
            )

        search_result = self.search.search(normalized_english_question)
        sentiment = self.sentiment.analyze(normalized_english_question)

        use_binary_format = (
            search_result.answer != FALLBACK_REPLY
            and self._is_yes_no_question(normalized_english_question)
        )

        if use_binary_format:
            english_reply = self._format_binary_reply(search_result.answer)
        else:
            english_reply = self.sentiment.apply_empathy(search_result.answer, sentiment)

        localized_reply = self.translation.from_english(english_reply, target_lang=target_language)

        if search_result.answer == FALLBACK_REPLY:
            localized_reply = self.translation.from_english(FALLBACK_REPLY, target_lang=target_language)

        return ChatResponse(
            reply=localized_reply,
            sentiment=sentiment,
            confidence=round(search_result.confidence, 4),
        )


@app.on_event("startup")
def startup_event() -> None:
    try:
        app.state.engine = ChatEngine()
    except Exception as startup_error:
        raise RuntimeError(f"Failed to initialize chatbot service: {startup_error}") from startup_error


@app.get("/health")
def health() -> dict:
    engine: ChatEngine = app.state.engine
    return {
        "status": "ok",
        "search": engine.search.health(),
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    engine: ChatEngine = app.state.engine
    try:
        return engine.ask(request.question.strip(), request.language, request.history)
    except Exception as chat_error:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {chat_error}") from chat_error


@app.get("/suggest", response_model=SuggestResponse)
def suggest(q: str = Query(..., min_length=1, max_length=200), limit: int = Query(default=6, ge=1, le=10)) -> SuggestResponse:
    engine: ChatEngine = app.state.engine
    try:
        suggestions = engine.suggest(q, limit=limit)
        return SuggestResponse(suggestions=suggestions)
    except Exception as suggest_error:
        raise HTTPException(status_code=500, detail=f"Suggestion processing failed: {suggest_error}") from suggest_error


@app.post("/speech/synthesize")
def synthesize_speech(request: SpeechRequest) -> dict:
    engine: ChatEngine = app.state.engine
    try:
        audio_base64, mime_type = engine.speech.synthesize_text(request.text.strip(), request.language)
        return {"audio_base64": audio_base64, "mime_type": mime_type}
    except Exception as speech_error:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {speech_error}") from speech_error


@app.post("/speech/transcribe")
async def transcribe_speech(file: UploadFile = File(...)) -> dict:
    engine: ChatEngine = app.state.engine

    try:
        wav_bytes = await file.read()
        raw_result = engine.speech.transcribe_wav_bytes(wav_bytes)
        parsed = json.loads(raw_result)
        return {"text": parsed.get("text", "").strip()}
    except Exception as transcription_error:
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {transcription_error}") from transcription_error
