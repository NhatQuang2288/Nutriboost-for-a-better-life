"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { acceptInviteSchema } from "@/lib/auth/schemas";

interface InvitePreview {
  fullName: string;
  ptFullName: string;
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const inviteQuery = useQuery({
    queryKey: ["invite", code],
    queryFn: async () => {
      const res = await fetch(`/api/invites/${code}`);
      const body = (await res.json()) as InvitePreview | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body as InvitePreview;
    },
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invites/${code}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
    },
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công!");
      router.push("/c/today");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = acceptInviteSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
      return;
    }
    setFieldError(null);
    acceptMutation.mutate();
  }

  if (inviteQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không thể tham gia</CardTitle>
          <CardDescription>
            {inviteQuery.error?.message ?? "Mã mời không hợp lệ."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chào {inviteQuery.data.fullName}</CardTitle>
        <CardDescription>
          Bạn được PT {inviteQuery.data.ptFullName} mời tham gia NutriBoost. Tạo tài khoản để bắt
          đầu theo dõi dinh dưỡng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
            {acceptMutation.isPending ? "Đang tạo tài khoản..." : "Tham gia"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
