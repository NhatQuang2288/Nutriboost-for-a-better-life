"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { WeightChart } from "@/components/charts/weight-chart";
import { createProgressLogSchema } from "@/features/tracking/schemas";
import { calculateWeightProgress } from "@/features/clients/progress";

interface ProgressLog {
  id: string;
  weight_kg: number;
  logged_at: string;
}
interface ProgressResponse {
  logs: ProgressLog[];
  currentWeightKg: number;
  targetWeightKg: number;
  initialWeightKg: number;
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

export default function ProgressPage() {
  const queryClient = useQueryClient();
  const [weightKg, setWeightKg] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["progress-logs"],
    queryFn: async () => {
      const res = await fetch("/api/progress-logs?days=30");
      const body = (await res.json()) as ProgressResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body as ProgressResponse;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = createProgressLogSchema.safeParse({ weightKg: Number(weightKg) });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
      const res = await fetch("/api/progress-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body;
    },
    onSuccess: () => {
      toast.success("Đã ghi cân nặng.");
      setWeightKg("");
      queryClient.invalidateQueries({ queryKey: ["progress-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tiến độ</h1>
        <p className="text-sm text-muted-foreground">Ghi cân nặng và theo dõi biểu đồ 30 ngày.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="weightKg">Cân nặng hôm nay (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Ghi cân nặng"}
            </Button>
          </form>
          {fieldError && <p className="mt-2 text-sm text-destructive">{fieldError}</p>}
        </CardContent>
      </Card>

      {query.isLoading && <Skeleton className="h-60 w-full" />}

      {query.isError && (
        <p className="text-sm text-destructive">
          Không tải được tiến độ: {(query.error as Error).message}
        </p>
      )}

      {query.isSuccess && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {query.data.currentWeightKg.toFixed(1)} kg
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  mục tiêu {query.data.targetWeightKg.toFixed(1)} kg
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  calculateWeightProgress(
                    query.data.initialWeightKg,
                    query.data.currentWeightKg,
                    query.data.targetWeightKg,
                  ).progressPercent
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biểu đồ cân nặng 30 ngày</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu, hãy ghi cân nặng đầu tiên của bạn.
                </p>
              ) : (
                <WeightChart
                  data={query.data.logs.map((l) => ({
                    date: l.logged_at.slice(0, 10),
                    weightKg: l.weight_kg,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Thông tin trong ứng dụng không thay thế tư vấn y tế.
      </p>
    </div>
  );
}
