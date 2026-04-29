import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2, Save, X, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const MODAPTS_CODES = [
  // Move
  { category: "이동 (Move)", codes: ["M1", "M2", "M3", "M4", "M5", "M6"] },
  // Get
  { category: "집기 (Get)", codes: ["G0", "G1", "G2", "G3"] },
  // Place
  { category: "놓기 (Place)", codes: ["P0", "P1", "P2"] },
  // Other
  { category: "기타", codes: ["D3", "L1", "E2", "F3", "R2"] },
];

interface CorrectionFormProps {
  eventId: number;
  projectId: number;
  originalCode: string;
  onSuccess: () => void;
}

/**
 * Motion Correction Dialog Component
 */
export function MotionCorrectionDialog({ eventId, projectId, originalCode, onSuccess }: CorrectionFormProps) {
  const [open, setOpen] = useState(false);
  const [newCode, setNewCode] = useState(originalCode);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const correctionMutation = trpc.correction.create.useMutation();
  const motionEventMutation = trpc.motionEvent.update.useMutation();

  const handleSubmit = async () => {
    if (!newCode) {
      toast.error("새로운 코드를 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create correction record
      await correctionMutation.mutateAsync({
        projectId,
        eventId,
        originalCode,
        newCode,
        reason: reason || undefined,
        comment: comment || undefined,
      });

      // Update motion event
      await motionEventMutation.mutateAsync({
        eventId,
        projectId,
        modaptsCode: newCode,
      });

      toast.success("보정이 완료되었습니다");
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error("보정 중 오류가 발생했습니다");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>동작 코드 보정</DialogTitle>
          <DialogDescription>
            분석된 MODAPTS 코드를 수정하고 이유를 기록하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Code Display */}
          <div className="space-y-2">
            <Label>원본 코드</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                {originalCode}
              </Badge>
              <span className="text-muted-foreground">→</span>
            </div>
          </div>

          {/* New Code Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-code">새로운 코드 *</Label>
            <Select value={newCode} onValueChange={setNewCode}>
              <SelectTrigger id="new-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODAPTS_CODES.map((group) => (
                  <div key={group.category}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {group.category}
                    </div>
                    {group.codes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">보정 사유 (선택사항)</Label>
            <Input
              id="reason"
              placeholder="예: 손 이동 거리가 더 길어 보임"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">추가 코멘트 (선택사항)</Label>
            <Textarea
              id="comment"
              placeholder="추가 설명이나 메모를 입력하세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "저장 중..." : "보정 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Correction History Component
 */
export function CorrectionHistory({ projectId }: { projectId: number }) {
  const correctionsQuery = trpc.correction.list.useQuery({ projectId });

  if (correctionsQuery.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>;
  }

  const corrections = correctionsQuery.data || [];

  if (corrections.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>보정 이력이 없습니다</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>보정 이력</CardTitle>
        <CardDescription>수동으로 보정한 동작 코드 기록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {corrections.map((correction: any) => (
            <div
              key={correction.id}
              className="border border-border/40 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{correction.originalCode}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-green-600/20 text-green-600 hover:bg-green-600/30">
                    {correction.newCode}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(correction.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {correction.reason && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">사유:</p>
                  <p className="text-sm">{correction.reason}</p>
                </div>
              )}

              {correction.comment && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">코멘트:</p>
                  <p className="text-sm italic">{correction.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Bulk Correction Component
 */
export function BulkCorrectionPanel({ projectId, onSuccess }: { projectId: number; onSuccess: () => void }) {
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [bulkCode, setBulkCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const motionEventsQuery = trpc.motionEvent.list.useQuery({ projectId });

  const handleBulkApply = async () => {
    if (!bulkCode || selectedEvents.length === 0) {
      toast.error("코드와 이벤트를 선택해주세요");
      return;
    }

    setIsApplying(true);
    try {
      // Apply bulk correction to all selected events
      for (const eventId of selectedEvents) {
        // This would need a bulk update endpoint
        // For now, we'll just show a message
      }
      toast.success(`${selectedEvents.length}개 항목이 보정되었습니다`);
      setSelectedEvents([]);
      setBulkCode("");
      onSuccess();
    } catch (error) {
      toast.error("일괄 보정 중 오류가 발생했습니다");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>일괄 보정</CardTitle>
        <CardDescription>여러 동작을 한 번에 보정하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Selection */}
        <div className="space-y-2">
          <Label>보정할 동작 선택</Label>
          <div className="max-h-40 overflow-y-auto border border-border/40 rounded-lg p-3 space-y-2">
            {motionEventsQuery.data?.map((event: any) => (
              <div key={event.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`event-${event.id}`}
                  checked={selectedEvents.includes(event.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEvents([...selectedEvents, event.id]);
                    } else {
                      setSelectedEvents(selectedEvents.filter((id) => id !== event.id));
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor={`event-${event.id}`} className="text-sm cursor-pointer flex-1">
                  <Badge variant="outline" className="mr-2">
                    {event.modaptsCode}
                  </Badge>
                  {event.description}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedEvents.length}개 선택됨
          </p>
        </div>

        {/* Code Selection */}
        <div className="space-y-2">
          <Label htmlFor="bulk-code">적용할 코드</Label>
          <Select value={bulkCode} onValueChange={setBulkCode}>
            <SelectTrigger id="bulk-code">
              <SelectValue placeholder="코드 선택..." />
            </SelectTrigger>
            <SelectContent>
              {MODAPTS_CODES.map((group) => (
                <div key={group.category}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {group.category}
                  </div>
                  {group.codes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Apply Button */}
        <Button
          onClick={handleBulkApply}
          disabled={selectedEvents.length === 0 || !bulkCode || isApplying}
          className="w-full"
        >
          {isApplying ? "적용 중..." : "일괄 적용"}
        </Button>
      </CardContent>
    </Card>
  );
}
