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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      caixa_movimentos: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      cliente_anexos: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          nome: string
          path: string
          tamanho: number | null
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          nome: string
          path: string
          tamanho?: number | null
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          nome?: string
          path?: string
          tamanho?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_anexos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_contatos: {
        Row: {
          cargo: string | null
          cliente_id: string
          created_at: string
          email: string | null
          id: string
          nome: string
          principal: boolean
          telefone: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          cargo?: string | null
          cliente_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          principal?: boolean
          telefone?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          cargo?: string | null
          cliente_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          principal?: boolean
          telefone?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_interacoes: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao: string
          id?: string
          tipo?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_interacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aceita_email: boolean
          aceita_marketing: boolean
          aceita_sms: boolean
          aceita_whatsapp: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          classificacao: string | null
          complemento: string | null
          consentimento_data: string | null
          consentimento_lgpd: boolean
          created_at: string
          data_nascimento: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          id: string
          limite_credito: number
          motivo_bloqueio: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          rg_ie: string | null
          status: string
          tags: string[]
          telefone: string | null
          telefone2: string | null
          tipo_pessoa: string
          uf: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          aceita_email?: boolean
          aceita_marketing?: boolean
          aceita_sms?: boolean
          aceita_whatsapp?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          classificacao?: string | null
          complemento?: string | null
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_credito?: number
          motivo_bloqueio?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          rg_ie?: string | null
          status?: string
          tags?: string[]
          telefone?: string | null
          telefone2?: string | null
          tipo_pessoa?: string
          uf?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          aceita_email?: boolean
          aceita_marketing?: boolean
          aceita_sms?: boolean
          aceita_whatsapp?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          classificacao?: string | null
          complemento?: string | null
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_credito?: number
          motivo_bloqueio?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          rg_ie?: string | null
          status?: string
          tags?: string[]
          telefone?: string | null
          telefone2?: string | null
          tipo_pessoa?: string
          uf?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          aparelho: string
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_entrada: string
          defeito: string | null
          id: string
          marca: string | null
          numero: number
          observacao: string | null
          quantidade: number
          status: string
          telefone: string | null
          user_id: string
          valor: number | null
        }
        Insert: {
          aparelho: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_entrada?: string
          defeito?: string | null
          id?: string
          marca?: string | null
          numero?: number
          observacao?: string | null
          quantidade?: number
          status?: string
          telefone?: string | null
          user_id: string
          valor?: number | null
        }
        Update: {
          aparelho?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_entrada?: string
          defeito?: string | null
          id?: string
          marca?: string | null
          numero?: number
          observacao?: string | null
          quantidade?: number
          status?: string
          telefone?: string | null
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      servico_tipos: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_max: number
          preco_min: number
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_max: number
          preco_min: number
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_max?: number
          preco_min?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
