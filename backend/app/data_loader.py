from pathlib import Path
from typing import List


def load_university_data(file_path: str) -> List[str]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {file_path}")

    documents: List[str] = []
    current_block: List[str] = []

    with path.open("r", encoding="utf-8") as dataset_file:
        for raw_line in dataset_file:
            line = raw_line.strip()
            if line:
                current_block.append(line)
                continue

            if current_block:
                documents.append("\n".join(current_block))
                current_block = []

    if current_block:
        documents.append("\n".join(current_block))

    if not documents:
        raise ValueError("Dataset is empty. Add content to university_data.txt.")

    return documents
