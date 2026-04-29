"""
Integration of Gemini analyzer with motion analysis pipeline
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


def analyze_with_gemini(
    motion_events: List[Dict[str, Any]],
    frames_b64: Optional[List[str]] = None
) -> Optional[List[Dict[str, Any]]]:
    """
    Analyze motion events using Gemini 2.5 Flash API
    
    Args:
        motion_events: List of detected motion events
        frames_b64: Optional list of base64 encoded frames
    
    Returns:
        List of MODAPTS analysis results or None if failed
    """
    try:
        from analysis_pipeline_gemini import create_gemini_analyzer
        
        analyzer = create_gemini_analyzer()
        
        # Try analysis with frames first if available
        if frames_b64:
            logger.info(f"Analyzing with {len(frames_b64)} frames using Gemini...")
            results = analyzer.analyze_with_frames(motion_events, frames_b64)
            if results:
                return results
        
        # Fallback to text-only analysis
        logger.info("Analyzing using Gemini (text-only mode)...")
        results = analyzer.analyze_without_frames(motion_events)
        return results
    
    except Exception as e:
        logger.error(f"Gemini analysis error: {e}")
        return None
