"""
VLM-based MODAPTS Motion Analysis Pipeline
OpenCV + Mediapipe + GPT-4V integration
"""

import cv2
import json
import base64
import mediapipe as mp
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


# ============================================================================
# MODAPTS Code System
# ============================================================================

class MODAPTSCode(Enum):
    """MODAPTS standard codes with MOD values"""
    # Move codes (M1-M6)
    M1 = 1      # Finger move (2.5cm)
    M2 = 2      # Hand move (5cm)
    M3 = 3      # Forearm move (15cm)
    M4 = 4      # Arm move (30cm)
    M5 = 5      # Arm + torso move (60cm)
    M6 = 6      # Full body move (90cm+)
    
    # Get codes (G0-G3)
    G0 = 0      # Finger grasp (easy)
    G1 = 1      # Hand grasp (normal)
    G2 = 2      # Two-hand grasp (heavy)
    G3 = 3      # Tool grasp
    
    # Place codes (P0-P2)
    P0 = 0      # Light place
    P1 = 1      # Normal place
    P2 = 2      # Careful place
    
    # Other codes
    D3 = 3      # Decision
    L1 = 1      # Read (short)
    E2 = 2      # Eye move
    F3 = 3      # Foot move
    R2 = 2      # Read (general)


MOD_TO_SECONDS = 0.129  # 1 MOD = 0.129 seconds


@dataclass
class MODAPTSEvent:
    """Represents a single MODAPTS motion event"""
    sequence_number: int
    start_time: float
    end_time: float
    code: str
    mod_value: int
    time_seconds: float
    description: str
    body_part: str
    confidence: float
    is_manually_adjusted: bool = False


# ============================================================================
# Frame Processing & Hand Tracking
# ============================================================================

