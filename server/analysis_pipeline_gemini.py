"""
Gemini 2.5 Flash Integration for Motion Analysis
"""

import os
import json
import requests
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class GeminiMotionAnalyzer:
    """Gemini 2.5 Flash based motion analysis"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        self.model = "gemini-2.5-flash"
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    
    def create_analysis_prompt(self, motion_events: List[Dict[str, Any]]) -> str:
        """Create a detailed prompt for Gemini 2.5 Flash analysis"""
        events_str = json.dumps(motion_events, indent=2, ensure_ascii=False)
        
        prompt = f"""당신은 MODAPTS(Modular Arrangement of Predetermined Time Standards) 동작 분석을 전문으로 하는 산업공학 전문가입니다.

제조 공정 영상에서 감지된 다음 동작 이벤트를 분석하고 적절한 MODAPTS 코드를 부여하세요.

감지된 동작 이벤트:
{events_str}

각 동작 이벤트에 대해 다음을 결정하세요:
1. 가장 적절한 MODAPTS 코드 (이동: M1~M6, 집기: G0~G3, 놓기: P0~P2, 기타: D3, L1, E2, F3, R2)
2. MOD 값 (1 MOD = 0.129초)
3. 동작에 대한 간단한 설명
4. 신뢰도 점수 (0-100)

다음 구조의 JSON 배열로 분석 결과를 반환하세요:
[
  {{
    "sequence": 1,
    "start_time": 0.5,
    "end_time": 1.2,
    "code": "M3",
    "mod_value": 3,
    "description": "팔뚝을 부품으로 이동",
    "body_part": "arm",
    "confidence": 85
  }},
  ...
]

MODAPTS 표준에 따른 정확성과 일관성에 중점을 두세요. JSON만 반환하세요."""
        
        return prompt
    
    def analyze_with_frames(
        self,
        motion_events: List[Dict[str, Any]],
        frames_b64: List[str]
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Analyze motion events using Gemini 2.5 Flash with video frames
        
        Args:
            motion_events: List of detected motion events
            frames_b64: List of base64 encoded frames
        
        Returns:
            List of MODAPTS analysis results or None if failed
        """
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not set, skipping Gemini analysis")
            return None
        
        try:
            # Prepare the prompt
            prompt = self.create_analysis_prompt(motion_events)
            
            # Prepare image data for Gemini
            image_parts = []
            for frame_b64 in frames_b64[:3]:  # Use up to 3 frames to reduce API costs
                image_parts.append({
                    "type": "image",
                    "image": {
                        "format": "jpeg",
                        "data": frame_b64
                    }
                })
            
            # Build content with images and text
            content_parts = image_parts + [
                {"type": "text", "text": prompt}
            ]
            
            payload = {
                "contents": [
                    {
                        "parts": content_parts
                    }
                ]
            }
            
            headers = {"Content-Type": "application/json"}
            
            # Call Gemini API
            logger.info("Calling Gemini 2.5 Flash API for motion analysis...")
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                text_content = result["candidates"][0].get("content", {}).get("parts", [])
                if text_content:
                    response_text = text_content[0].get("text", "")
                    
                    # Parse the response
                    parsed = self.parse_response(response_text)
                    if parsed:
                        logger.info(f"Successfully analyzed {len(parsed)} motion events with Gemini")
                        return parsed
            
            logger.warning("No valid response from Gemini API")
            return None
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Gemini API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error during Gemini analysis: {e}")
            return None
    
    def analyze_without_frames(
        self,
        motion_events: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Analyze motion events using Gemini 2.5 Flash without frames
        (text-only analysis based on motion event descriptions)
        
        Args:
            motion_events: List of detected motion events
        
        Returns:
            List of MODAPTS analysis results or None if failed
        """
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not set, skipping Gemini analysis")
            return None
        
        try:
            # Prepare the prompt
            prompt = self.create_analysis_prompt(motion_events)
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
            }
            
            headers = {"Content-Type": "application/json"}
            
            # Call Gemini API
            logger.info("Calling Gemini 2.5 Flash API (text-only) for motion analysis...")
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                text_content = result["candidates"][0].get("content", {}).get("parts", [])
                if text_content:
                    response_text = text_content[0].get("text", "")
                    
                    # Parse the response
                    parsed = self.parse_response(response_text)
                    if parsed:
                        logger.info(f"Successfully analyzed {len(parsed)} motion events with Gemini (text-only)")
                        return parsed
            
            logger.warning("No valid response from Gemini API")
            return None
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Gemini API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error during Gemini analysis: {e}")
            return None
    
    def parse_response(self, response_text: str) -> Optional[List[Dict[str, Any]]]:
        """
        Parse Gemini response and extract MODAPTS codes
        
        Args:
            response_text: Raw response text from Gemini API
        
        Returns:
            Parsed list of motion events with MODAPTS codes or None if parsing failed
        """
        try:
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                logger.warning("No JSON found in Gemini response")
                return None
            
            json_str = response_text[json_start:json_end]
            events = json.loads(json_str)
            
            # Validate and clean up events
            validated_events = []
            for event in events:
                if isinstance(event, dict) and "code" in event and "mod_value" in event:
                    validated_events.append(event)
            
            return validated_events if validated_events else None
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Gemini response: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return None


def create_gemini_analyzer(api_key: Optional[str] = None) -> GeminiMotionAnalyzer:
    """Factory function to create Gemini analyzer"""
    return GeminiMotionAnalyzer(api_key)
