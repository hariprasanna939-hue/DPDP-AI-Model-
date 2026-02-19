import os
import re
import numpy as np
from fastapi import FastAPI, UploadFile, File
from typing import List
from pydantic import BaseModel
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import tempfile
import shutil
import openai
from google import generativeai as genai
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="DPDP Compliance Backend API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure AI APIs
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize embedding model
# Note: 'all-MiniLM-L6-v2' will be downloaded on first run
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize FAISS index
embedding_dimension = 384
faiss_index = faiss.IndexFlatL2(embedding_dimension)
vector_store_texts = []
vector_store_metadata = []

# Helper function for PDF text extraction and chunking
def get_pdf_text_and_chunk(pdf_path, chunk_size=500, overlap=50):
    text = ""
    try:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return []

    text = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    current_chunk = ""
    sentences = re.split(r'(?<=[.!?])\s+', text)

    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 <= chunk_size:
            current_chunk += (sentence + " ")
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    if current_chunk:
        chunks.append(current_chunk.strip())

    processed_chunks = []
    for i, chunk_text in enumerate(chunks):
        processed_chunks.append({
            "text": chunk_text,
            "metadata": {"document_name": os.path.basename(pdf_path), "chunk_id": i}
        })
    return processed_chunks

# Pydantic models for request bodies
class TextChunk(BaseModel):
    text: str
    metadata: dict = {}

class SearchQuery(BaseModel):
    query: str
    k: int = 5

class ChatRequest(BaseModel):
    message: str
    model: str  # "chatgpt" or "gemini"
    history: List[dict] = []

# API Endpoints
@app.get("/health")
async def health_check():
    return {"status": "Backend is running!"}

@app.post("/upload-and-process-document/")
async def upload_and_process_document(file: UploadFile = File(...)):
    try:
        # Use a temporary directory that works on Windows/Linux
        # Create a temp file to save the uploaded content
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
                shutil.copyfileobj(file.file, tmp)
                file_location = tmp.name
        except Exception as e:
             return {"error": f"Failed to save temp file: {e}", "status": "failed"}

        extracted_text = ""
        try:
            if file.filename.lower().endswith('.pdf'):
                reader = PdfReader(file_location)
                for page in reader.pages:
                    extracted_text += page.extract_text() or ""
            elif file.filename.lower().endswith(('.txt')):
                with open(file_location, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            else:
                return {"error": "Unsupported file type. Please upload PDF or TXT.", "status": "failed"}
        finally:
            # Clean up the temp file
            if os.path.exists(file_location):
                try:
                    os.remove(file_location)
                except:
                    pass

        return {
            "filename": file.filename,
            "message": "File uploaded and text extracted successfully.",
            "extracted_text_snippet": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.post("/generate-and-store-embedding/")
async def generate_and_store_embedding(chunk: TextChunk):
    global faiss_index, vector_store_texts, vector_store_metadata

    try:
        embedding = embedding_model.encode(chunk.text, convert_to_tensor=False)
    except Exception as e:
        return {"message": f"Error generating embedding: {e}", "status": "failed"}

    faiss_index.add(np.array([embedding]))
    vector_store_texts.append(chunk.text)
    vector_store_metadata.append(chunk.metadata)

    return {"message": "Embedding generated and stored successfully.", "index_size": faiss_index.ntotal, "status": "success"}

@app.post("/search-vectors/")
async def search_vectors(query_data: SearchQuery):
    global faiss_index, vector_store_texts, vector_store_metadata

    if faiss_index.ntotal == 0:
        return {"message": "No vectors in the database to search.", "results": [], "status": "failed"}

    try:
        query_embedding = embedding_model.encode(query_data.query, convert_to_tensor=False)
    except Exception as e:
        return {"message": f"Error generating query embedding: {e}", "results": [], "status": "failed"}

    distances, indices = faiss_index.search(np.array([query_embedding]), query_data.k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(vector_store_texts):
            results.append({
                "text": vector_store_texts[idx],
                "metadata": vector_store_metadata[idx],
                "distance": float(distances[0][i])
            })

    return {"message": "Search completed successfully.", "results": results, "status": "success"}


@app.post("/chat/")
async def chat_with_ai(request: ChatRequest):
    try:
        if request.model == "chatgpt":
            messages = [{
                "role": "system", 
                "content": "You are a general-purpose AI assistant. You can help with any topic, including technology, business, law, general knowledge, and more. Do not restrict your responses to any specific domain. Provide helpful, accurate, and comprehensive output for any user query."
            }]
            messages.extend(request.history)
            messages.append({"role": "user", "content": request.message})

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=2000,
                temperature=0.7
            )
            ai_response = response.choices[0].message.content

        elif request.model == "gemini":
            # Set up safety settings to be unrestricted
            from google.generativeai.types import HarmCategory, HarmBlockThreshold
            
            safety_settings = [
                { "category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE },
                { "category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE },
                { "category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE },
                { "category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE },
            ]

            model = genai.GenerativeModel('gemini-pro', safety_settings=safety_settings)
            chat = model.start_chat(history=[])
            
            full_prompt = "You are a general-purpose AI assistant. You can help with any topic. Provide helpful and comprehensive output for any user query.\n\n"
            for msg in request.history:
                if msg["role"] == "user":
                    full_prompt += f"User: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    full_prompt += f"Assistant: {msg['content']}\n"
            full_prompt += f"User: {request.message}\nAssistant:"
            
            response = chat.send_message(full_prompt)
            ai_response = response.text

        else:
            return {"error": "Invalid model selected", "status": "failed"}

        return {"response": ai_response, "status": "success"}

    except Exception as e:
        return {"error": str(e), "status": "failed"}


# Ingestion of dpdp_act.pdf
@app.post("/ingest-dpdp-act/")
async def ingest_dpdp_act():
    global faiss_index, vector_store_texts, vector_store_metadata
    
    # Robust path finding
    document_path = os.path.join(os.getcwd(), 'dpdp_act.pdf')
    if not os.path.exists(document_path):
        # Fallback check common spots
        if os.path.exists("dpdp_act.pdf"):
            document_path = "dpdp_act.pdf"
        else:
             return {"message": f"File not found at {document_path}. Please place 'dpdp_act.pdf' in the backend directory.", "status": "failed"}

    act_chunks = get_pdf_text_and_chunk(document_path, chunk_size=500, overlap=50)

    if not act_chunks:
        return {"message": "Failed to extract or chunk DPDP Act PDF.", "status": "failed"}

    successful_ingestions = 0
    for i, chunk_data in enumerate(act_chunks):
        chunk_text = chunk_data['text']
        chunk_metadata = chunk_data['metadata']

        try:
            embedding = embedding_model.encode(chunk_text, convert_to_tensor=False)
            faiss_index.add(np.array([embedding]))
            vector_store_texts.append(chunk_text)
            vector_store_metadata.append(chunk_metadata)
            successful_ingestions += 1
        except Exception as e:
            print(f"Error generating embedding for chunk {i} from {document_path}: {e}")

    return {"message": f"Finished ingesting {successful_ingestions} successful chunks from {document_path}.", "total_vectors": faiss_index.ntotal, "status": "success"}

if __name__ == "__main__":
    import uvicorn
    # Run the API
    print("Starting Backend API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
