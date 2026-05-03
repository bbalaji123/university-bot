from dataclasses import dataclass
from typing import Dict, List, Optional

import os
import re

from .data_loader import load_university_data
from .model import EmbeddingModel


FALLBACK_REPLY = "Please contact university administration."


@dataclass
class SearchResult:
    answer: str
    confidence: float


class SemanticSearchEngine:
    def __init__(
        self,
        dataset_path: str,
        embedding_model: Optional[EmbeddingModel] = None,
        confidence_threshold: float = 0.45,
        lightweight: bool = False,
    ) -> None:
        self.embedding_model = embedding_model
        self.confidence_threshold = confidence_threshold
        self.documents = load_university_data(dataset_path)
        self.lightweight = lightweight or os.getenv("AI_LIGHTWEIGHT_MODE", "0").lower() in {"1", "true", "yes", "on"}
        self.document_tokens = [self._tokenize(document) for document in self.documents]

        self.index = None
        if not self.lightweight:
            self.index = self._build_index(self.documents)

    def _build_index(self, documents: List[str]):
        import faiss

        if self.embedding_model is None:
            raise RuntimeError("Embedding model is required for indexed search.")

        embeddings = self.embedding_model.encode(documents)
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        return index

    def _tokenize(self, text: str) -> set[str]:
        return set(re.findall(r"[a-z0-9']+", text.lower()))

    def search(self, question: str) -> SearchResult:
        if self.lightweight or self.index is None or self.embedding_model is None:
            query_tokens = self._tokenize(question)
            if not query_tokens:
                return SearchResult(answer=FALLBACK_REPLY, confidence=0.0)

            best_score = 0.0
            best_index = -1

            for index, document_tokens in enumerate(self.document_tokens):
                overlap = len(query_tokens & document_tokens)
                if overlap == 0:
                    continue

                score = overlap / max(len(query_tokens), 1)
                if score > best_score:
                    best_score = score
                    best_index = index

            if best_index < 0 or best_score < self.confidence_threshold:
                return SearchResult(answer=FALLBACK_REPLY, confidence=best_score)

            return SearchResult(answer=self.documents[best_index], confidence=best_score)

        query_embedding = self.embedding_model.encode([question])
        scores, indices = self.index.search(query_embedding, k=1)

        best_score = float(scores[0][0]) if scores.size else 0.0
        best_index = int(indices[0][0]) if indices.size else -1

        if best_index < 0 or best_score < self.confidence_threshold:
            return SearchResult(answer=FALLBACK_REPLY, confidence=best_score)

        return SearchResult(answer=self.documents[best_index], confidence=best_score)

    def health(self) -> Dict[str, float]:
        return {
            "documents": float(len(self.documents)),
            "threshold": float(self.confidence_threshold),
        }
