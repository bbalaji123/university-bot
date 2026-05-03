from dataclasses import dataclass
from typing import Dict, List

import faiss
import numpy as np

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
        embedding_model: EmbeddingModel,
        confidence_threshold: float = 0.45,
    ) -> None:
        self.embedding_model = embedding_model
        self.confidence_threshold = confidence_threshold
        self.documents = load_university_data(dataset_path)
        self.index = self._build_index(self.documents)

    def _build_index(self, documents: List[str]) -> faiss.IndexFlatIP:
        embeddings = self.embedding_model.encode(documents)
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        return index

    def search(self, question: str) -> SearchResult:
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
