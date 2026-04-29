"""
Gemini 2.5 Flash API Integration
Handles video frame analysis using Google's Gemini 2.5 Flash model
"""

import base64
import json
import logging
from typing import Optional, List, Dict, Any
import httpx

logger = logging.getLogger(__name__)


class GeminiAnalyzer:
    """Gemini 2.5 Flash based motion analysis"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "gemini-2.5-flash"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def analyze_frame(self, frame_base64: str, context: str = "") -> Optional[Dict[str, Any]]:
        """
        Analyze a single video frame using Gemini 2.5 Flash
        
        Args:
            frame_base64: Base64 encoded image
            context: Additional context about the motion
        
        Returns:
            Analysis result with detected motions and MODAPTS codes
        """
        try:
            prompt = self._create_frame_analysis_prompt(context)
            
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": frame_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }
            
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                content = result["candidates"][0].get("content", {})
                parts = content.get("parts", [])
                
                if parts:
                    text = parts[0].get("text", "")
                    return self._parse_analysis_response(text)
            
            return None
        
        except Exception as e:
            logger.error(f"Error analyzing frame with Gemini: {e}")
            return None
    
    async def analyze_motion_sequence(
        self,
        frames_base64: List[str],
        motion_events: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Analyze a sequence of frames and motion events
        
        Args:
            frames_base64: List of base64 encoded frames
            motion_events: Detected motion events with timing
        
        Returns:
            List of MODAPTS codes with analysis
        """
        try:
            prompt = self._create_sequence_analysis_prompt(len(frames_base64), motion_events)
            
            # Build parts with multiple frames (Gemini supports multiple images)
            parts = [{"text": prompt}]
            
            # Add up to 5 key frames to reduce API costs
            frame_indices = self._select_key_frames(len(frames_base64), max_frames=5)
            for idx in frame_indices:
                if idx < len(frames_base64):
                    parts.append({
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": frames_base64[idx]
                        }
                    })
            
            payload = {
                "contents": [{
                    "parts": parts
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 4096,
                }
            }
            
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                content = result["candidates"][0].get("content", {})
                parts = content.get("parts", [])
                
                if parts:
                    text = parts[0].get("text", "")
                    return self._parse_sequence_response(text)
            
            return None
        
        except Exception as e:
            logger.error(f"Error analyzing motion sequence with Gemini: {e}")
            return None
    
    def _create_frame_analysis_prompt(self, context: str = "") -> str:
        """Create prompt for single frame analysis"""
        prompt = """당신은 제조 공정의 작업 동작을 분석하는 산업공학 전문가입니다.

이 이미지에서 다음을 분석하세요:
1. 작업자의 손/팔의 위치와 자세
2. 부품이나 도구의 위치
3. 현재 수행 중인 동작 (이동, 집기, 놓기, 조립 등)
4. 동작의 거리 및 난이도

다음 JSON 형식으로 응답하세요:
{
  "hand_position": "center/left/right/up/down",
  "detected_motion": "reach/grasp/place/move/assemble/inspect",
  "body_part": "hand/arm/forearm/finger",
  "distance_estimate": "short/medium/long",
  "difficulty": "easy/normal/difficult",
  "confidence": 0-100,
  "description": "동작에 대한 설명"
}"""
        
        if context:
            prompt += f"\n\n추가 정보: {context}"
        
        return prompt
    
    def _create_sequence_analysis_prompt(self, frame_count: int, motion_events: List[Dict[str, Any]]) -> str:
        """Create prompt for sequence analysis"""
        events_str = json.dumps(motion_events, indent=2, ensure_ascii=False)
        
        prompt = f"""당신은 MODAPTS(Modular Arrangement of Predetermined Time Standards) 동작 분석 전문가입니다.

제조 공정 영상의 {frame_count}개 프레임을 분석했습니다. 다음 감지된 동작 이벤트에 대해 MODAPTS 코드를 부여하세요.

감지된 동작 이벤트:
{events_str}

각 동작에 대해 다음을 결정하세요:
1. 가장 적절한 MODAPTS 코드:
   - 이동 (Move): M1(손가락 2.5cm) ~ M6(전신 90cm+)
   - 집기 (Get): G0(쉬운 집기) ~ G3(도구 집기)
   - 놓기 (Place): P0(가벼운 놓기) ~ P2(조심스러운 놓기)
   - 기타: D3(판단), L1(읽기-짧음), E2(눈 이동), F3(발 이동), R2(읽기-일반)
2. MOD 값 (1 MOD = 0.129초)
3. 동작 설명
4. 신뢰도 (0-100)

다음 JSON 배열 형식으로 반환하세요:
[
  {{
    "sequence": 1,
    "start_time": 0.0,
    "end_time": 1.0,
    "code": "M3",
    "mod_value": 3,
    "time_seconds": 0.387,
    "description": "팔뚝을 부품으로 이동",
    "body_part": "arm",
    "confidence": 85
  }},
  ...
]

MODAPTS 표준에 따른 정확성을 최우선으로 하세요."""
        
        return prompt
    
    def _parse_analysis_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse single frame analysis response"""
        try:
            # Extract JSON from response
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                return None
            
            json_str = text[json_start:json_end]
            return json.loads(json_str)
        
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing frame analysis response: {e}")
            return None
    
    def _parse_sequence_response(self, text: str) -> Optional[List[Dict[str, Any]]]:
        """Parse sequence analysis response"""
        try:
            # Extract JSON array from response
            json_start = text.find('[')
            json_end = text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                return None
            
            json_str = text[json_start:json_end]
            events = json.loads(json_str)
            
            # Validate and normalize events
            validated_events = []
            for event in events:
                if isinstance(event, dict) and 'code' in event:
                    validated_events.append({
                        'sequence': event.get('sequence', 0),
                        'start_time': event.get('start_time', 0),
                        'end_time': event.get('end_time', 0),
                        'code': event.get('code', 'M2'),
                        'mod_value': event.get('mod_value', 2),
                        'time_seconds': event.get('time_seconds', 0.258),
                        'description': event.get('description', ''),
                        'body_part': event.get('body_part', 'hand'),
                        'confidence': event.get('confidence', 0)
                    })
            
            return validated_events if validated_events else None
        
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing sequence analysis response: {e}")
            return None
    
    def _select_key_frames(self, total_frames: int, max_frames: int = 5) -> List[int]:
        """Select key frames from sequence"""
        if total_frames <= max_frames:
            return list(range(total_frames))
        
        # Select evenly distributed frames
        indices = []
        step = total_frames / max_frames
        for i in range(max_frames):
            indices.append(int(i * step))
        
        return indices
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


async def analyze_with_gemini(
    api_key: str,
    frames_base64: List[str],
    motion_events: List[Dict[str, Any]]
) -> Optional[List[Dict[str, Any]]]:
    """
    Convenience function for analyzing motion with Gemini
    
    Args:
        api_key: Google API key
        frames_base64: List of base64 encoded frames
        motion_events: Detected motion events
    
    Returns:
        List of MODAPTS analyzed events
    """
    analyzer = GeminiAnalyzer(api_key)
    try:
        result = await analyzer.analyze_motion_sequence(frames_base64, motion_events)
        return result
    finally:
        await analyzer.close()
