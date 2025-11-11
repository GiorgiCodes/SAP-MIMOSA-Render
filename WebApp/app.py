from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
import json
import os
import re
import uvicorn
from WebApp.ai_models import OpenAIModel
from typing import List, Optional
from uuid import uuid4
from ValidationAndMapping.ScoreManager import ScoreManager
from ValidationAndMapping.Models import MappingQuery, SearchQuery, MappingEntry, Mapping as MappingDocument
from datetime import datetime
from fastapi import Query
from fastapi.responses import JSONResponse
import datetime

# Initialize FastAPI app
app = FastAPI()

# JSON storage file paths
storagePath = "Data/SAPMIMOSA.json"
rawDataStoragePath = "Data/rawDataOfAIResponses.json"

client = None

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("[WARNING] OPENAI_API_KEY not found. AI features will be disabled.")
    print("[WARNING] Please set OPENAI_API_KEY in Render environment variables")
else:
    try:
        client = OpenAI(api_key=openai_api_key)
        print(f"[SUCCESS] OpenAI client initialized successfully with key: {openai_api_key[:10]}...")
    except Exception as e:
        print(f"[ERROR] Failed to initialize OpenAI client: {e}")
        client = None

# Configure CORS origins from env var or fallback to localhost defaults
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:5000",
        "https://localhost:5001",
        "http://localhost:8000",
        "http://localhost:5015"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON file operations
def loadData(file_path):
    if not os.path.exists(file_path):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as file:
            default_data = []
            json.dump(default_data, file, ensure_ascii=False, indent=4)
        return default_data
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read().strip()
        if not content:
            return []
        return json.loads(content)

