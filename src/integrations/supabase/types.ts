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
          os_id: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          os_id?: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          os_id?: string | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_movimentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
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
          total_os: number
          uf: string | null
          ultima_os: string | null
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
          total_os?: number
          uf?: string | null
          ultima_os?: string | null
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
          total_os?: number
          uf?: string | null
          ultima_os?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      devolucoes: {
        Row: {
          aparelho: string
          cliente: string
          created_at: string
          data_devolucao: string
          defeito: string | null
          id: string
          observacao: string | null
          os_id: string
          user_id: string
        }
        Insert: {
          aparelho: string
          cliente: string
          created_at?: string
          data_devolucao?: string
          defeito?: string | null
          id?: string
          observacao?: string | null
          os_id: string
          user_id: string
        }
        Update: {
          aparelho?: string
          cliente?: string
          created_at?: string
          data_devolucao?: string
          defeito?: string | null
          id?: string
          observacao?: string | null
          os_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devolucoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          aparelho: string
          ativo: boolean
          canal_de_venda: string
          categoria: string | null
          condicao: string | null
          created_at: string
          custo: number | null
          defeito: string | null
          fornecedor: string | null
          id: string
          localizacao: string | null
          marca: string | null
          modelo: string | null
          observacao: string | null
          preco_venda: number | null
          proprietario: string
          quantidade: number
          sku: string | null
          subcategoria: string | null
          unidade: string
          user_id: string
        }
        Insert: {
          aparelho: string
          ativo?: boolean
          canal_de_venda: string
          categoria?: string | null
          condicao?: string | null
          created_at?: string
          custo?: number | null
          defeito?: string | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          preco_venda?: number | null
          proprietario: string
          quantidade?: number
          sku?: string | null
          subcategoria?: string | null
          unidade?: string
          user_id: string
        }
        Update: {
          aparelho?: string
          ativo?: boolean
          canal_de_venda?: string
          categoria?: string | null
          condicao?: string | null
          created_at?: string
          custo?: number | null
          defeito?: string | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          preco_venda?: number | null
          proprietario?: string
          quantidade?: number
          sku?: string | null
          subcategoria?: string | null
          unidade?: string
          user_id?: string
        }
        Relationships: []
      }
      estoque_compatibilidade: {
        Row: {
          aparelho_marca: string
          aparelho_modelo: string
          created_at: string
          estoque_id: string
          id: string
          user_id: string
        }
        Insert: {
          aparelho_marca: string
          aparelho_modelo: string
          created_at?: string
          estoque_id: string
          id?: string
          user_id: string
        }
        Update: {
          aparelho_marca?: string
          aparelho_modelo?: string
          created_at?: string
          estoque_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_compatibilidade_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentos: {
        Row: {
          created_at: string
          estoque_id: string
          id: string
          motivo: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estoque_id: string
          id?: string
          motivo?: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          estoque_id?: string
          id?: string
          motivo?: string | null
          quantidade?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentos_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_opcoes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          referencia: string | null
          tipo: string
          user_id: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          referencia?: string | null
          tipo: string
          user_id: string
          valor: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          referencia?: string | null
          tipo?: string
          user_id?: string
          valor?: string
        }
        Relationships: []
      }
      orcamento_solicitacoes: {
        Row: {
          atendimento: string
          categoria: string
          client_token: string
          consentimento_lgpd: boolean
          created_at: string
          descricao_defeito: string
          email: string | null
          estado_geral: string | null
          historico: string[]
          id: string
          imei1: string | null
          imei2: string | null
          info_adicional: string | null
          marca: string
          modelo: string
          nome: string
          numero_serie: string | null
          observacoes: string | null
          periodo_contato: string | null
          preferencia_contato: string | null
          protocolo: string
          servico: string
          sintomas: string[]
          status: string
          telefone: string
          updated_at: string
          whatsapp_status: string
        }
        Insert: {
          atendimento: string
          categoria: string
          client_token: string
          consentimento_lgpd?: boolean
          created_at?: string
          descricao_defeito: string
          email?: string | null
          estado_geral?: string | null
          historico?: string[]
          id?: string
          imei1?: string | null
          imei2?: string | null
          info_adicional?: string | null
          marca: string
          modelo: string
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          periodo_contato?: string | null
          preferencia_contato?: string | null
          protocolo: string
          servico: string
          sintomas?: string[]
          status?: string
          telefone: string
          updated_at?: string
          whatsapp_status?: string
        }
        Update: {
          atendimento?: string
          categoria?: string
          client_token?: string
          consentimento_lgpd?: boolean
          created_at?: string
          descricao_defeito?: string
          email?: string | null
          estado_geral?: string | null
          historico?: string[]
          id?: string
          imei1?: string | null
          imei2?: string | null
          info_adicional?: string | null
          marca?: string
          modelo?: string
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          periodo_contato?: string | null
          preferencia_contato?: string | null
          protocolo?: string
          servico?: string
          sintomas?: string[]
          status?: string
          telefone?: string
          updated_at?: string
          whatsapp_status?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_orcamento: string
          descricao: string | null
          id: string
          os_id: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_orcamento?: string
          descricao?: string | null
          id?: string
          os_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_orcamento?: string
          descricao?: string | null
          id?: string
          os_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aparelho: string
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_conclusao: string | null
          data_entrada: string
          defeito: string | null
          id: string
          marca: string | null
          numero: number
          observacao: string | null
          quantidade: number
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          aparelho: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_entrada?: string
          defeito?: string | null
          id?: string
          marca?: string | null
          numero?: number
          observacao?: string | null
          quantidade?: number
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          aparelho?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_entrada?: string
          defeito?: string | null
          id?: string
          marca?: string | null
          numero?: number
          observacao?: string | null
          quantidade?: number
          status?: string
          telefone?: string | null
          updated_at?: string
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      estoque_opcoes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          referencia: string | null
          tipo: string
          user_id: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          referencia?: string | null
          tipo: string
          user_id: string
          valor: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          referencia?: string | null
          tipo?: string
          user_id?: string
          valor?: string
        }
        Relationships: []
      }
      estoque_compatibilidade: {
        Row: {
          aparelho_marca: string
          aparelho_modelo: string
          created_at: string
          estoque_id: string
          id: string
          user_id: string
        }
        Insert: {
          aparelho_marca: string
          aparelho_modelo: string
          created_at?: string
          estoque_id: string
          id?: string
          user_id: string
        }
        Update: {
          aparelho_marca?: string
          aparelho_modelo?: string
          created_at?: string
          estoque_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_compatibilidade_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentos: {
        Row: {
          created_at: string
          estoque_id: string
          id: string
          motivo: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estoque_id: string
          id?: string
          motivo?: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          estoque_id?: string
          id?: string
          motivo?: string | null
          quantidade?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentos_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirmar_whatsapp_solicitacao: {
        Args: { _token: string }
        Returns: undefined
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
