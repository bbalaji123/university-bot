# University AI Chatbot FastAPI Service

This service is a local/offline RAG chatbot for university support data.

## Architecture

- Embeddings: sentence-transformers all-MiniLM-L6-v2
- Vector Search: FAISS cosine similarity
- Sentiment: transformers sentiment-analysis pipeline
- Translation: langdetect + MarianMT models
- Speech:
  - Text to Speech: pyttsx3
  - Speech to Text: Vosk (optional model path)
- Telegram: python-telegram-bot using the same /chat API

## Project Structure

backend/
- app/main.py
- app/model.py
- app/search.py
- app/data_loader.py
- app/sentiment.py
- app/translation.py
- app/speech.py
- app/telegram_bot.py
- data/university_data.txt
- requirements.txt
- Procfile
- runtime.txt

## Local Setup (Python 3.10)

1. Create and activate a virtual environment:
   - Windows PowerShell:
     - py -3.10 -m venv .venv
     - .\\.venv\\Scripts\\Activate.ps1
2. Install dependencies:
   - pip install -r requirements.txt
3. Configure environment:
   - copy .env.example .env
4. Start API:
   - uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
5. Health check:
   - GET http://localhost:8000/health

## Chat API

### POST /chat

Request JSON:
{
  "question": "What is the admission deadline?",
  "language": "en"
}

Response JSON:
{
  "reply": "Admissions open for undergraduate programs from April to June each year.",
  "sentiment": "neutral",
  "confidence": 0.76
}

If confidence is low, response is:
"Please contact university administration."

## Voice Endpoints

- POST /speech/synthesize
  - body: { "text": "hello" }
  - returns: { "audio_base64": "..." }

- POST /speech/transcribe
  - form-data file upload (wav)
  - requires VOSK_MODEL_PATH to be configured

## Telegram Integration

1. Create bot with BotFather and get token.
2. Set TELEGRAM_BOT_TOKEN in .env.
3. Start Telegram worker:
   - python -m app.telegram_bot

The bot forwards every user message to /chat and replies with the same response logic.

## Deployment

### Render (Backend)

1. Create a new Web Service from backend folder.
2. Environment:
   - Python version from runtime.txt (3.10.14)
3. Build command:
   - pip install -r requirements.txt
4. Start command:
   - uvicorn app.main:app --host 0.0.0.0 --port $PORT
5. Set environment variables from .env.example.

### Vercel (Frontend)

1. Deploy frontend folder to Vercel.
2. Add environment variable in Vercel:
   - VITE_AI_API_URL=https://your-render-service.onrender.com
3. Redeploy frontend.

## Frontend Integration Notes

- Existing chatbot page was upgraded to Material UI.
- It now calls FastAPI /chat endpoint.
- Voice input uses browser SpeechRecognition API.
- Voice output calls FastAPI /speech/synthesize endpoint.
- Language selector sends en/hi/te to backend.

## Dataset Notes

- Edit data/university_data.txt to improve answer coverage.
- Keep one sentence per line.
- Add multiple paraphrases for better retrieval quality.
