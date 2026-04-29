"""
Report Generation Module
Generates PDF and Excel reports from MODAPTS analysis results
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate analysis reports in various formats"""
    
    def __init__(self):
        self.modapts_descriptions = {
            "M1": "손가락 이동 (2.5cm)",
            "M2": "손 이동 (5cm)",
            "M3": "팔뚝 이동 (15cm)",
            "M4": "팔 이동 (30cm)",
            "M5": "팔 + 몸 이동 (60cm)",
            "M6": "전신 이동 (90cm+)",
            "G0": "쉬운 집기",
            "G1": "일반 집기",
            "G2": "어려운 집기",
            "G3": "도구 집기",
            "P0": "가벼운 놓기",
            "P1": "일반 놓기",
            "P2": "조심스러운 놓기",
            "D3": "판단",
            "L1": "읽기 (짧음)",
            "E2": "눈 이동",
            "F3": "발 이동",
            "R2": "읽기 (일반)",
        }
    
    def generate_summary(
        self,
        project_title: str,
        motion_events: List[Dict[str, Any]],
        corrections: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate analysis summary
        
        Args:
            project_title: Project name
            motion_events: List of motion events with MODAPTS codes
            corrections: Optional list of corrections applied
        
        Returns:
            Summary dictionary with statistics
        """
        if not motion_events:
            return {
                "title": project_title,
                "generated_at": datetime.now().isoformat(),
                "total_events": 0,
                "total_mods": 0,
                "total_time_seconds": 0,
                "code_distribution": {},
                "corrections_applied": 0,
            }
        
        # Calculate statistics
        total_mods = sum(int(e.get("mod_value", 0)) for e in motion_events)
        total_time = sum(float(e.get("time_seconds", 0)) for e in motion_events)
        
        # Code distribution
        code_dist = {}
        for event in motion_events:
            code = event.get("modapts_code", "M2")
            code_dist[code] = code_dist.get(code, 0) + 1
        
        # Code type distribution
        code_types = {}
        for code in code_dist.keys():
            code_type = code[0]  # First letter (M, G, P, etc.)
            code_types[code_type] = code_types.get(code_type, 0) + code_dist[code]
        
        return {
            "title": project_title,
            "generated_at": datetime.now().isoformat(),
            "total_events": len(motion_events),
            "total_mods": total_mods,
            "total_time_seconds": round(total_time, 3),
            "average_confidence": round(
                sum(e.get("confidence", 0) for e in motion_events) / len(motion_events),
                1
            ) if motion_events else 0,
            "code_distribution": code_dist,
            "code_type_distribution": code_types,
            "corrections_applied": len(corrections) if corrections else 0,
        }
    
    def format_motion_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Format a motion event for reporting"""
        code = event.get("modapts_code", "M2")
        return {
            "sequence": event.get("sequence", 0),
            "code": code,
            "code_description": self.modapts_descriptions.get(code, "Unknown"),
            "mod_value": event.get("mod_value", 0),
            "time_seconds": round(float(event.get("time_seconds", 0)), 3),
            "body_part": event.get("body_part", "hand"),
            "description": event.get("description", ""),
            "confidence": event.get("confidence", 0),
            "start_time": round(float(event.get("start_time", 0)), 2),
            "end_time": round(float(event.get("end_time", 0)), 2),
        }
    
    def generate_json_report(
        self,
        project_title: str,
        motion_events: List[Dict[str, Any]],
        corrections: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generate JSON format report
        
        Args:
            project_title: Project name
            motion_events: List of motion events
            corrections: Optional corrections
        
        Returns:
            JSON string
        """
        summary = self.generate_summary(project_title, motion_events, corrections)
        
        report = {
            "report_type": "MODAPTS Analysis Report",
            "summary": summary,
            "motion_events": [self.format_motion_event(e) for e in motion_events],
            "corrections": corrections or [],
        }
        
        return json.dumps(report, indent=2, ensure_ascii=False)
    
    def generate_csv_report(
        self,
        motion_events: List[Dict[str, Any]]
    ) -> str:
        """
        Generate CSV format report
        
        Args:
            motion_events: List of motion events
        
        Returns:
            CSV string
        """
        if not motion_events:
            return "순번,코드,코드설명,MOD값,시간(초),신체부위,설명,신뢰도(%)\n"
        
        lines = ["순번,코드,코드설명,MOD값,시간(초),신체부위,설명,신뢰도(%)"]
        
        for event in motion_events:
            formatted = self.format_motion_event(event)
            line = (
                f"{formatted['sequence']},"
                f"{formatted['code']},"
                f'"{formatted["code_description"]}",'
                f"{formatted['mod_value']},"
                f"{formatted['time_seconds']},"
                f"{formatted['body_part']},"
                f'"{formatted["description"]}",'
                f"{formatted['confidence']}"
            )
            lines.append(line)
        
        return "\n".join(lines)
    
    def generate_html_report(
        self,
        project_title: str,
        motion_events: List[Dict[str, Any]],
        corrections: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generate HTML format report
        
        Args:
            project_title: Project name
            motion_events: List of motion events
            corrections: Optional corrections
        
        Returns:
            HTML string
        """
        summary = self.generate_summary(project_title, motion_events, corrections)
        
        html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MODAPTS 분석 보고서</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #1a1a1a;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #333;
            margin-top: 30px;
            border-left: 4px solid #007bff;
            padding-left: 10px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .summary-card {{
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }}
        .summary-card label {{
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }}
        .summary-card .value {{
            font-size: 1.8em;
            font-weight: bold;
            color: #007bff;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th {{
            background-color: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .code {{
            background-color: #e7f3ff;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            color: #007bff;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>MODAPTS 분석 보고서</h1>
        <p><strong>프로젝트:</strong> {project_title}</p>
        <p><strong>생성일:</strong> {summary['generated_at']}</p>
        
        <h2>분석 요약</h2>
        <div class="summary">
            <div class="summary-card">
                <label>총 동작 수</label>
                <div class="value">{summary['total_events']}</div>
            </div>
            <div class="summary-card">
                <label>총 MOD</label>
                <div class="value">{summary['total_mods']}</div>
            </div>
            <div class="summary-card">
                <label>표준시간</label>
                <div class="value">{summary['total_time_seconds']:.2f}s</div>
            </div>
            <div class="summary-card">
                <label>평균 신뢰도</label>
                <div class="value">{summary['average_confidence']:.0f}%</div>
            </div>
        </div>
        
        <h2>동작 이벤트 상세</h2>
        <table>
            <thead>
                <tr>
                    <th>순번</th>
                    <th>코드</th>
                    <th>MOD</th>
                    <th>시간(초)</th>
                    <th>신체부위</th>
                    <th>설명</th>
                    <th>신뢰도</th>
                </tr>
            </thead>
            <tbody>
"""
        
        for event in motion_events:
            formatted = self.format_motion_event(event)
            html += f"""                <tr>
                    <td>{formatted['sequence']}</td>
                    <td><span class="code">{formatted['code']}</span></td>
                    <td>{formatted['mod_value']}</td>
                    <td>{formatted['time_seconds']:.3f}</td>
                    <td>{formatted['body_part']}</td>
                    <td>{formatted['description']}</td>
                    <td>{formatted['confidence']}%</td>
                </tr>
"""
        
        html += """            </tbody>
        </table>
        
        <div class="footer">
            <p>이 보고서는 VLM MODAPTS 동작분석 시스템에서 자동 생성되었습니다.</p>
            <p>분석 결과는 참고용이며, 최종 검증은 산업공학 전문가의 검토가 필요합니다.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return html


def create_report_generator() -> ReportGenerator:
    """Factory function to create report generator"""
    return ReportGenerator()
