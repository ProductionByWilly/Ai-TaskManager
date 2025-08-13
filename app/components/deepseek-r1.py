# deepseek-r1.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Configure OpenAI
openai.api_key = os.getenv("DEEPSEEK_API_KEY")
openai.api_base = os.getenv("DEEPSEEK_BASE_URL")

if not openai.api_key or not openai.api_base:
    raise ValueError("Missing required environment variables: DEEPSEEK_API_KEY or DEEPSEEK_BASE_URL")

class ChatMessage(BaseModel):
    messages: list

@app.post("/api/chat")
async def chat_endpoint(chat_message: ChatMessage):
    try:
        print("Received messages:", chat_message.messages)
        
        # Validate messages format
        if not isinstance(chat_message.messages, list):
            raise HTTPException(status_code=400, detail="Messages must be a list")
        
        for msg in chat_message.messages:
            if not isinstance(msg, dict) or "role" not in msg or "content" not in msg:
                raise HTTPException(status_code=400, detail="Invalid message format")

        response = openai.ChatCompletion.create(
            model="deepseek-chat",
            messages=chat_message.messages,
            max_tokens=2048,
            temperature=0.7
        )
        print("API Response:", response)
        return {"response": response.choices[0].message["content"]}
    except Exception as e:
        error_msg = str(e)
        print(f"Error during API call: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# For testing the API directly
if __name__ == "__main__":
    import uvicorn
    print("Starting server...")  # Debug log
    print(f"API Key configured: {'Yes' if openai.api_key else 'No'}")  # Debug log
    print(f"Base URL configured: {openai.api_base}")  # Debug log
    uvicorn.run(app, host="0.0.0.0", port=8080)