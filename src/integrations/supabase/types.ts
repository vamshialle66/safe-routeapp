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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_feature_state: {
        Row: {
          blocked_at: string
          feature: string
          safe_message: string
        }
        Insert: {
          blocked_at?: string
          feature: string
          safe_message: string
        }
        Update: {
          blocked_at?: string
          feature?: string
          safe_message?: string
        }
        Relationships: []
      }
      community_alerts: {
        Row: {
          category: string
          concern: string
          created_at: string
          id: string
          journey_id: string
          latitude: number | null
          location_label: string
          longitude: number | null
          model: string
          moderated_at: string | null
          moderated_by: string | null
          moderator_note: string | null
          reviewed_at: string | null
          route_label: string
          status: string
          summary: string
          urgency: string
          user_id: string
          verification: string
        }
        Insert: {
          category: string
          concern: string
          created_at?: string
          id?: string
          journey_id: string
          latitude?: number | null
          location_label: string
          longitude?: number | null
          model: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_note?: string | null
          reviewed_at?: string | null
          route_label: string
          status?: string
          summary: string
          urgency: string
          user_id: string
          verification?: string
        }
        Update: {
          category?: string
          concern?: string
          created_at?: string
          id?: string
          journey_id?: string
          latitude?: number | null
          location_label?: string
          longitude?: number | null
          model?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_note?: string | null
          reviewed_at?: string | null
          route_label?: string
          status?: string
          summary?: string
          urgency?: string
          user_id?: string
          verification?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relation?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relation?: string
          user_id?: string
        }
        Relationships: []
      }
      mumbai_crime_datasets: {
        Row: {
          completeness: string
          content_sha256: string
          coverage_geojson: Json | null
          id: string
          methodology: string
          period_end: string
          period_start: string
          retrieved_at: string
          reviewed_at: string | null
          source_url: string
          title: string
        }
        Insert: {
          completeness?: string
          content_sha256: string
          coverage_geojson?: Json | null
          id?: string
          methodology: string
          period_end: string
          period_start: string
          retrieved_at?: string
          reviewed_at?: string | null
          source_url: string
          title: string
        }
        Update: {
          completeness?: string
          content_sha256?: string
          coverage_geojson?: Json | null
          id?: string
          methodology?: string
          period_end?: string
          period_start?: string
          retrieved_at?: string
          reviewed_at?: string | null
          source_url?: string
          title?: string
        }
        Relationships: []
      }
      mumbai_crime_reports: {
        Row: {
          category: string
          dataset_id: string
          id: string
          incident_count: number
          latitude: number | null
          location_label: string
          location_precision: string
          longitude: number | null
          occurred_on: string | null
          source_locator: string
          source_record_id: string
        }
        Insert: {
          category: string
          dataset_id: string
          id?: string
          incident_count?: number
          latitude?: number | null
          location_label: string
          location_precision: string
          longitude?: number | null
          occurred_on?: string | null
          source_locator: string
          source_record_id: string
        }
        Update: {
          category?: string
          dataset_id?: string
          id?: string
          incident_count?: number
          latitude?: number | null
          location_label?: string
          location_precision?: string
          longitude?: number | null
          occurred_on?: string | null
          source_locator?: string
          source_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mumbai_crime_reports_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "mumbai_crime_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      route_ratings: {
        Row: {
          created_at: string
          felt_safe: boolean
          id: string
          journey_id: string
          route_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          felt_safe: boolean
          id?: string
          journey_id: string
          route_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          felt_safe?: boolean
          id?: string
          journey_id?: string
          route_number?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          analysis: Json | null
          analysis_id: string
          id: string
          name: string
          route_number: number
          saved_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          analysis_id: string
          id?: string
          name: string
          route_number: number
          saved_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          analysis_id?: string
          id?: string
          name?: string
          route_number?: number
          saved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_trips: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          destination_label: string
          destination_lat: number
          destination_lng: number
          ended_at: string | null
          id: string
          last_update_at: string | null
          origin_label: string
          origin_lat: number
          origin_lng: number
          route_distance_meters: number | null
          route_duration_seconds: number | null
          route_polyline: string | null
          share_code: string
          status: string
          traveler_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_label: string
          destination_lat: number
          destination_lng: number
          ended_at?: string | null
          id?: string
          last_update_at?: string | null
          origin_label: string
          origin_lat: number
          origin_lng: number
          route_distance_meters?: number | null
          route_duration_seconds?: number | null
          route_polyline?: string | null
          share_code: string
          status?: string
          traveler_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_label?: string
          destination_lat?: number
          destination_lng?: number
          ended_at?: string | null
          id?: string
          last_update_at?: string | null
          origin_label?: string
          origin_lat?: number
          origin_lng?: number
          route_distance_meters?: number | null
          route_duration_seconds?: number | null
          route_polyline?: string | null
          share_code?: string
          status?: string
          traveler_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          data: Json
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      area_report_counts: {
        Args: { _limit?: number }
        Returns: {
          latest_at: string
          location_label: string
          reports: number
        }[]
      }
      get_shared_trip_outcome: {
        Args: { _share_code: string }
        Returns: {
          destination_label: string
          ended_at: string
          origin_label: string
          status: string
          traveler_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_community_tips:
        | {
            Args: { _limit?: number }
            Returns: {
              approved_at: string
              category: string
              id: string
              location_label: string
              summary: string
              urgency: string
            }[]
          }
        | {
            Args: {
              _limit?: number
              _max_lat?: number
              _max_lng?: number
              _min_lat?: number
              _min_lng?: number
            }
            Returns: {
              approved_at: string
              category: string
              id: string
              location_label: string
              summary: string
              urgency: string
            }[]
          }
      list_reviewers: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      moderate_alert: {
        Args: { _decision: string; _id: string; _note?: string }
        Returns: undefined
      }
      route_confidence: {
        Args: { _journey_id: string; _route_number: number }
        Returns: {
          safe_count: number
          total_count: number
        }[]
      }
      set_reviewer: {
        Args: {
          _email: string
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
