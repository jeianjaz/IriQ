export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }
      }
      sensor_readings: {
        Row: {
          id: string
          created_at: string
          device_id: string
          moisture_percentage: number
          moisture_digital: number
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          moisture_percentage: number
          moisture_digital: number
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          moisture_percentage?: number
          moisture_digital?: number
          user_id?: string
        }
      }
      device_status: {
        Row: {
          id: string
          created_at: string
          device_id: string
          pump_status: boolean
          automatic_mode: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          pump_status: boolean
          automatic_mode: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          pump_status?: boolean
          automatic_mode?: boolean
          last_seen?: string
          user_id?: string
        }
      }
      control_commands: {
        Row: {
          id: string
          created_at: string
          device_id: string
          pump_control: boolean
          automatic_mode: boolean
          user_id: string
          executed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          pump_control: boolean
          automatic_mode: boolean
          user_id: string
          executed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          pump_control?: boolean
          automatic_mode?: boolean
          user_id?: string
          executed?: boolean
        }
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
  }
}