"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MEAL_TYPE_LABELS } from "@/features/tracking/labels";
import { cn } from "@/lib/utils";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface Food {
  id: string;
  name_vi: string;
  unit: string;
  calo_per_unit: number;
}
interface FoodsResponse {
  foods: Food[];
}
interface ApiErrorResponse {
  error: { code: string; message: string };
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function LogMealPage() {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const foodsQuery = useQuery({
    queryKey: ["foods-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedSearch, limit: "20" });
      const res = await fetch(`/api/foods?${params}`);
      const body = (await res.json()) as FoodsResponse | ApiErrorResponse;
      if (!res.ok) throw new Error((body as ApiErrorResponse).error.message);
      return (body as FoodsResponse).foods;
    },
    enabled: mealType !== null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meal-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, foodId: selectedFood!.id, quantity }),
      });
      if (!res.ok) {
        const body = (await res.json()) as ApiErrorResponse;
        throw new Error(body.error.message);
      }
    },
    onSuccess: () => {
      toast.success(`Đã ghi ${selectedFood!.name_vi}.`);
      setSelectedFood(null);
      setQuantity(1);
      router.push("/c/today");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ghi bữa ăn</h1>
        <p className="text-sm text-muted-foreground">Chọn bữa, tìm món, chọn khẩu phần.</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([value, label]) => (
          <Button
            key={value}
            variant={mealType === value ? "default" : "outline"}
            onClick={() => setMealType(value)}
            className="h-14 flex-col gap-0"
          >
            {label}
          </Button>
        ))}
      </div>

      {mealType && (
        <div className="space-y-3">
          <Input
            placeholder="Tìm món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {foodsQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {foodsQuery.isError && (
            <p className="text-sm text-destructive">
              Không tìm được món ăn: {(foodsQuery.error as Error).message}
            </p>
          )}

          {foodsQuery.isSuccess && foodsQuery.data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy món phù hợp.
            </p>
          )}

          <div className="space-y-2">
            {foodsQuery.data?.map((food) => (
              <button
                key={food.id}
                onClick={() => {
                  setSelectedFood(food);
                  setQuantity(1);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-3 text-left",
                  selectedFood?.id === food.id && "border-primary bg-primary/5",
                )}
              >
                <div>
                  <p className="font-medium">{food.name_vi}</p>
                  <p className="text-xs text-muted-foreground">{food.unit}</p>
                </div>
                <span className="font-mono text-sm">{Math.round(food.calo_per_unit)} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedFood && (
        <Card className="sticky bottom-4 border-primary">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div>
              <p className="font-medium">{selectedFood.name_vi}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedFood.calo_per_unit * quantity)} kcal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(0.5, Math.round((q - 0.5) * 10) / 10))}
              >
                −
              </Button>
              <span className="w-12 text-center font-mono">
                ×{quantity} ({selectedFood.unit})
              </span>
              <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.round((q + 0.5) * 10) / 10)}>
                +
              </Button>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