def convertDatetimes(obj):
    if isinstance(obj, dict):
        return {k: convertDatetimes(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convertDatetimes(i) for i in obj]
    elif isinstance(obj, datetime.datetime):
        return obj.isoformat(timespec="seconds")
    else:
        return obj

def saveData(data, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as file:
        data = convertDatetimes(data)
        json.dump(data, file, ensure_ascii=False, indent=4)

def storeRawDataOfAiResponses(mapping_doc):
    entry = mapping_doc.model_dump(mode="json")
    try:
        data = loadData(rawDataStoragePath)
        data.append(entry)
        saveData(data, rawDataStoragePath)
    except Exception as file_exc:
        print(f"Failed to write raw OpenAI response: {file_exc}")
        import traceback
        traceback.print_exc()

def extractJsonFromResponse(response_text):
    match = re.search(r"\`\`\`json\s*([\s\S]*?)\s*\`\`\`", response_text)
    if match:
        return match.group(1)
    match = re.search(r"(\[.*\]|\{.*\})", response_text, re.DOTALL)
    if match:
        return match.group(1)
    raise ValueError("No JSON found in AI response")

@app.get("/")
async def root():
    return {"status": "healthy", "service": "SAP-MIMOSA API", "message": "Backend is ready"}

@app.get("/health")
async def healthCheck():
    return {
        "status": "healthy",
        "service": "SAP-MIMOSA API",
        "timestamp": datetime.datetime.now().isoformat(),
        "openai_configured": client is not None
    }

@app.get("/system_message")
def getSystemMessage(improveMappings: bool):
    print(f"[v0] system_message endpoint called with improveMappings={improveMappings}")
    
    # For improving mappings
    if improveMappings == True:
        systemMessage = OpenAIModel.getImproveMappingsMessage()
    else:
        # For initial mapping
        systemMessage = OpenAIModel.getGenerateMappingMessage()
    
    print(f"[v0] Returning system message (length: {len(systemMessage)} chars)")
    return JSONResponse(content={"system_message": systemMessage})

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("[v0 STARTUP] FastAPI application starting...")
    print(f"[v0 STARTUP] OpenAI configured: {client is not None}")
    print(f"[v0 STARTUP] CORS origins: {origins}")
    print("[v0 STARTUP] Registered routes:")
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            print(f"  {list(route.methods)} {route.path}")
    print("="*50 + "\n")

@app.post("/ask_AI")
async def askAI(request: SearchQuery):
    try:
        print("\n" + "="*50)
        print(f"[v0 REQUEST] /ask_AI endpoint HIT!")
        print(f"[v0 REQUEST] Model: {request.llmModel}")
        print(f"[v0 REQUEST] Query length: {len(request.Query)} chars")
        print(f"[v0 REQUEST] System prompt length: {len(request.systemPrompt)} chars")
        print("="*50 + "\n")
        
        print(f"[v0] ask_AI called with model: {request.llmModel}")
        print(f"[v0] Query: {request.Query[:100]}...")
        
        # Check if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("[v0 ERROR] OPENAI_API_KEY not found in environment!")
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY in Render environment variables."
            )
        
        print(f"[v0] API key found: {api_key[:10]}...")
        
        llmModel = request.llmModel
        systemPrompt = request.systemPrompt                
        aiModel = OpenAIModel(request.Query, llmModel, request.mappings, systemPrompt)
        
        print("[v0] Calling OpenAI API...")
        
        try:
            response = aiModel.chat()
        except Exception as openai_error:
            print(f"[v0 ERROR] OpenAI call failed: {str(openai_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(openai_error)}"
            )
        
        result = response.choices[0].message.content
        print(f"[v0] OpenAI response received (length: {len(result)} chars)")
        print(f"[v0] First 200 chars: {result[:200]}")

        json_str = extractJsonFromResponse(result)
        mappingDocDict = json.loads(json_str)
        
        if isinstance(mappingDocDict, dict) and "mappings" in mappingDocDict:
            mappings = mappingDocDict["mappings"]
        elif isinstance(mappingDocDict, list):
            mappings = mappingDocDict
        else:
            raise ValueError(f"AI response is not a dict with a 'mappings' key or a list. Got: {mappingDocDict}")

        mappingEntries = [MappingEntry(**item) for item in mappings]
        mappingDoc = MappingDocument(
            LLMType=llmModel,
            mappings=mappingEntries,
            prompt=request.Query,
            createdAt=datetime.datetime.now().isoformat(timespec="seconds")
        )
       
        accuracyResult = await checkAccuracy(mappingEntries)
        mappingDoc.accuracyResult = accuracyResult["overall"]
        mappingDoc.accuracySingleMappingPair = accuracyResult["singlePairAccuracydetails"]
        
        storeRawDataOfAiResponses(mappingDoc)
        return mappingDoc

    except HTTPException:
        raise
    except Exception as e:
        print(f"[v0 ERROR] Error in ask_AI: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mappings")
async def getMappings():
    return loadData(storagePath)

@app.get("/mappings/{map_id}")
async def getMappings(map_id: str):
    data = loadData(storagePath)
    for doc in data:
        if str(doc.get("mapID")) == str(map_id):
            return doc
    raise HTTPException(status_code=404, detail="Mapping not found")

@app.post("/mappings")
async def createMappings(document: MappingDocument):
    data = loadData(storagePath)
    if not document.mapID:
        existing_ids = [
            int(doc["mapID"]) for doc in data
            if "mapID" in doc and str(doc["mapID"]).isdigit()
        ]
        next_id = max(existing_ids, default=0) + 1
        document.mapID = f"{next_id:03d}"
    data.append(document.dict(exclude_none=True))
    saveData(data, storagePath)
    return document

@app.put("/mappings/{map_id}")
async def updateMappings(map_id: str, document: MappingDocument):
    data = loadData(storagePath)
    updated = False
    for idx, doc in enumerate(data):
        if str(doc.get("mapID")) == str(map_id):
            data[idx] = document.dict(exclude_none=True)
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail=f"Mapping with mapID {map_id} not found.")
    saveData(data, storagePath)
    return document

@app.delete("/mappings/{map_id}")
async def deleteMappings(map_id: str):
    data = loadData(storagePath)
    originalLen = len(data)
    data = [doc for doc in data if str(doc.get("mapID")) != str(map_id)]
    if len(data) == originalLen:
        raise HTTPException(status_code=404, detail=f"Mapping with mapID {map_id} not found.")
    saveData(data, storagePath)
    return {"detail": f"Mapping with mapID {map_id} deleted successfully."}

@app.get("/fetchHistoricalData")
async def getFilterHistoricalData(createdDate: Optional[datetime.datetime] = Query(None)):
    data = loadData(rawDataStoragePath)
    if createdDate:
        createdDateStr = createdDate.isoformat(timespec="seconds")
        result = [
            map for map in data
            if map.get("createdAt") == createdDateStr
        ]
        return result
    return data

def to_decimals(d):
    return {k: (round(v * 100, 2) if isinstance(v, float) and v is not None else v) for k, v in d.items()}

@app.post("/check_accuracy")
async def checkAccuracy(entries: List[MappingEntry]):
    results = ScoreManager.scoreOutputWithDetails(entries)
    return {
        "overall": to_decimals(results["overall"].model_dump()),
        "singlePairAccuracydetails": [to_decimals(r.model_dump()) for r in results["singlePairAccuracydetails"]]
    }

def start():
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
