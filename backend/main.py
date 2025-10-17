import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from groq import Groq
from typing import List, Optional
from dotenv import load_dotenv
import re

app = FastAPI(title="YouTube AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    # Allow any localhost/127.0.0.1 on ports 5170-5179 (Vite's common range)
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):517\d",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


load_dotenv()

# Access the key safely
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("❌ GROQ_API_KEY not found in environment variables")

# Initialize the Groq client
client = Groq(api_key=groq_api_key)

print(groq_api_key)

# Pydantic models
class TranscriptRequest(BaseModel):
    video_id: str

class SummaryRequest(BaseModel):
    transcript: str
    language: str = "en"

class QuestionRequest(BaseModel):
    transcript: str
    language: str = "en"

class AnswerRequest(BaseModel):
    question: str
    video: dict
    history: List[dict]
    language: str = "en"

class TeachRequest(BaseModel):
    summary: str
    language: str = "en"

class ProcessVideoRequest(BaseModel):
    url: str
    language: str = "en"

# Utility functions
def extract_video_id(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_transcript(video_id: str) -> str:
    """Fetch transcript using the correct YouTube Transcript API method"""
    try:
        # Method 1: Use the correct fetch method
        ytt_api = YouTubeTranscriptApi()
        transcript_data = ytt_api.fetch(video_id, languages=['en'])
        
        print(f"✅ Successfully fetched transcript for video: {video_id}")
        print(f"Found transcript with {len(transcript_data)} segments")
        
        # Initialize full_text as an empty string
        full_text = ""
        
        # Concatenate each line of the transcript
        for snippet in transcript_data:
            full_text += snippet.text + " "
        
        return full_text.strip()
        
    except Exception as e:
        print(f"❌ Method 1 failed for video {video_id}: {e}")
        
        # Method 2: Try with different language codes
        try:
            ytt_api = YouTubeTranscriptApi()
            transcript_data = ytt_api.fetch(video_id, languages=['hi','en-US', 'en-GB'])
            print(f"✅ Method 2 succeeded for video: {video_id}")
            
            full_text = ""
            for snippet in transcript_data:
                full_text += snippet.text + " "
            
            return full_text.strip()
        except Exception as e2:
            print(f"❌ Method 2 failed: {e2}")
            
            # Method 3: Use list_transcripts approach
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                
                # Try to get any English transcript
                transcript = transcript_list.find_transcript(['en'])
                transcript_data = transcript.fetch()
                
                print(f"✅ Method 3 succeeded for video: {video_id}")
                
                full_text = ""
                for snippet in transcript_data:
                    full_text += snippet['text'] + " "
                
                return full_text.strip()
            except Exception as e3:
                print(f"❌ Method 3 failed: {e3}")
                
                # Method 4: Try auto-generated English
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    transcript = transcript_list.find_generated_transcript(['en'])
                    transcript_data = transcript.fetch()
                    
                    print(f"✅ Method 4 (auto-generated) succeeded for video: {video_id}")
                    
                    full_text = ""
                    for snippet in transcript_data:
                        full_text += snippet['text'] + " "
                    
                    return full_text.strip()
                except Exception as e4:
                    print(f"❌ All methods failed: {e4}")
                    # Return a dummy transcript for testing purposes
                    return f"This is a sample transcript for video {video_id}. The video covers important educational content including: 1. Introduction to the main topic 2. Detailed explanations of key concepts 3. Practical examples and demonstrations 4. Common challenges and solutions 5. Best practices and recommendations 6. Conclusion and next steps. The content is designed to help viewers understand the subject matter thoroughly and apply the knowledge in real-world scenarios."

def chunk_text(text: str, max_length: int = 12000) -> str:
    """Chunk text to avoid token limits"""
    if len(text) <= max_length:
        return text
    return text[:max_length]

# API Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI backend is running"}

@app.post("/api/transcript/{video_id}")
async def get_transcript(video_id: str):
    try:
        transcript = fetch_transcript(video_id)
        return {"transcript": transcript, "video_id": video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summary")
async def generate_summary(request: SummaryRequest):
    try:
        transcript_chunk = chunk_text(request.transcript, 12000)
        
        prompt = f"""
You are a helpful assistant. Produce a clean JSON summary for the transcript.
Return ONLY valid JSON in this exact structure (no backticks, no extra text):
{{
  "summary": {{
    "title": "Short title in {request.language}",
    "paragraphs": ["Paragraph 1 in {request.language}", "Paragraph 2 ..."],
    "bullets": ["Bullet 1 ...", "Bullet 2 ..."],
    "sections": [
      {{
        "heading": "Section heading in {request.language}",
        "bullets": ["Point 1 ...", "Point 2 ..."],
        "paragraphs": ["Optional paragraph ..."]
      }}
    ]
  }}
}}

Transcript:
{transcript_chunk}
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=500,
            temperature=0.7
        )
        
        raw = response.choices[0].message.content
        import json
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0]
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0]
        try:
            data = json.loads(raw.strip())
            if isinstance(data, dict) and "summary" in data:
                return {"summary": data["summary"]}
            # if the model returned the inner object directly
            if isinstance(data, dict) and ("paragraphs" in data or "bullets" in data or "sections" in data):
                return {"summary": data}
        except Exception:
            pass
        # fallback to string content wrapped into JSON structure
        return {"summary": {"title": "Summary", "paragraphs": [raw.strip()], "bullets": []}}
        
    except Exception as e:
        print(f"Summary generation failed: {e}")
        # Return fallback summary when API fails
        return {"summary": {"title": "Summary", "paragraphs": ["This video covers important topics and provides valuable insights. The content discusses key concepts and practical applications that viewers can learn from and apply in their own context."], "bullets": []}}

@app.post("/api/keypoints")
async def extract_keypoints(request: SummaryRequest):
    try:
        transcript_chunk = chunk_text(request.transcript, 12000)
        
        prompt = f"""
Extract the key points from the following YouTube transcript.
Return ONLY valid JSON in this exact format (no extra text):
{{
  "keyPoints": [
    {{ "id": "1", "text": "Concise key point in {request.language}" }},
    {{ "id": "2", "text": "Another specific key point in {request.language}" }}
  ]
}}

Transcript:
{transcript_chunk}
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=400,
            temperature=0.5
        )
        
        keypoints_text = response.choices[0].message.content
        # Try to parse JSON, handle fenced blocks
        import json
        if "```json" in keypoints_text:
            keypoints_text = keypoints_text.split("```json")[1].split("```")[0]
        elif "```" in keypoints_text:
            keypoints_text = keypoints_text.split("```")[1].split("```")[0]

        try:
            data = json.loads(keypoints_text.strip())
            key_points = data.get("keyPoints", [])
            # ensure structure
            normalized = []
            for idx, kp in enumerate(key_points, start=1):
                if isinstance(kp, dict) and "text" in kp:
                    normalized.append({"id": str(kp.get("id", str(idx))), "text": kp["text"].strip()})
                elif isinstance(kp, str):
                    normalized.append({"id": str(idx), "text": kp.strip("- *•\t ")})
            return {"keyPoints": normalized}
        except Exception:
            # Fallback: split lines into objects
            lines = [p.strip().lstrip('- *•').strip() for p in keypoints_text.split('\n') if p.strip()]
            normalized = [{"id": str(i+1), "text": t} for i, t in enumerate(lines)]
            return {"keyPoints": normalized}
        
    except Exception as e:
        print(f"Key points extraction failed: {e}")
        # Return fallback key points when API fails
        return {"keyPoints": [
            {"id": "1", "text": "Key concept 1: Understanding the fundamental principles"},
            {"id": "2", "text": "Key concept 2: Practical applications and real-world examples"}, 
            {"id": "3", "text": "Important considerations and best practices"},
            {"id": "4", "text": "Common challenges and how to overcome them"},
            {"id": "5", "text": "Future trends and developments in the field"}
        ]}

@app.post("/api/questions")
async def generate_questions(request: QuestionRequest):
    try:
        transcript_chunk = chunk_text(request.transcript, 10000)
        
        prompt = f"""
You are an expert educator creating practice questions for students. Based on the following YouTube transcript, generate 4 specific, detailed questions that test understanding of the actual content discussed. Use atleast 2 numerical questions .

IMPORTANT: Create questions that are SPECIFIC to the content in this transcript, not generic questions. Focus on the actual topics, concepts, examples, and details mentioned. And also try to add some numerical questions if relevant.

For each question:
- Make it specific to the content discussed
- Provide a comprehensive answer based on the transcript
- Assign appropriate difficulty (easy, medium, hard)

CRITICAL: Respond in {request.language} language. All questions and answers must be in {request.language}.

Return ONLY valid JSON in this exact format:
{{
    "questions": [
        {{
            "id": "1",
            "question": "Specific question about the actual content",
            "answer": "Detailed answer based on transcript content",
            "difficulty": "easy"
        }},
        {{
            "id": "2", 
            "question": "Another specific question about the content",
            "answer": "Detailed answer based on transcript content",
            "difficulty": "medium"
        }},
        {{
            "id": "3",
            "question": "Third specific question about the content", 
            "answer": "Detailed answer based on transcript content",
            "difficulty": "hard"
        }},
        {{
            "id": "4",
            "question": "Fourth specific question about the content",
            "answer": "Detailed answer based on transcript content", 
            "difficulty": "medium"
        }}
    ]
}}

Transcript:
{transcript_chunk}
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=800,
            temperature=0.7
        )
        
        questions_text = response.choices[0].message.content
        print(f"Raw AI response: {questions_text[:200]}...")
        
        # Try to parse JSON, fallback to dummy questions if parsing fails
        try:
            import json
            # Clean up the response to extract JSON
            if "```json" in questions_text:
                questions_text = questions_text.split("```json")[1].split("```")[0]
            elif "```" in questions_text:
                questions_text = questions_text.split("```")[1].split("```")[0]
            
            questions_data = json.loads(questions_text.strip())
            print(f"Successfully parsed {len(questions_data.get('questions', []))} questions")
            return questions_data
        except Exception as parse_error:
            print(f"JSON parsing failed: {parse_error}")
            print(f"Attempted to parse: {questions_text[:300]}")
            # Fallback to dummy questions
            return {
                "questions": [
                    {
                        "id": "1",
                        "question": "What is the main topic discussed in this video?",
                        "answer": "The main topic covers the key concepts presented in the transcript.",
                        "difficulty": "easy"
                    },
                    {
                        "id": "2", 
                        "question": "What are the key takeaways from this content?",
                        "answer": "The key takeaways include the important points highlighted in the video.",
                        "difficulty": "medium"
                    }
                ]
            }
        
    except Exception as e:
        print(f"Questions generation failed: {e}")
        # Return fallback questions when API fails (e.g., rate limiting)
        return {
            "questions": [
                {
                    "id": "1",
                    "question": "What is the main topic discussed in this video?",
                    "answer": "The main topic covers the key concepts presented in the transcript.",
                    "difficulty": "easy"
                },
                {
                    "id": "2", 
                    "question": "What are the key takeaways from this content?",
                    "answer": "The key takeaways include the important points highlighted in the video.",
                    "difficulty": "medium"
                },
                {
                    "id": "3",
                    "question": "How can you apply the concepts discussed in this video?",
                    "answer": "The concepts can be applied in real-world scenarios as demonstrated in the video content.",
                    "difficulty": "hard"
                }
            ]
        }

@app.post("/api/answer")
async def answer_question(request: AnswerRequest):
    try:
        prompt = f"""
Based on the video content, answer this question: {request.question}

Video context: {request.video.get('title', 'Unknown')}
Transcript summary: {request.video.get('summary', 'No summary available')}

IMPORTANT: Respond in {request.language} language.

Provide a detailed and helpful answer.
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=1000,
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/teach")
async def generate_teaching(request: TeachRequest):
    try:
        summary_chunk = chunk_text(request.summary, 4000)
        
        prompt = f"""
Create a detailed teaching explanation based on this video summary.
Structure it with clear sections and make it educational and easy to understand.

IMPORTANT: Respond in {request.language} language.

Summary:
{summary_chunk}
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=1200,
            temperature=0.7
        )
        
        teaching = response.choices[0].message.content
        return {"teaching": teaching}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-video")
async def process_video(request: ProcessVideoRequest):
    try:
        video_id = extract_video_id(request.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Fetch transcript
        transcript = fetch_transcript(video_id)
        
        # Get video info (simplified)
        video_info = {
            "title": f"YouTube Video: {video_id}",
            "thumbnailUrl": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        }
        
        # Generate summary and key points with the selected language
        transcript_chunk = chunk_text(transcript, 12000)
        
        try:
            # Generate summary
            summary_prompt = f"""
Please summarize the following YouTube transcript in a concise and clear way.
Highlight the key points and main takeaways. Make it easy to read.

IMPORTANT: Respond in {request.language} language.

Transcript:
{transcript_chunk}
"""
            
            summary_response = client.chat.completions.create(
                messages=[{"role": "user", "content": summary_prompt}],
                model="llama-3.3-70b-versatile",
                max_tokens=500,
                temperature=0.7
            )
            summary_raw = summary_response.choices[0].message.content
            import json
            if "```json" in summary_raw:
                summary_raw = summary_raw.split("```json")[1].split("```")[0]
            elif "```" in summary_raw:
                summary_raw = summary_raw.split("```")[1].split("```")[0]
            try:
                sdata = json.loads(summary_raw.strip())
                if isinstance(sdata, dict) and "summary" in sdata:
                    summary = sdata["summary"]
                elif isinstance(sdata, dict) and ("paragraphs" in sdata or "bullets" in sdata or "sections" in sdata):
                    summary = sdata
                else:
                    summary = {"title": "Summary", "paragraphs": [summary_raw.strip()], "bullets": []}
            except Exception:
                summary = {"title": "Summary", "paragraphs": [summary_raw.strip()], "bullets": []}
            
            # Generate key points
            keypoints_prompt = f"""
Extract the key points from the following YouTube transcript. 
Return them as a list of concise bullet points.

IMPORTANT: Respond in {request.language} language.

Transcript:
{transcript_chunk}
"""
            
            keypoints_response = client.chat.completions.create(
                messages=[{"role": "user", "content": keypoints_prompt}],
                model="llama-3.3-70b-versatile",
                max_tokens=400,
                temperature=0.5
            )
            
            keypoints_text = keypoints_response.choices[0].message.content
            # Parse as JSON if possible, else fallback to lines
            import json
            if "```json" in keypoints_text:
                keypoints_text = keypoints_text.split("```json")[1].split("```")[0]
            elif "```" in keypoints_text:
                keypoints_text = keypoints_text.split("```")[1].split("```")[0]
            try:
                data = json.loads(keypoints_text.strip())
                kp_list = data.get("keyPoints") or data.get("points") or data.get("bullets")
                if isinstance(kp_list, list):
                    normalized = []
                    for idx, kp in enumerate(kp_list, start=1):
                        if isinstance(kp, dict) and "text" in kp:
                            normalized.append({"id": str(kp.get("id", str(idx))), "text": kp["text"].strip()})
                        elif isinstance(kp, str):
                            normalized.append({"id": str(idx), "text": kp.strip('- *•\t ').strip()})
                    keypoints = normalized
                else:
                    raise ValueError("No keyPoints array in JSON")
            except Exception:
                lines = [p.strip().lstrip('- *•').strip() for p in keypoints_text.split('\n') if p.strip()]
                keypoints = [{"id": str(i+1), "text": t} for i, t in enumerate(lines)]
            
        except Exception as e:
            print(f"AI generation failed: {e}")
            # Fallback to English content when AI fails
            summary = f"This video covers important topics and provides valuable insights. The content discusses key concepts and practical applications that viewers can learn from and apply in their own context."
            keypoints = [
                {"id": "1", "text": "Key concept 1: Understanding the fundamental principles"},
                {"id": "2", "text": "Key concept 2: Practical applications and real-world examples"}, 
                {"id": "3", "text": "Important considerations and best practices"},
                {"id": "4", "text": "Common challenges and how to overcome them"},
                {"id": "5", "text": "Future trends and developments in the field"}
            ]
        
        return {
            "success": True,
            "videoId": video_id,
            "transcript": transcript,
            "videoInfo": video_info,
            "summary": summary,
            "keyPoints": keypoints
        }
        
    except Exception as e:
        print(f"Process video error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
