"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Food {
  id: string;
  name_vi: string;
  unit: string;
  calo_per_unit: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  category: string;
  source: string;
}
interface FoodsResponse {
  foods: Food[];
  page: number;
  totalPages: number;
  total: number;
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = useQuery({
    queryKey: ["foods", debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/foods?${params}`);
      const body = (await res.json()) as FoodsResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return body as FoodsResponse;
    },
    placeholderData: (previous) => previous,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cơ sở dữ liệu món</h1>
        <p className="text-sm text-muted-foreground">
          {query.data ? `${query.data.total} món ăn` : "Đang tải..."} — tìm kiếm không dấu, ví dụ
          &quot;pho bo&quot; cho &quot;Phở bò&quot;.
        </p>
      </div>

      <Input
        placeholder="Tìm món ăn..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {query.isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <p className="text-sm text-destructive">
          Không tải được danh sách món ăn: {(query.error as Error).message}
        </p>
      )}

      {query.isSuccess && query.data.foods.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy món ăn phù hợp.
        </div>
      )}

      {query.isSuccess && query.data.foods.length > 0 && (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên món</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Calo</TableHead>
                  <TableHead>Protein</TableHead>
                  <TableHead>Carb</TableHead>
                  <TableHead>Fat</TableHead>
                  <TableHead>Nhóm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.foods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name_vi}</TableCell>
                    <TableCell className="text-muted-foreground">{food.unit}</TableCell>
                    <TableCell className="font-mono">{Math.round(food.calo_per_unit)}</TableCell>
                    <TableCell className="font-mono">{food.protein_g}g</TableCell>
                    <TableCell className="font-mono">{food.carb_g}g</TableCell>
                    <TableCell className="font-mono">{food.fat_g}g</TableCell>
                    <TableCell>
                      <Badge variant="outline">{food.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {query.data.page} / {query.data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                disabled={page >= query.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
