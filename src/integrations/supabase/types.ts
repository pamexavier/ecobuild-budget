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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          id: string
          nome: string
          razao_social: string | null
          tenant_id: string
        }
        Insert: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          razao_social?: string | null
          tenant_id: string
        }
        Update: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          razao_social?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          created_at: string
          data_lancamento: string
          data_pagamento: string | null
          descricao: string | null
          id: string
          obra_id: string | null
          parceiro_id: string
          percentual: number
          status: string
          tenant_id: string
          tipo: string
          valor_base: number
          valor_comissao: number
        }
        Insert: {
          created_at?: string
          data_lancamento?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          obra_id?: string | null
          parceiro_id: string
          percentual?: number
          status?: string
          tenant_id: string
          tipo?: string
          valor_base?: number
          valor_comissao?: number
        }
        Update: {
          created_at?: string
          data_lancamento?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          obra_id?: string | null
          parceiro_id?: string
          percentual?: number
          status?: string
          tenant_id?: string
          tipo?: string
          valor_base?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          created_at: string
          data: string
          id: string
          obra_id: string
          profissional_id: string
          tipo: string
          turnos: string[] | null
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          obra_id: string
          profissional_id: string
          tipo?: string
          turnos?: string[] | null
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          obra_id?: string
          profissional_id?: string
          tipo?: string
          turnos?: string[] | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          cliente_id: string | null
          created_at: string
          gasto_atual: number
          id: string
          nome: string
          orcamento_limite: number
          tipo_contrato: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          gasto_atual?: number
          id?: string
          nome: string
          orcamento_limite?: number
          tipo_contrato?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          gasto_atual?: number
          id?: string
          nome?: string
          orcamento_limite?: number
          tipo_contrato?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_categoria: {
        Row: {
          id: string
          nome: string
          obra_id: string
          valor_previsto: number
        }
        Insert: {
          id?: string
          nome: string
          obra_id: string
          valor_previsto?: number
        }
        Update: {
          id?: string
          nome?: string
          obra_id?: string
          valor_previsto?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_categoria_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          comissao_obra_pct: number
          comissao_projeto_pct: number
          comissao_rt_pct: number
          created_at: string
          id: string
          nome: string
          tenant_id: string
        }
        Insert: {
          comissao_obra_pct?: number
          comissao_projeto_pct?: number
          comissao_rt_pct?: number
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
        }
        Update: {
          comissao_obra_pct?: number
          comissao_projeto_pct?: number
          comissao_rt_pct?: number
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          categoria: string
          chave_pix: string | null
          cpf: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          categoria: string
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          categoria?: string
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          pode_cadastrar_profissional: boolean
          pode_criar_obra: boolean
          pode_editar_orcamento: boolean
          pode_gerenciar_acessos: boolean
          pode_lancar_despesa: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pode_cadastrar_profissional?: boolean
          pode_criar_obra?: boolean
          pode_editar_orcamento?: boolean
          pode_gerenciar_acessos?: boolean
          pode_lancar_despesa?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pode_cadastrar_profissional?: boolean
          pode_criar_obra?: boolean
          pode_editar_orcamento?: boolean
          pode_gerenciar_acessos?: boolean
          pode_lancar_despesa?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          created_at: string
          dados_json: Json | null
          id: string
          obra_id: string
          semana_fim: string
          semana_inicio: string
          total_acumulado: number
          total_mensal: number
          total_semanal: number
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          id?: string
          obra_id: string
          semana_fim: string
          semana_inicio: string
          total_acumulado?: number
          total_mensal?: number
          total_semanal?: number
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          id?: string
          obra_id?: string
          semana_fim?: string
          semana_inicio?: string
          total_acumulado?: number
          total_mensal?: number
          total_semanal?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "supervisor" | "encarregada" | "super_admin"
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
      app_role: ["gestor", "supervisor", "encarregada", "super_admin"],
    },
  },
} as const
