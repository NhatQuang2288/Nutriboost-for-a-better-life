"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SEX_LABELS, ACTIVITY_LABELS, STATUS_LABELS } from "@/features/clients/labels";
import { MEAL_TYPE_LABELS } from "@/features/tracking/labels";
import { updateClientSchema } from "@/features/clients/schemas";
import { formatDateVN, formatTimeVN } from "@/lib/datetime/vn";
import { WeightChart } from "@/components/charts/weight-chart";
import { CalorieChart } from "@/components/charts/calorie-chart";

interface Client {
  id: string;
  full_name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  sex: "male" | "female";
  activity_level: string;
  target_weight_kg: number;
  target_date: string;
  status: "active" | "paused" | "achieved";
}
interface NutritionTargets {
  bmi: number;
  bmi_category: string;
  bmr: number;
  tdee: number;
  daily_calo: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  water_ml: number;
}
interface Warning {
  code: string;
  message: string;
}
interface MealLog {
  id: string;
  logged_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  quantity: number;
  food: { name_vi: string; unit: string; calo_per_unit: number } | null;
}
interface ClientDetailResponse {
  client: Client;
  nutritionTargets: NutritionTargets | null;
  initialWeightKg: number;
  progress: { lostKg: number; remainingKg: number; progressPercent: number };
  warnings: Warning[];
  recentMealLogs: MealLog[];
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

function useClientDetail(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      const body = (await res.json()) as ClientDetailResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body as ClientDetailResponse;
    },
  });
}

interface ProgressResponse {
  weightSeries: { date: string; weightKg: number | null }[];
  calorieSeries: { date: string; consumed: number; limit: number }[];
}

