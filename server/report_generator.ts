/**
 * Report Generation Module
 * Generates PDF, Excel, and HTML reports from analysis data
 */

import { z } from "zod";
import * as XLSX from "xlsx";

export interface MotionEventData {
  sequence: number;
  code: string;
  modValue: number;
  timeSeconds: number;
  description: string;
  bodyPart: string;
  confidence: number;
}

export interface ProjectReportData {
  projectId: number;
  projectName: string;
  createdAt: Date;
  totalEvents: number;
  totalMods: number;
  totalTimeSeconds: number;
  motionEvents: MotionEventData[];
}

/**
 * Generate HTML report content
 */
export function generateHtmlReport(data: ProjectReportData): string {
  const modDistribution = calculateModDistribution(data.motionEvents);
  const codeDistribution = calculateCodeDistribution(data.motionEvents);
  const avgConfidence = calculateAverageConfidence(data.motionEvents);

  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MODAPTS 분석 보고서</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1a1a1a;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 0.95em;
        }
        .summary-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .summary-card label {
            display: block;
            font-size: 0.85em;
            color: #666;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        h2 {
            color: #333;
            margin-top: 40px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
            padding-left: 15px;
            font-size: 1.5em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
            background-color: #007bff;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 0.95em;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
        }
        tr:hover {
            background-color: #f9f9f9;
        }
        .code-badge {
            background-color: #e7f3ff;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            color: #007bff;
            font-size: 0.9em;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 0.85em;
            text-align: center;
        }
        @media print {
            body {
                background-color: white;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MODAPTS 분석 보고서</h1>
            <p><strong>프로젝트:</strong> ${data.projectName}</p>
            <p><strong>생성일:</strong> ${data.createdAt.toLocaleString("ko-KR")}</p>
        </div>

        <h2>분석 요약</h2>
        <div class="summary-section">
            <div class="summary-card">
                <label>총 동작 수</label>
                <div class="value">${data.totalEvents}</div>
            </div>
            <div class="summary-card">
                <label>총 MOD</label>
                <div class="value">${data.totalMods}</div>
            </div>
            <div class="summary-card">
                <label>표준시간</label>
                <div class="value">${data.totalTimeSeconds.toFixed(2)}s</div>
            </div>
            <div class="summary-card">
                <label>평균 신뢰도</label>
                <div class="value">${avgConfidence.toFixed(0)}%</div>
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
                ${data.motionEvents.map(event => `
                <tr>
                    <td>${event.sequence}</td>
                    <td><span class="code-badge">${event.code}</span></td>
                    <td>${event.modValue}</td>
                    <td>${event.timeSeconds.toFixed(3)}</td>
                    <td>${event.bodyPart}</td>
                    <td>${event.description}</td>
                    <td>${event.confidence}%</td>
                </tr>
                `).join("")}
            </tbody>
        </table>

        <div class="footer">
            <p>이 보고서는 VLM MODAPTS 동작분석 시스템에서 자동 생성되었습니다.</p>
            <p>분석 결과는 참고용이며, 최종 검증은 산업공학 전문가의 검토가 필요합니다.</p>
        </div>
    </div>
</body>
</html>
  `;

  return htmlContent;
}

/**
 * Generate CSV report content
 */
export function generateCsvReport(data: ProjectReportData): string {
  const headers = ["순번", "코드", "MOD", "시간(초)", "신체부위", "설명", "신뢰도(%)"];
  
  const rows = data.motionEvents.map(event =>
    [
      event.sequence,
      event.code,
      event.modValue,
      event.timeSeconds.toFixed(3),
      event.bodyPart,
      `"${event.description}"`,
      event.confidence,
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generate Excel report
 */
export function generateExcelReport(data: ProjectReportData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["MODAPTS 분석 보고서"],
    ["프로젝트", data.projectName],
    ["생성일", data.createdAt.toLocaleString("ko-KR")],
    [],
    ["분석 요약"],
    ["항목", "값"],
    ["총 동작 수", data.totalEvents],
    ["총 MOD", data.totalMods],
    ["표준시간(초)", data.totalTimeSeconds.toFixed(2)],
    ["평균 신뢰도(%)", calculateAverageConfidence(data.motionEvents).toFixed(0)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "요약");

  // Details sheet
  const detailsData = [
    ["순번", "코드", "MOD", "시간(초)", "신체부위", "설명", "신뢰도(%)"],
    ...data.motionEvents.map(event => [
      event.sequence,
      event.code,
      event.modValue,
      event.timeSeconds.toFixed(3),
      event.bodyPart,
      event.description,
      event.confidence,
    ]),
  ];

  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(workbook, detailsSheet, "상세");

  // Write to buffer
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  return buffer as Buffer;
}

/**
 * Calculate MOD distribution
 */
function calculateModDistribution(events: MotionEventData[]): Record<number, number> {
  const distribution: Record<number, number> = {};
  
  events.forEach(event => {
    distribution[event.modValue] = (distribution[event.modValue] || 0) + 1;
  });

  return distribution;
}

/**
 * Calculate code type distribution
 */
function calculateCodeDistribution(events: MotionEventData[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  events.forEach(event => {
    const codeType = event.code[0]; // First letter (M, G, P, etc.)
    distribution[codeType] = (distribution[codeType] || 0) + 1;
  });

  return distribution;
}

/**
 * Calculate average confidence
 */
function calculateAverageConfidence(events: MotionEventData[]): number {
  if (events.length === 0) return 0;
  const sum = events.reduce((acc, event) => acc + event.confidence, 0);
  return sum / events.length;
}
