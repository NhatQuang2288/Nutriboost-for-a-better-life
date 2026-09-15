"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEX_LABELS, STATUS_LABELS } from "@/features/clients/labels";
import { formatDateVN } from "@/lib/datetime/vn";
import { cn } from "@/lib/utils";

interface ClientListItem {
  id: string;
  fullName: string;
  age: number;
  sex: "male" | "female";
  weightKg: number;
  bmi: number | null;
  bmiCategory: string | null;
  targetWeightKg: number;
  progressPercent: number;
  status: "active" | "paused" | "achieved";
  lastLogAt: string | null;
  loggedToday: boolean;
  needsAttention: boolean;
}

interface ApiErrorResponse {
  error: { code: string; message: string };
}

function lastLogText(client: ClientListItem): string {
  if (!client.lastLogAt) return "Chưa log";
  if (client.loggedToday) return "Hôm nay";
  return formatDateVN(client.lastLogAt);
}

function StatusBadge({ status }: { status: ClientListItem["status"] }) {
  const variant = status === "achieved" ? "default" : status === "paused" ? "secondary" : "outline";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function AttentionDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title="Chưa log ≥ 2 ngày"
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-destructive"
    />
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientListItem["status"]>("all");

  const query = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      const body = (await res.json()) as { clients: ClientListItem[] } | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return (body as { clients: ClientListItem[] }).clients;
    },
  });

  const filtered = useMemo(() => {
    if (!query.data) return [];
    const term = search.trim().toLowerCase();
    return query.data.filter((c) => {
      const matchesSearch = term === "" || c.fullName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [query.data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Khách chưa log ≥ 2 ngày được đưa lên đầu danh sách và đánh dấu chấm đỏ.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">Thêm khách hàng</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Tìm theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang theo dõi</SelectItem>
            <SelectItem value="paused">Tạm dừng</SelectItem>
            <SelectItem value="achieved">Đã đạt mục tiêu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <p className="text-sm text-destructive">
          Không tải được danh sách khách hàng: {(query.error as Error).message}
        </p>
      )}

      {query.isSuccess && filtered.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {query.data.length === 0
            ? "Chưa có khách hàng nào. Bấm \"Thêm khách hàng\" để bắt đầu."
            : "Không tìm thấy khách hàng phù hợp."}
        </div>
      )}

      {query.isSuccess && filtered.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Tuổi/Giới tính</TableHead>
                  <TableHead>Cân nặng</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Mục tiêu</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Log lần cuối</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-2 hover:underline">
                        <AttentionDot show={client.needsAttention} />
                        {client.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono">
                      {client.age} / {SEX_LABELS[client.sex]}
                    </TableCell>
                    <TableCell className="font-mono">{client.weightKg.toFixed(1)} kg</TableCell>
                    <TableCell className="font-mono">{client.bmi?.toFixed(1) ?? "-"}</TableCell>
                    <TableCell className="font-mono">{client.targetWeightKg.toFixed(1)} kg</TableCell>
                    <TableCell className="font-mono">{client.progressPercent}%</TableCell>
                    <TableCell className={cn(client.needsAttention && "text-destructive")}>
                      {lastLogText(client)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {filtered.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block rounded-md border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <AttentionDot show={client.needsAttention} />
                    {client.fullName}
                  </span>
                  <StatusBadge status={client.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client.age} tuổi / {SEX_LABELS[client.sex]}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-sm">
                  <span>{client.weightKg.toFixed(1)} kg</span>
                  <span>BMI {client.bmi?.toFixed(1) ?? "-"}</span>
                  <span>{client.progressPercent}%</span>
                </div>
                <p className={cn("mt-2 text-xs", client.needsAttention ? "text-destructive" : "text-muted-foreground")}>
                  Log lần cuối: {lastLogText(client)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
