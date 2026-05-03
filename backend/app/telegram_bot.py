import asyncio
import os

import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters


CHAT_API_URL = os.getenv("CHAT_API_URL", "http://localhost:8000/chat")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        await update.message.reply_text(
            "Hi, I am your University AI Assistant. Ask any campus-related question."
        )


def ask_chat_service(question: str) -> str:
    response = requests.post(
        CHAT_API_URL,
        json={"question": question, "language": "en"},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    return str(payload.get("reply", "Please contact university administration."))


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return

    question = update.message.text.strip()
    if not question:
        return

    try:
        reply = await asyncio.to_thread(ask_chat_service, question)
    except Exception:
        reply = "Please contact university administration."

    await update.message.reply_text(reply)


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is missing.")

    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()


if __name__ == "__main__":
    main()
