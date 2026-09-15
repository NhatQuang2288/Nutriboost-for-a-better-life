"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientSchema } from "@/features/clients/schemas";
import { ACTIVITY_LABELS } from "@/features/clients/labels";

interface ClientResponse {
  client: { id: string; full_name: string };
}
interface InviteResponse {
  code: string;
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

export default function NewClientPage() {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [activityLevel, setActivityLevel] = useState("");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = createClientSchema.safeParse({
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

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as ClientResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return (body as ClientResponse).client;
    },
    onSuccess: async (client) => {
      toast.success("Đã thêm khách hàng. Đang tạo mã mời...");
      const res = await fetch(`/api/clients/${client.id}/invite`, { method: "POST" });
      const body = (await res.json()) as InviteResponse | ApiErrorResponse;
      if (!res.ok) {
        toast.error((body as ApiErrorResponse).error.message);
        return;
      }
      setInviteLink(`${window.location.origin}/join/${(body as InviteResponse).code}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    createMutation.mutate();
  }

  if (inviteLink) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Đã tạo khách hàng</CardTitle>
          <CardDescription>
            Gửi liên kết này cho khách hàng để họ tạo tài khoản và tham gia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-muted p-3 font-mono text-sm break-all">
            {inviteLink}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              toast.success("Đã sao chép liên kết.");
            }}
          >
            Sao chép liên kết
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Thêm khách hàng</CardTitle>
        <CardDescription>
          Nhập hồ sơ và mục tiêu ban đầu. Hệ thống sẽ tính BMI/BMR/TDEE ngay sau khi lưu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">Tuổi</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
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
              <Label htmlFor="heightCm">Chiều cao (cm)</Label>
              <Input id="heightCm" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightKg">Cân nặng (kg)</Label>
              <Input id="weightKg" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mức vận động</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn mức vận động" />
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
              <Label htmlFor="targetWeightKg">Cân nặng mục tiêu (kg)</Label>
              <Input
                id="targetWeightKg"
                type="number"
                step="0.1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Ngày mục tiêu</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>

          {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Thêm khách hàng"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