function useClientProgress(id: string) {
  return useQuery({
    queryKey: ["client-progress", id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}/progress?days=30`);
      const body = (await res.json()) as ProgressResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body as ProgressResponse;
    },
  });
}

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useClientDetail(id);
  const progressQuery = useClientProgress(id);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as ApiErrorResponse;
        throw new Error(body.error.message);
      }
    },
    onSuccess: () => {
      toast.success("Đã xoá khách hàng.");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <p className="text-sm text-destructive">
        Không tải được hồ sơ khách hàng: {(query.error as Error)?.message ?? "Lỗi không xác định."}
      </p>
    );
  }

  const { client, nutritionTargets, initialWeightKg, progress, warnings, recentMealLogs } = query.data;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{client.full_name}</h1>
          <Badge variant="outline" className="mt-1">
            {STATUS_LABELS[client.status]}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Sửa hồ sơ</Button>
            </DialogTrigger>
            <EditClientDialog client={client} onClose={() => setEditOpen(false)} clientId={id} />
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Xoá</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá {client.full_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toàn bộ dữ liệu dinh dưỡng, nhật ký ăn uống và tiến độ của khách hàng này sẽ bị
                  xoá vĩnh viễn. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate()}
                >
                  Xoá vĩnh viễn
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <Alert key={w.code} variant="destructive">
              <AlertTitle>Cảnh báo</AlertTitle>
              <AlertDescription>{w.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Block 1 — Hồ sơ & chỉ số */}
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ & chỉ số</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Field label="Tuổi" value={`${client.age}`} />
          <Field label="Giới tính" value={SEX_LABELS[client.sex]} />
          <Field label="Chiều cao" value={`${client.height_cm} cm`} />
          <Field label="Mức vận động" value={ACTIVITY_LABELS[client.activity_level]} small />

          <Field
            label="BMI (theo chuẩn châu Á)"
            value={nutritionTargets ? nutritionTargets.bmi.toFixed(1) : "-"}
          />
          <Field label="Phân loại BMI" value={nutritionTargets?.bmi_category ?? "-"} />
          <Field label="BMR" value={nutritionTargets ? `${Math.round(nutritionTargets.bmr)} kcal` : "-"} />
          <Field label="TDEE" value={nutritionTargets ? `${Math.round(nutritionTargets.tdee)} kcal` : "-"} />

          <Field
            label="Daily Calories"
            value={nutritionTargets ? `${Math.round(nutritionTargets.daily_calo)} kcal` : "-"}
          />
          <Field label="Protein" value={nutritionTargets ? `${Math.round(nutritionTargets.protein_g)} g` : "-"} />
          <Field label="Carb" value={nutritionTargets ? `${Math.round(nutritionTargets.carb_g)} g` : "-"} />
          <Field label="Fat" value={nutritionTargets ? `${Math.round(nutritionTargets.fat_g)} g` : "-"} />
          <Field label="Water" value={nutritionTargets ? `${Math.round(nutritionTargets.water_ml)} ml` : "-"} />
        </CardContent>
      </Card>

      {/* Block 2 — Mục tiêu */}
      <Card>
        <CardHeader>
          <CardTitle>Mục tiêu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between font-mono text-sm">
            <span>{initialWeightKg.toFixed(1)} kg</span>
            <span className="text-muted-foreground">
              hiện tại {client.weight_kg.toFixed(1)} kg
            </span>
            <span>{client.target_weight_kg.toFixed(1)} kg</span>
          </div>
          <Progress value={progress.progressPercent} />
          <div className="grid grid-cols-2 gap-4 font-mono text-sm sm:grid-cols-4">
            <Field label="Đã giảm" value={`${progress.lostKg.toFixed(1)} kg`} />
            <Field label="Hoàn thành" value={`${progress.progressPercent}%`} />
            <Field label="Còn lại" value={`${progress.remainingKg.toFixed(1)} kg`} />
            <Field label="Ngày mục tiêu" value={formatDateVN(client.target_date)} />
          </div>
        </CardContent>
      </Card>

      {/* Charts — 30 ngày */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cân nặng (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            {progressQuery.isLoading && <Skeleton className="h-60 w-full" />}
            {progressQuery.isError && (
              <p className="text-sm text-destructive">
                Không tải được biểu đồ: {(progressQuery.error as Error).message}
              </p>
            )}
            {progressQuery.isSuccess &&
              (progressQuery.data.weightSeries.every((p) => p.weightKg === null) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Khách hàng chưa ghi cân nặng lần nào.
                </p>
              ) : (
                <WeightChart data={progressQuery.data.weightSeries} />
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calories (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            {progressQuery.isLoading && <Skeleton className="h-60 w-full" />}
            {progressQuery.isError && (
              <p className="text-sm text-destructive">
                Không tải được biểu đồ: {(progressQuery.error as Error).message}
              </p>
            )}
            {progressQuery.isSuccess &&
              (progressQuery.data.calorieSeries.every((p) => p.consumed === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Khách hàng chưa ghi bữa ăn nào.
                </p>
              ) : (
                <CalorieChart data={progressQuery.data.calorieSeries} />
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent meal log */}
      <Card>
        <CardHeader>
          <CardTitle>Nhật ký ăn gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMealLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Khách hàng chưa ghi bữa ăn nào.</p>
          ) : (
            <ul className="divide-y">
              {recentMealLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium">{log.food?.name_vi ?? "Món đã xoá"}</span>
                    <span className="ml-2 text-muted-foreground">
                      {MEAL_TYPE_LABELS[log.meal_type]} · ×{log.quantity} ({log.food?.unit})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-muted-foreground">
                    <span>
                      {log.food ? Math.round(log.food.calo_per_unit * log.quantity) : 0} kcal
                    </span>
                    <span>{formatTimeVN(log.logged_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Thông tin trong ứng dụng không thay thế tư vấn y tế.
      </p>
    </div>
  );
}

function Field({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={small ? "text-sm" : "font-mono text-base"}>{value}</p>
    </div>
  );
}

function EditClientDialog({
  client,
  clientId,
  onClose,
}: {
  client: Client;
  clientId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(client.full_name);
  const [age, setAge] = useState(String(client.age));
  const [heightCm, setHeightCm] = useState(String(client.height_cm));
  const [weightKg, setWeightKg] = useState(String(client.weight_kg));
  const [sex, setSex] = useState(client.sex);
  const [activityLevel, setActivityLevel] = useState(client.activity_level);
  const [targetWeightKg, setTargetWeightKg] = useState(String(client.target_weight_kg));
  const [targetDate, setTargetDate] = useState(client.target_date);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(client.full_name);
    setAge(String(client.age));
    setHeightCm(String(client.height_cm));
    setWeightKg(String(client.weight_kg));
    setSex(client.sex);
    setActivityLevel(client.activity_level);
    setTargetWeightKg(String(client.target_weight_kg));
    setTargetDate(client.target_date);
  }, [client]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = updateClientSchema.safeParse({
        fullName,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        sex,
        activityLevel,
        targetWeightKg: Number(targetWeightKg),
        targetDate,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
      }
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body;
    },
    onSuccess: (data) => {
      toast.success("Đã cập nhật hồ sơ.");
      if (data.warnings?.length) {
        data.warnings.forEach((w: Warning) => toast.warning(w.message));
      }
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    mutation.mutate();
  }

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Sửa hồ sơ khách hàng</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-fullName">Họ và tên</Label>
          <Input id="edit-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-age">Tuổi</Label>
            <Input id="edit-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Giới tính</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-height">Chiều cao (cm)</Label>
            <Input id="edit-height" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-weight">Cân nặng (kg)</Label>
            <Input id="edit-weight" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mức vận động</Label>
          <Select value={activityLevel} onValueChange={setActivityLevel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-targetWeight">Cân nặng mục tiêu (kg)</Label>
            <Input
              id="edit-targetWeight"
              type="number"
              step="0.1"
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-targetDate">Ngày mục tiêu</Label>
            <Input
              id="edit-targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
        </div>
        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
