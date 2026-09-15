// Hand-written to match supabase/migrations/*.sql. Once the Supabase project
// is live, regenerate with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and reconcile any drift with the migrations (the migrations are the source
// of truth, not this file).
//
// `Relationships: []` on every table and `Views`/`Functions: {}` on the
// schema are required to satisfy @supabase/postgrest-js's GenericSchema
// constraint — without them the query builder silently falls back to `never`.

export type UserRole = "pt" | "client";
export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose_weight" | "maintain" | "gain_muscle";
export type ClientStatus = "active" | "paused" | "achieved";
export type MealPlanStatus = "draft" | "approved" | "sent";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealLogSource = "client" | "pt";
export type SubscriptionTier = "plus" | "premium" | "diamond";
export type SubscriptionStatus = "active" | "canceled";
export type MealPlanGenerator = "pt" | "ai";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      client_invites: {
        Row: {
          id: string;
          client_id: string;
          code: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          code: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["client_invites"]["Insert"]
        >;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          pt_id: string;
          profile_id: string | null;
          full_name: string;
          age: number;
          height_cm: number;
          weight_kg: number;
          sex: Sex;
          activity_level: ActivityLevel;
          goal_type: GoalType;
          target_weight_kg: number;
          target_date: string;
          status: ClientStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          pt_id: string;
          profile_id?: string | null;
          full_name: string;
          age: number;
          height_cm: number;
          weight_kg: number;
          sex: Sex;
          activity_level: ActivityLevel;
          goal_type?: GoalType;
          target_weight_kg: number;
          target_date: string;
          status?: ClientStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      nutrition_targets: {
        Row: {
          client_id: string;
          bmi: number;
          bmi_category: string;
          bmr: number;
          tdee: number;
          daily_calo: number;
          protein_g: number;
          carb_g: number;
          fat_g: number;
          water_ml: number;
          calculated_at: string;
        };
        Insert: {
          client_id: string;
          bmi: number;
          bmi_category: string;
          bmr: number;
          tdee: number;
          daily_calo: number;
          protein_g: number;
          carb_g: number;
          fat_g: number;
          water_ml: number;
          calculated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["nutrition_targets"]["Insert"]
        >;
        Relationships: [];
      };
      foods: {
        Row: {
          id: string;
          name_vi: string;
          name_vi_unaccent: string;
          unit: string;
          calo_per_unit: number;
          protein_g: number;
          carb_g: number;
          fat_g: number;
          category: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_vi: string;
          unit: string;
          calo_per_unit: number;
          protein_g?: number;
          carb_g?: number;
          fat_g?: number;
          category: string;
          source: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["foods"]["Insert"]>;
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          client_id: string;
          week_start: string;
          status: MealPlanStatus;
          generated_by: MealPlanGenerator;
          token_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          week_start: string;
          status?: MealPlanStatus;
          generated_by?: MealPlanGenerator;
          token_cost?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_plans"]["Insert"]>;
        Relationships: [];
      };
      meal_plan_items: {
        Row: {
          id: string;
          meal_plan_id: string;
          day_index: number;
          meal_type: MealType;
          food_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          day_index: number;
          meal_type: MealType;
          food_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_plan_items"]["Insert"]
        >;
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          client_id: string;
          logged_at: string;
          meal_type: MealType;
          food_id: string;
          quantity: number;
          source: MealLogSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          logged_at?: string;
          meal_type: MealType;
          food_id: string;
          quantity: number;
          source?: MealLogSource;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "meal_logs_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      progress_logs: {
        Row: {
          id: string;
          client_id: string;
          logged_at: string;
          weight_kg: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          logged_at?: string;
          weight_kg: number;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["progress_logs"]["Insert"]
        >;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          pt_id: string;
          tier: SubscriptionTier;
          max_clients: number;
          started_at: string;
          status: SubscriptionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          pt_id: string;
          tier?: SubscriptionTier;
          max_clients?: number;
          started_at?: string;
          status?: SubscriptionStatus;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_foods: {
        Args: {
          search_query?: string;
          page_limit?: number;
          page_offset?: number;
        };
        Returns: Array<{
          id: string;
          name_vi: string;
          unit: string;
          calo_per_unit: number;
          protein_g: number;
          carb_g: number;
          fat_g: number;
          category: string;
          source: string;
          total_count: number;
        }>;
      };
    };
  };
}
