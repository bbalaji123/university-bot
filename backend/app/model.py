from functools import lru_cache
from typing import List
import hashlib
import re

import numpy as np
from sentence_transformers import SentenceTransformer


class EmbeddingModel:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        self.model = None
        self.fallback_dim = 512
        try:
            self.model = SentenceTransformer(model_name)
        except Exception:
            # Offline-safe fallback: deterministic hashing embeddings.
            self.model = None

    def _fallback_encode(self, texts: List[str]) -> np.ndarray:
        vectors = np.zeros((len(texts), self.fallback_dim), dtype="float32")

        for row, text in enumerate(texts):
            tokens = re.findall(r"[a-z0-9']+", text.lower())
            if not tokens:
                continue

            for token in tokens:
                digest = hashlib.md5(token.encode("utf-8")).hexdigest()
                bucket = int(digest[:8], 16) % self.fallback_dim
                vectors[row, bucket] += 1.0

            norm = np.linalg.norm(vectors[row])
            if norm > 0:
                vectors[row] /= norm

        return vectors

    def encode(self, texts: List[str]) -> np.ndarray:
        if self.model is None:
            return self._fallback_encode(texts)

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.astype("float32")


@lru_cache(maxsize=1)
def get_embedding_model() -> EmbeddingModel:
    return EmbeddingModel()