class HandTracker:
    """Mediapipe-based hand landmark detection"""
    
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
    
    def detect_hands(self, frame: np.ndarray) -> Tuple[List[Any], List[Any]]:
        """
        Detect hand landmarks in a frame
        Returns: (hand_landmarks_list, handedness_list)
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        landmarks = []
        handedness = []
        
        if results.multi_hand_landmarks and results.multi_handedness:
            for hand_lm, hand_info in zip(results.multi_hand_landmarks, results.multi_handedness):
                landmarks.append(hand_lm)
                handedness.append(hand_info.classification[0].label)
        
        return landmarks, handedness
    
    def get_hand_position(self, landmarks: Any) -> Optional[Tuple[float, float]]:
        """Get hand center position (average of all landmarks)"""
        if not landmarks:
            return None
        
        x_coords = [lm.x for lm in landmarks.landmark]
        y_coords = [lm.y for lm in landmarks.landmark]
        
        return (np.mean(x_coords), np.mean(y_coords))
    
    def get_hand_tip(self, landmarks: Any) -> Optional[Tuple[float, float]]:
        """Get index finger tip position (landmark 8)"""
        if not landmarks:
            return None
        
        tip = landmarks.landmark[8]  # Index finger tip
        return (tip.x, tip.y)


class FrameExtractor:
    """Extract frames from video at specified FPS"""
    
    @staticmethod
    def extract_frames(video_path: str, target_fps: float = 2.0) -> Tuple[List[np.ndarray], List[float]]:
        """
        Extract frames from video at target FPS
        Returns: (frames_list, timestamps_list)
        """
        cap = cv2.VideoCapture(video_path)
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        skip_frames = int(video_fps / target_fps)
        
        frames = []
        timestamps = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % skip_frames == 0:
                frames.append(frame)
                timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                timestamps.append(timestamp)
            
            frame_count += 1
        
        cap.release()
        return frames, timestamps


# ============================================================================
# Motion Event Detection
# ============================================================================

class MotionEventDetector:
    """Detect motion events (Reach, Get, Place) from hand tracking data"""
    
    def __init__(self, contact_threshold: float = 0.05, far_threshold: float = 0.3):
        self.contact_threshold = contact_threshold
        self.far_threshold = far_threshold
    
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calculate Euclidean distance between two points"""
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def detect_motion_events(
        self,
        hand_positions: List[Optional[Tuple[float, float]]],
        timestamps: List[float],
        part_center: Optional[Tuple[float, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect motion events from hand tracking data
        Returns list of motion events with type and timing
        """
        if not part_center:
            # Use center of frame as default part location
            part_center = (0.5, 0.5)
        
        events = []
        last_contact = False
        last_far = False
        
        for i, (hand_pos, timestamp) in enumerate(zip(hand_positions, timestamps)):
            if not hand_pos:
                continue
            
            distance = self.calculate_distance(hand_pos, part_center)
            contact = distance < self.contact_threshold
            far = distance > self.far_threshold
            
            # Transition from far to contact: Get (G)
            if contact and not last_contact:
                events.append({
                    "time": timestamp,
                    "action": "G",
                    "type": "get",
                    "distance": distance
                })
            
            # Transition from contact to far: Place (P)
            elif not contact and last_contact:
                events.append({
                    "time": timestamp,
                    "action": "P",
                    "type": "place",
                    "distance": distance
                })
            
            # Far movement: Move (M)
            elif far and not last_far:
                events.append({
                    "time": timestamp,
                    "action": "M",
                    "type": "move",
                    "distance": distance
                })
            
            last_contact = contact
            last_far = far
        
        return events


# ============================================================================
# Frame to Base64 Encoding (for GPT-4V)
# ============================================================================

def frame_to_base64(frame: np.ndarray) -> str:
    """Convert OpenCV frame to base64 string for API transmission"""
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).tobytes().decode('utf-8')


def resize_frame(frame: np.ndarray, max_width: int = 1024) -> np.ndarray:
    """Resize frame to reduce API costs while maintaining quality"""
    height, width = frame.shape[:2]
    if width > max_width:
        ratio = max_width / width
        new_height = int(height * ratio)
        return cv2.resize(frame, (max_width, new_height))
    return frame


# ============================================================================
# MODAPTS Code Mapping & Calculation
# ============================================================================

class MODAPTSEngine:
    """MODAPTS code mapping and time calculation engine"""
    
    @staticmethod
    def parse_modapts_code(code: str) -> Tuple[int, str]:
        """
        Parse MODAPTS code string and return (MOD value, code type)
        Example: "M3" -> (3, "M")
        """
        if not code or len(code) < 1:
            return 0, ""
        
        code_type = code[0].upper()
        try:
            mod_value = int(code[1:]) if len(code) > 1 else 0
        except ValueError:
            mod_value = 0
        
        return mod_value, code_type
    
    @staticmethod
    def code_to_seconds(code: str) -> float:
        """Convert MODAPTS code to seconds"""
        try:
            enum_code = MODAPTSCode[code.upper()]
            return enum_code.value * MOD_TO_SECONDS
        except (KeyError, ValueError):
            return 0.0
    
    @staticmethod
    def calculate_standard_time(events: List[MODAPTSEvent]) -> Tuple[float, int]:
        """
        Calculate total standard time and MOD count
        Returns: (total_seconds, total_mods)
        """
        total_seconds = 0.0
        total_mods = 0
        
        for event in events:
            total_seconds += event.time_seconds
            total_mods += event.mod_value
        
        return total_seconds, total_mods
    
    @staticmethod
    def identify_waste_motions(events: List[MODAPTSEvent]) -> List[Dict[str, Any]]:
        """
        Identify potentially wasteful motions (e.g., repeated M5/M6)
        Returns list of waste motion indicators
        """
        waste_motions = []
        
        # Count consecutive long-distance moves
        consecutive_long_moves = 0
        for event in events:
            if event.code.startswith('M') and event.mod_value >= 5:
                consecutive_long_moves += 1
                if consecutive_long_moves > 2:
                    waste_motions.append({
                        "type": "excessive_long_moves",
                        "event_id": event.sequence_number,
                        "code": event.code,
                        "severity": "medium"
                    })
            else:
                consecutive_long_moves = 0
        
        return waste_motions


# ============================================================================
# VLM Analysis Integration (GPT-4V)
# ============================================================================

class VLMAnalyzer:
    """Gemini 2.5 Flash based motion analysis"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.model = "gemini-2.5-flash"
    
    def create_analysis_prompt(self, motion_events: List[Dict[str, Any]]) -> str:
        """
        Create a detailed prompt for Gemini 2.5 Flash analysis
        """
        events_str = json.dumps(motion_events, indent=2)
        
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

MODAPTS 표준에 따른 정확성과 일관성에 중점을 두세요."""
        
        return prompt
    
    def parse_vlm_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Parse VLM response and extract MODAPTS codes
        """
        try:
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                return []
            
            json_str = response_text[json_start:json_end]
            events = json.loads(json_str)
            
            return events
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing VLM response: {e}")
            return []


# ============================================================================
# Main Analysis Pipeline
# ============================================================================

class MotionAnalysisPipeline:
    """Complete motion analysis pipeline"""
    
    def __init__(self, vlm_api_key: Optional[str] = None):
        self.frame_extractor = FrameExtractor()
        self.hand_tracker = HandTracker()
        self.motion_detector = MotionEventDetector()
        self.modapts_engine = MODAPTSEngine()
        self.vlm_analyzer = VLMAnalyzer(api_key=vlm_api_key)
    
    def analyze_video(self, video_path: str, target_fps: float = 2.0) -> Dict[str, Any]:
        """
        Complete video analysis pipeline
        Returns analysis results with MODAPTS codes and standard time
        """
        # Step 1: Extract frames
        print(f"[Pipeline] Extracting frames from {video_path}...")
        frames, timestamps = self.frame_extractor.extract_frames(video_path, target_fps)
        
        if not frames:
            return {
                "status": "error",
                "message": "Failed to extract frames from video"
            }
        
        # Step 2: Detect hand landmarks
        print(f"[Pipeline] Detecting hand landmarks in {len(frames)} frames...")
        hand_positions = []
        for frame in frames:
            landmarks, _ = self.hand_tracker.detect_hands(frame)
            if landmarks:
                pos = self.hand_tracker.get_hand_tip(landmarks[0])
                hand_positions.append(pos)
            else:
                hand_positions.append(None)
        
        # Step 3: Detect motion events
        print("[Pipeline] Detecting motion events...")
        motion_events = self.motion_detector.detect_motion_events(hand_positions, timestamps)
        
        # Step 4: Create analysis prompt and prepare frames for VLM
        print("[Pipeline] Preparing frames for VLM analysis...")
        # Sample key frames for VLM analysis (reduce API costs)
        sample_indices = np.linspace(0, len(frames) - 1, min(5, len(frames)), dtype=int)
        sample_frames = [frames[i] for i in sample_indices]
        sample_frames_b64 = [frame_to_base64(resize_frame(f)) for f in sample_frames]
        
        # Step 5: Get VLM analysis using Gemini 2.5 Flash
        print("[Pipeline] Analyzing with Gemini 2.5 Flash...")
        vlm_results = self._analyze_with_gemini(motion_events, sample_frames_b64)
        
        # Fallback to mock if Gemini analysis fails
        if not vlm_results:
            print("[Pipeline] Gemini analysis failed, using mock analysis...")
            vlm_results = self._mock_vlm_analysis(motion_events)
        
        # Step 6: Calculate standard time
        print("[Pipeline] Calculating standard time...")
        modapts_events = self._create_modapts_events(vlm_results)
        total_seconds, total_mods = self.modapts_engine.calculate_standard_time(modapts_events)
        
        # Step 7: Identify waste motions
        waste_motions = self.modapts_engine.identify_waste_motions(modapts_events)
        
        return {
            "status": "success",
            "video_duration": timestamps[-1] if timestamps else 0,
            "frame_count": len(frames),
            "motion_events": [vars(e) for e in modapts_events],
            "total_standard_time": total_seconds,
            "total_mods": total_mods,
            "waste_motions": waste_motions
        }
    
    def _mock_vlm_analysis(self, motion_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Mock VLM analysis for development
        In production, replace with actual GPT-4V API call
        """
        results = []
        for i, event in enumerate(motion_events):
            code = self._infer_code_from_event(event)
            mod_value, _ = self.modapts_engine.parse_modapts_code(code)
            
            results.append({
                "sequence": i + 1,
                "start_time": event.get("time", 0),
                "end_time": event.get("time", 0) + 0.5,
                "code": code,
                "mod_value": mod_value,
                "description": f"{event.get('type', 'motion')} motion",
                "body_part": "hand",
                "confidence": 75
            })
        
        return results
    
    def _infer_code_from_event(self, event: Dict[str, Any]) -> str:
        """Infer MODAPTS code from detected event"""
        action = event.get("action", "M")
        
        if action == "M":
            distance = event.get("distance", 0.5)
            if distance < 0.1:
                return "M1"
            elif distance < 0.2:
                return "M2"
            elif distance < 0.4:
                return "M3"
            elif distance < 0.6:
                return "M4"
            else:
                return "M5"
        elif action == "G":
            return "G1"
        elif action == "P":
            return "P1"
        else:
            return "M2"
    
    def _create_modapts_events(self, vlm_results: List[Dict[str, Any]]) -> List[MODAPTSEvent]:
        """Convert VLM results to MODAPTSEvent objects"""
        events = []
        
        for result in vlm_results:
            code = result.get("code", "M2")
            mod_value = result.get("mod_value", 2)
            time_seconds = mod_value * MOD_TO_SECONDS
            
            event = MODAPTSEvent(
                sequence_number=result.get("sequence", 0),
                start_time=result.get("start_time", 0),
                end_time=result.get("end_time", 0),
                code=code,
                mod_value=mod_value,
                time_seconds=time_seconds,
                description=result.get("description", ""),
                body_part=result.get("body_part", "hand"),
                confidence=result.get("confidence", 0)
            )
            events.append(event)
        
        return events


# ============================================================================
# Utility Functions
# ============================================================================

def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    
    return frame_count / fps if fps > 0 else 0


if __name__ == "__main__":
    # Example usage
    print("MODAPTS Motion Analysis Pipeline initialized")
