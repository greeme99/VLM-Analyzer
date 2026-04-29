"""
FastAPI-based Motion Analysis Server
Handles video upload, analysis, and result storage
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional
import logging

from analysis_pipeline import MotionAnalysisPipeline, get_video_duration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Motion Analysis Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv"}

# Initialize analysis pipeline
pipeline = MotionAnalysisPipeline()

# In-memory job tracking (in production, use database)
analysis_jobs = {}


# ============================================================================
# Models
# ============================================================================

class AnalysisRequest:
    """Analysis request metadata"""
    def __init__(self, project_id: int, user_id: int, title: str):
        self.project_id = project_id
        self.user_id = user_id
        self.title = title
        self.status = "pending"
        self.result = None
        self.error = None


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "motion-analysis-server"}


@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    project_id: int = None,
    user_id: int = None,
    title: str = "Untitled Analysis",
    background_tasks: BackgroundTasks = None
):
    """
    Upload and analyze video
    Returns job ID for tracking
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Save uploaded file
        job_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{job_id}{file_ext}"
        
        contents = await file.read()
        if len(contents) > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"[Job {job_id}] Video saved: {file_path}")
        
        # Get video duration
        duration = get_video_duration(str(file_path))
        
        # Create job record
        job = AnalysisRequest(project_id, user_id, title)
        analysis_jobs[job_id] = job
        
        # Start analysis in background
        if background_tasks:
            background_tasks.add_task(
                run_analysis,
                job_id=job_id,
                file_path=str(file_path),
                project_id=project_id,
                user_id=user_id
            )
        
        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Analysis queued",
            "video_duration": duration
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze/{job_id}")
async def get_analysis_status(job_id: str):
    """Get analysis status and results"""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    response = {
        "job_id": job_id,
        "status": job.status,
        "title": job.title,
    }
    
    if job.result:
        response["result"] = job.result
    
    if job.error:
        response["error"] = job.error
    
    return response


@app.post("/analyze/{job_id}/cancel")
async def cancel_analysis(job_id: str):
    """Cancel ongoing analysis"""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    if job.status == "analyzing":
        job.status = "cancelled"
        return {"status": "cancelled", "job_id": job_id}
    
    return {"status": job.status, "job_id": job_id}


@app.post("/correct")
async def correct_motion_event(
    project_id: int,
    event_id: int,
    new_code: str,
    reason: Optional[str] = None,
    comment: Optional[str] = None
):
    """
    Correct a motion event MODAPTS code
    """
    try:
        # In production, update database
        return {
            "status": "success",
            "event_id": event_id,
            "new_code": new_code,
            "message": "Motion event corrected"
        }
    except Exception as e:
        logger.error(f"Error correcting event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/codes")
async def get_modapts_codes():
    """Get available MODAPTS codes reference"""
    codes = {
        "move": {
            "M1": {"mods": 1, "description": "Finger move (2.5cm)", "seconds": 0.129},
            "M2": {"mods": 2, "description": "Hand move (5cm)", "seconds": 0.258},
            "M3": {"mods": 3, "description": "Forearm move (15cm)", "seconds": 0.387},
            "M4": {"mods": 4, "description": "Arm move (30cm)", "seconds": 0.516},
            "M5": {"mods": 5, "description": "Arm + torso move (60cm)", "seconds": 0.645},
            "M6": {"mods": 6, "description": "Full body move (90cm+)", "seconds": 0.774},
        },
        "get": {
            "G0": {"mods": 0, "description": "Finger grasp (easy)", "seconds": 0},
            "G1": {"mods": 1, "description": "Hand grasp (normal)", "seconds": 0.129},
            "G2": {"mods": 2, "description": "Two-hand grasp (heavy)", "seconds": 0.258},
            "G3": {"mods": 3, "description": "Tool grasp", "seconds": 0.387},
        },
        "place": {
            "P0": {"mods": 0, "description": "Light place", "seconds": 0},
            "P1": {"mods": 1, "description": "Normal place", "seconds": 0.129},
            "P2": {"mods": 2, "description": "Careful place", "seconds": 0.258},
        },
        "other": {
            "D3": {"mods": 3, "description": "Decision", "seconds": 0.387},
            "L1": {"mods": 1, "description": "Read (short)", "seconds": 0.129},
            "E2": {"mods": 2, "description": "Eye move", "seconds": 0.258},
            "F3": {"mods": 3, "description": "Foot move", "seconds": 0.387},
            "R2": {"mods": 2, "description": "Read (general)", "seconds": 0.258},
        }
    }
    return codes


# ============================================================================
# Background Tasks
# ============================================================================

async def run_analysis(job_id: str, file_path: str, project_id: int, user_id: int):
    """Run analysis in background"""
    job = analysis_jobs[job_id]
    
    try:
        job.status = "analyzing"
        logger.info(f"[Job {job_id}] Starting analysis...")
        
        # Run analysis pipeline
        result = pipeline.analyze_video(file_path, target_fps=2.0)
        
        if result.get("status") == "success":
            job.result = result
            job.status = "completed"
            logger.info(f"[Job {job_id}] Analysis completed")
            
            # In production, save results to database
            # await save_analysis_result(project_id, user_id, result)
        else:
            job.error = result.get("message", "Unknown error")
            job.status = "failed"
            logger.error(f"[Job {job_id}] Analysis failed: {job.error}")
    
    except Exception as e:
        job.error = str(e)
        job.status = "failed"
        logger.error(f"[Job {job_id}] Exception during analysis: {e}")
    
    finally:
        # Clean up uploaded file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"[Job {job_id}] Cleaned up temporary file")
        except Exception as e:
            logger.warning(f"[Job {job_id}] Failed to clean up file: {e}")


# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("Motion Analysis Server starting...")
    logger.info(f"Upload directory: {UPLOAD_DIR.absolute()}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Motion Analysis Server shutting down...")


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
