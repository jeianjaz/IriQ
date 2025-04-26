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
      sensor_readings: {
        Row: {
          id: string
          created_at: string
          device_id: string
          moisture_percentage: number
          moisture_digital: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          moisture_percentage: number
          moisture_digital: boolean
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          moisture_percentage?: number
          moisture_digital?: boolean
        }
      }
      device_status: {
        Row: {
          id: string
          device_id: string
          pump_status: boolean
          automatic_mode: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          device_id: string
          pump_status: boolean
          automatic_mode: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          device_id?: string
          pump_status?: boolean
          automatic_mode?: boolean
          updated_at?: string
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
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
