// Database types for supabase-js, in the shape `supabase gen types typescript` writes.
// GENERATED from the migrated schema by supabase/tests/local/gen_types.py; do not edit by hand.
// Regenerate after any migration (see that file), or with `pnpm db:types` once the Supabase CLI is available.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      adviser_feedback: {
        Row: {
          booking_id: string
          feedback_text: string
          sent_at: string
        }
        Insert: {
          booking_id: string
          feedback_text: string
          sent_at?: string
        }
        Update: {
          booking_id?: string
          feedback_text?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adviser_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_calls: {
        Row: {
          id: number
          user_id: string
          kind: string
          ok: boolean
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          kind: string
          ok: boolean
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          kind?: string
          ok?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: [
        ]
      }
      audit_log: {
        Row: {
          id: number
          accessor_id: string
          subject_id: string
          booking_id: string | null
          action: string
          accessed_at: string
        }
        Insert: {
          id?: never
          accessor_id: string
          subject_id: string
          booking_id?: string | null
          action: string
          accessed_at?: string
        }
        Update: {
          id?: never
          accessor_id?: string
          subject_id?: string
          booking_id?: string | null
          action?: string
          accessed_at?: string
        }
        Relationships: [
        ]
      }
      availability_slots: {
        Row: {
          id: string
          adviser_id: string
          slot_start: string
          minutes: number
          is_open: boolean
        }
        Insert: {
          id?: string
          adviser_id: string
          slot_start: string
          minutes: number
          is_open?: boolean
        }
        Update: {
          id?: string
          adviser_id?: string
          slot_start?: string
          minutes?: number
          is_open?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blocked_days: {
        Row: {
          adviser_id: string
          day: string
          reason: string | null
        }
        Insert: {
          adviser_id: string
          day: string
          reason?: string | null
        }
        Update: {
          adviser_id?: string
          day?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_days_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          id: number
          booking_id: string
          status: Database["public"]["Enums"]["booking_state"]
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: never
          booking_id: string
          status: Database["public"]["Enums"]["booking_state"]
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: never
          booking_id?: string
          status?: Database["public"]["Enums"]["booking_state"]
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookings: {
        Row: {
          id: string
          student_id: string
          slot_id: string
          topic: string
          note: string | null
          status: Database["public"]["Enums"]["booking_state"]
          shared_items: string[]
          request_id: string
          created_at: string
          adviser_note: string | null
        }
        Insert: {
          id?: string
          student_id: string
          slot_id: string
          topic: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_state"]
          shared_items?: string[]
          request_id: string
          created_at?: string
          adviser_note?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          slot_id?: string
          topic?: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_state"]
          shared_items?: string[]
          request_id?: string
          created_at?: string
          adviser_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      consents: {
        Row: {
          id: string
          user_id: string
          kind: Database["public"]["Enums"]["consent_kind"]
          given: boolean
          notice_version: string
          given_by: string
          consented_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: Database["public"]["Enums"]["consent_kind"]
          given: boolean
          notice_version: string
          given_by?: string
          consented_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: Database["public"]["Enums"]["consent_kind"]
          given?: boolean
          notice_version?: string
          given_by?: string
          consented_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          id: number
          to_user: string
          kind: string
          payload: Json
          attempts: number
          last_error: string | null
          next_attempt_at: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: never
          to_user: string
          kind: string
          payload?: Json
          attempts?: number
          last_error?: string | null
          next_attempt_at?: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          to_user?: string
          kind?: string
          payload?: Json
          attempts?: number
          last_error?: string | null
          next_attempt_at?: string
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          answer_text: string | null
          skipped: boolean
          marks: Json
          total: number | null
          ai_used: boolean
          ai_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          answer_text?: string | null
          skipped?: boolean
          marks: Json
          total?: never
          ai_used?: boolean
          ai_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          answer_text?: string | null
          skipped?: boolean
          marks?: Json
          total?: never
          ai_used?: boolean
          ai_feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          user_id: string
          lesson_id: string
          notes: string | null
          done_at: string | null
        }
        Insert: {
          user_id: string
          lesson_id: string
          notes?: string | null
          done_at?: string | null
        }
        Update: {
          user_id?: string
          lesson_id?: string
          notes?: string | null
          done_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mastery_checks: {
        Row: {
          id: string
          user_id: string
          skill_uri: string
          score: number
          retake_after_lesson: number | null
          taken_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_uri: string
          score: number
          retake_after_lesson?: number | null
          taken_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_uri?: string
          score?: number
          retake_after_lesson?: number | null
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_checks_skill_uri_fkey"
            columns: ["skill_uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
          {
            foreignKeyName: "mastery_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      parent_approvals: {
        Row: {
          user_id: string
          parent_email: string
          token_hash: string
          expires_at: string
          decision: boolean | null
          decided_at: string | null
        }
        Insert: {
          user_id: string
          parent_email: string
          token_hash: string
          expires_at: string
          decision?: boolean | null
          decided_at?: string | null
        }
        Update: {
          user_id?: string
          parent_email?: string
          token_hash?: string
          expires_at?: string
          decision?: boolean | null
          decided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_approvals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_sessions: {
        Row: {
          id: string
          user_id: string
          snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snapshot?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          full_name: string
          is_under_18: boolean
          account_locked: boolean
          education_level: Database["public"]["Enums"]["edu_level"] | null
          spm_grades: Json
          module_ids: string[]
          skills: string[]
          interests: string[]
          job_in_mind: string | null
          target_occupation: string | null
          locale: string
          last_login_at: string
          created_at: string
          programme: string | null
          semester: number | null
          institution: string | null
          staff_unit: string | null
          reminder_emails: boolean
        }
        Insert: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          full_name: string
          is_under_18?: boolean
          account_locked?: boolean
          education_level?: Database["public"]["Enums"]["edu_level"] | null
          spm_grades?: Json
          module_ids?: string[]
          skills?: string[]
          interests?: string[]
          job_in_mind?: string | null
          target_occupation?: string | null
          locale?: string
          last_login_at?: string
          created_at?: string
          programme?: string | null
          semester?: number | null
          institution?: string | null
          staff_unit?: string | null
          reminder_emails?: boolean
        }
        Update: {
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          full_name?: string
          is_under_18?: boolean
          account_locked?: boolean
          education_level?: Database["public"]["Enums"]["edu_level"] | null
          spm_grades?: Json
          module_ids?: string[]
          skills?: string[]
          interests?: string[]
          job_in_mind?: string | null
          target_occupation?: string | null
          locale?: string
          last_login_at?: string
          created_at?: string
          programme?: string | null
          semester?: number | null
          institution?: string | null
          staff_unit?: string | null
          reminder_emails?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_job_in_mind_fkey"
            columns: ["job_in_mind"]
            isOneToOne: false
            referencedRelation: "occupations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profiles_target_occupation_fkey"
            columns: ["target_occupation"]
            isOneToOne: false
            referencedRelation: "occupations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          link: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          link?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          key: string
          window_start: string
          expires_at: string
          hits: number
        }
        Insert: {
          key: string
          window_start: string
          expires_at: string
          hits?: number
        }
        Update: {
          key?: string
          window_start?: string
          expires_at?: string
          hits?: number
        }
        Relationships: [
        ]
      }
      review_cards: {
        Row: {
          id: string
          user_id: string
          skill_uri: string | null
          front: string
          back: string
          fsrs: Json
          card_due_at: string
          origin: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_uri?: string | null
          front: string
          back: string
          fsrs: Json
          card_due_at: string
          origin?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_uri?: string | null
          front?: string
          back?: string
          fsrs?: Json
          card_due_at?: string
          origin?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cards_skill_uri_fkey"
            columns: ["skill_uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
          {
            foreignKeyName: "review_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_study_options: {
        Row: {
          user_id: string
          option_id: string
          saved_at: string
        }
        Insert: {
          user_id: string
          option_id: string
          saved_at?: string
        }
        Update: {
          user_id?: string
          option_id?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_study_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "study_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_study_options_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skill_progress: {
        Row: {
          user_id: string
          skill_uri: string
          state: Database["public"]["Enums"]["skill_state"]
          evidence_note: string | null
          claimed: boolean
          evidence: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          skill_uri: string
          state: Database["public"]["Enums"]["skill_state"]
          evidence_note?: string | null
          claimed?: boolean
          evidence?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          skill_uri?: string
          state?: Database["public"]["Enums"]["skill_state"]
          evidence_note?: string | null
          claimed?: boolean
          evidence?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_progress_skill_uri_fkey"
            columns: ["skill_uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
          {
            foreignKeyName: "skill_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_undertakings: {
        Row: {
          id: string
          adviser_id: string
          version: string
          accepted_at: string
        }
        Insert: {
          id?: string
          adviser_id: string
          version: string
          accepted_at?: string
        }
        Update: {
          id?: string
          adviser_id?: string
          version?: string
          accepted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_undertakings_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_staff_undertaking: {
        Args: never
        Returns: undefined
      }
      add_ai_feedback: {
        Args: {
          p_user: string
          p_answer: string
          p_feedback: string
        }
        Returns: undefined
      }
      adviser_requests: {
        Args: never
        Returns: {
          id: string
          status: Database["public"]["Enums"]["booking_state"]
          topic: string
          note: string
          shared_count: number
          student_name: string
          education_level: Database["public"]["Enums"]["edu_level"]
          slot_start: string
          minutes: number
          has_feedback: boolean
          created_at: string
          student_id: string
          programme: string
          semester: number
          shared_items: string[]
        }[]
      }
      adviser_students: {
        Args: never
        Returns: {
          student_id: string
          full_name: string
          education_level: Database["public"]["Enums"]["edu_level"]
          programme: string
          semester: number
          sharing: boolean
          target_code: string
          target_title: string
          skills_ready: number
          skills_total: number
          last_session: string
          upcoming: Json
        }[]
      }
      app_role: {
        Args: never
        Returns: string
      }
      booked_by_me: {
        Args: {
          p_slot: string
        }
        Returns: boolean
      }
      cancel_booking: {
        Args: {
          p_booking: string
        }
        Returns: Json
      }
      claim_due_emails: {
        Args: {
          p_limit?: number
        }
        Returns: Database["public"]["Tables"]["email_outbox"]["Row"][]
      }
      claim_slot: {
        Args: {
          p_slot: string
          p_topic: string
          p_note: string
          p_shared: string[]
          p_request_id: string
        }
        Returns: Json
      }
      cohort_rows: {
        Args: {
          p_programme?: string
        }
        Returns: {
          metric: string
          label: string
          students: number
        }[]
      }
      complete_past_bookings: {
        Args: never
        Returns: number
      }
      delete_declined_student: {
        Args: {
          p_user: string
        }
        Returns: boolean
      }
      has_current_undertaking: {
        Args: {
          uid: string
        }
        Returns: boolean
      }
      hit_rate_limit: {
        Args: {
          p_key: string
          p_limit: number
          p_window: string
        }
        Returns: boolean
      }
      import_reference: {
        Args: {
          p: Json
        }
        Returns: Json
      }
      is_unlocked: {
        Args: never
        Returns: boolean
      }
      list_advisers: {
        Args: never
        Returns: {
          adviser_id: string
          full_name: string
          staff_unit: string
          institution: string
        }[]
      }
      move_booking: {
        Args: {
          p_booking: string
          p_slot: string
        }
        Returns: Json
      }
      my_booked_slots: {
        Args: {
          p_slots: string[]
        }
        Returns: string[]
      }
      set_booking_sharing: { Args: { p_booking: string; p_shared: string[] }; Returns: undefined }
      my_bookings: {
        Args: never
        Returns: {
          id: string
          status: Database["public"]["Enums"]["booking_state"]
          topic: string
          note: string
          shared_items: string[]
          adviser_note: string
          slot_id: string
          slot_start: string
          minutes: number
          adviser_id: string
          adviser_name: string
          feedback_text: string
          feedback_sent_at: string
          created_at: string
        }[]
      }
      my_slot: {
        Args: {
          p_slot: string
        }
        Returns: boolean
      }
      open_request: {
        Args: {
          p_booking: string
        }
        Returns: Json
      }
      open_slots: {
        Args: {
          p_from: string
          p_to: string
          p_adviser?: string
        }
        Returns: {
          id: string
          adviser_id: string
          adviser_name: string
          slot_start: string
          minutes: number
        }[]
      }
      purge_audit_log: {
        Args: never
        Returns: number
      }
      record_interview_answer: {
        Args: {
          p_user: string
          p_question: string
          p_answer: string
          p_skipped: boolean
          p_marks: Json
        }
        Returns: string
      }
      respond_booking: {
        Args: {
          p_booking: string
          p_accept: boolean
          p_note: string
        }
        Returns: Json
      }
      send_feedback: {
        Args: {
          p_booking: string
          p_text: string
        }
        Returns: Json
      }
      slot_has_bookings: {
        Args: {
          p_slot: string
        }
        Returns: boolean
      }
      suggest_skills: {
        Args: {
          p_text: string
          p_limit?: number
        }
        Returns: {
          uri: string
          label: string
          score: number
        }[]
      }
      touch_activity: {
        Args: never
        Returns: boolean
      }
    }
    Enums: {
      booking_state: "requested" | "accepted" | "declined" | "change_requested" | "cancelled" | "completed"
      consent_kind: "terms_privacy" | "store_use" | "ai_processing" | "adviser_visibility" | "parent"
      edu_level: "spm" | "pre_university" | "diploma" | "degree"
      interview_round: "technical" | "behavioural"
      skill_state: "have" | "learning" | "missing" | "check_needed" | "mastered"
      user_role: "student" | "adviser" | "institution"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  ref: {
    Tables: {
      check_questions: {
        Row: {
          id: string
          lesson_id: string
          prompt: string
          options: Json
          answer_key: string
          position: number | null
          source_version: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          prompt: string
          options: Json
          answer_key: string
          position?: number | null
          source_version?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          prompt?: string
          options?: Json
          answer_key?: string
          position?: number | null
          source_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_areas: {
        Row: {
          label_en: string
          label_ms: string | null
          source_version: string
        }
        Insert: {
          label_en: string
          label_ms?: string | null
          source_version: string
        }
        Update: {
          label_en?: string
          label_ms?: string | null
          source_version?: string
        }
        Relationships: [
        ]
      }
      interview_questions: {
        Row: {
          id: string
          code: string
          round: Database["public"]["Enums"]["interview_round"]
          position: number
          prompt: string
          rubric: Json
          source_version: string | null
        }
        Insert: {
          id?: string
          code: string
          round: Database["public"]["Enums"]["interview_round"]
          position: number
          prompt: string
          rubric: Json
          source_version?: string | null
        }
        Update: {
          id?: string
          code?: string
          round?: Database["public"]["Enums"]["interview_round"]
          position?: number
          prompt?: string
          rubric?: Json
          source_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "occupations"
            referencedColumns: ["code"]
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          skill_uri: string
          lesson_no: number
          content_path: string
          title: string | null
          source_version: string | null
        }
        Insert: {
          id?: string
          skill_uri: string
          lesson_no: number
          content_path: string
          title?: string | null
          source_version?: string | null
        }
        Update: {
          id?: string
          skill_uri?: string
          lesson_no?: number
          content_path?: string
          title?: string | null
          source_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_skill_uri_fkey"
            columns: ["skill_uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
        ]
      }
      module_skills: {
        Row: {
          module_id: string
          uri: string
        }
        Insert: {
          module_id: string
          uri: string
        }
        Update: {
          module_id?: string
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_skills_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_skills_uri_fkey"
            columns: ["uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
        ]
      }
      modules: {
        Row: {
          id: string
          title: string
          programme: string
          source_version: string
        }
        Insert: {
          id: string
          title: string
          programme: string
          source_version: string
        }
        Update: {
          id?: string
          title?: string
          programme?: string
          source_version?: string
        }
        Relationships: [
        ]
      }
      occupation_skills: {
        Row: {
          code: string
          uri: string
          essential: boolean
        }
        Insert: {
          code: string
          uri: string
          essential: boolean
        }
        Update: {
          code?: string
          uri?: string
          essential?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "occupation_skills_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "occupations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "occupation_skills_uri_fkey"
            columns: ["uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
        ]
      }
      occupations: {
        Row: {
          code: string
          title_en: string
          title_ms: string | null
          tasks: string[]
          interest_areas: string[]
          source_version: string
          source_url: string | null
          verified: boolean
        }
        Insert: {
          code: string
          title_en: string
          title_ms?: string | null
          tasks: string[]
          interest_areas?: string[]
          source_version: string
          source_url?: string | null
          verified?: boolean
        }
        Update: {
          code?: string
          title_en?: string
          title_ms?: string | null
          tasks?: string[]
          interest_areas?: string[]
          source_version?: string
          source_url?: string | null
          verified?: boolean
        }
        Relationships: [
        ]
      }
      skills: {
        Row: {
          uri: string
          label_en: string
          label_ms: string | null
          alt_labels: string[]
          esco_label: string | null
          esco_uri: string | null
          esco_uri_status: string
          source_version: string | null
        }
        Insert: {
          uri: string
          label_en: string
          label_ms?: string | null
          alt_labels?: string[]
          esco_label?: string | null
          esco_uri?: string | null
          esco_uri_status?: string
          source_version?: string | null
        }
        Update: {
          uri?: string
          label_en?: string
          label_ms?: string | null
          alt_labels?: string[]
          esco_label?: string | null
          esco_uri?: string | null
          esco_uri_status?: string
          source_version?: string | null
        }
        Relationships: [
        ]
      }
      spm_subject_skills: {
        Row: {
          subject: string
          uri: string
          min_grade: string
        }
        Insert: {
          subject: string
          uri: string
          min_grade?: string
        }
        Update: {
          subject?: string
          uri?: string
          min_grade?: string
        }
        Relationships: [
          {
            foreignKeyName: "spm_subject_skills_uri_fkey"
            columns: ["uri"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["uri"]
          },
        ]
      }
      study_options: {
        Row: {
          id: string
          code: string | null
          level: Database["public"]["Enums"]["edu_level"]
          kind: string
          institution: string
          programme: string
          duration: string | null
          award: string | null
          source_url: string
          verified: boolean
          source_version: string | null
        }
        Insert: {
          id?: string
          code?: string | null
          level: Database["public"]["Enums"]["edu_level"]
          kind: string
          institution: string
          programme: string
          duration?: string | null
          award?: string | null
          source_url: string
          verified?: boolean
          source_version?: string | null
        }
        Update: {
          id?: string
          code?: string | null
          level?: Database["public"]["Enums"]["edu_level"]
          kind?: string
          institution?: string
          programme?: string
          duration?: string | null
          award?: string | null
          source_url?: string
          verified?: boolean
          source_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_options_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "occupations"
            referencedColumns: ["code"]
          },
        ]
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

type DefaultSchema = Database["public"]
type SchemaName = Exclude<keyof Database, "__InternalSupabase">

export type Tables<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Row: infer R } ? R : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Insert: infer I } ? I : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Update: infer U } ? U : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export type Functions<T extends keyof DefaultSchema["Functions"]> = DefaultSchema["Functions"][T]

