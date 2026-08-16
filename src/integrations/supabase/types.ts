export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      kategorie: {
        Row: {
          created_at: string
          id: string
          nazev: string
          poradi: number
          sekce: string
          slug: string
          updated_at: string
          znacka: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nazev: string
          poradi?: number
          sekce?: string
          slug: string
          updated_at?: string
          znacka?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nazev?: string
          poradi?: number
          sekce?: string
          slug?: string
          updated_at?: string
          znacka?: string | null
        }
        Relationships: []
      }
      objednavka_polozky: {
        Row: {
          cena: number
          created_at: string
          id: string
          nazev: string
          objednavka_id: string
          pocet: number
          slug: string | null
        }
        Insert: {
          cena?: number
          created_at?: string
          id?: string
          nazev: string
          objednavka_id: string
          pocet?: number
          slug?: string | null
        }
        Update: {
          cena?: number
          created_at?: string
          id?: string
          nazev?: string
          objednavka_id?: string
          pocet?: number
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objednavka_polozky_objednavka_id_fkey"
            columns: ["objednavka_id"]
            isOneToOne: false
            referencedRelation: "objednavky"
            referencedColumns: ["id"]
          },
        ]
      }
      objednavky: {
        Row: {
          celkem: number
          created_at: string
          email: string
          id: string
          jmeno: string
          poznamka: string | null
          stav: string
          telefon: string | null
          updated_at: string
        }
        Insert: {
          celkem?: number
          created_at?: string
          email: string
          id?: string
          jmeno: string
          poznamka?: string | null
          stav?: string
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          celkem?: number
          created_at?: string
          email?: string
          id?: string
          jmeno?: string
          poznamka?: string | null
          stav?: string
          telefon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      produkty: {
        Row: {
          aktivni: boolean
          cena: number
          created_at: string
          id: string
          kategorie_id: string | null
          kratky: string
          nazev: string
          neni_pro_koho: string | null
          oblibene: boolean
          obrazek_url: string | null
          parametry: Json
          popis: string
          pro_koho: string[]
          puvodni_cena: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          aktivni?: boolean
          cena?: number
          created_at?: string
          id?: string
          kategorie_id?: string | null
          kratky?: string
          nazev: string
          neni_pro_koho?: string | null
          oblibene?: boolean
          obrazek_url?: string | null
          parametry?: Json
          popis?: string
          pro_koho?: string[]
          puvodni_cena?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          aktivni?: boolean
          cena?: number
          created_at?: string
          id?: string
          kategorie_id?: string | null
          kratky?: string
          nazev?: string
          neni_pro_koho?: string | null
          oblibene?: boolean
          obrazek_url?: string | null
          parametry?: Json
          popis?: string
          pro_koho?: string[]
          puvodni_cena?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produkty_kategorie_id_fkey"
            columns: ["kategorie_id"]
            isOneToOne: false
            referencedRelation: "kategorie"
            referencedColumns: ["id"]
          },
        ]
      }
      servis_poptavky: {
        Row: {
          created_at: string
          email: string
          id: string
          jmeno: string
          popis: string | null
          stav: string
          telefon: string | null
          termin: string | null
          typ_sluzby: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          jmeno: string
          popis?: string | null
          stav?: string
          telefon?: string | null
          termin?: string | null
          typ_sluzby?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          jmeno?: string
          popis?: string | null
          stav?: string
          telefon?: string | null
          termin?: string | null
          typ_sluzby?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
