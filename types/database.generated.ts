// Generado con `mcp__supabase__generate_typescript_types` (equivalente a
// `supabase gen types typescript`). No editar a mano — volver a generar y
// pegar acá cuando cambie el schema. Los tipos de dominio con nombres en
// español (Nnya, Legajo, Referente, etc.) están en `database.types.ts`,
// derivados de este archivo.
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
      actividades: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: string
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          lugar: string | null
          nnya_ids: string[]
          observaciones: string | null
          responsable_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          nnya_ids?: string[]
          observaciones?: string | null
          responsable_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          nnya_ids?: string[]
          observaciones?: string | null
          responsable_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          completada_por: string | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha_completada: string | null
          fecha_vencimiento: string | null
          id: string
          nnya_id: string
          observacion_cierre: string | null
          prioridad: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          completada_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_completada?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nnya_id: string
          observacion_cierre?: string | null
          prioridad?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          completada_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_completada?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nnya_id?: string
          observacion_cierre?: string | null
          prioridad?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_completada_por_fkey"
            columns: ["completada_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_judiciales: {
        Row: {
          caratula: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_hora: string
          id: string
          juzgado: string | null
          legajo_id: string
          nnya_id: string
          numero_expediente: string | null
          observaciones: string | null
          resultado: string | null
          tipo: string
          tribunal: string
          updated_at: string
        }
        Insert: {
          caratula?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_hora: string
          id?: string
          juzgado?: string | null
          legajo_id: string
          nnya_id: string
          numero_expediente?: string | null
          observaciones?: string | null
          resultado?: string | null
          tipo: string
          tribunal: string
          updated_at?: string
        }
        Update: {
          caratula?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_hora?: string
          id?: string
          juzgado?: string | null
          legajo_id?: string
          nnya_id?: string
          numero_expediente?: string | null
          observaciones?: string | null
          resultado?: string | null
          tipo?: string
          tribunal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_judiciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_judiciales_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_judiciales_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: string
          operacion: string
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          operacion: string
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          operacion?: string
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          fecha_diagnostico: string
          id: string
          institucion: string | null
          legajo_id: string
          nnya_id: string
          profesional: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          fecha_diagnostico?: string
          id?: string
          institucion?: string | null
          legajo_id: string
          nnya_id: string
          profesional?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_diagnostico?: string
          id?: string
          institucion?: string | null
          legajo_id?: string
          nnya_id?: string
          profesional?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          id: string
          legajo_id: string
          mime_type: string | null
          nnya_id: string
          nombre: string
          storage_path: string
          subido_por: string | null
          tamaño_bytes: number | null
          tipo: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          legajo_id: string
          mime_type?: string | null
          nnya_id: string
          nombre: string
          storage_path: string
          subido_por?: string | null
          tamaño_bytes?: number | null
          tipo: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          legajo_id?: string
          mime_type?: string | null
          nnya_id?: string
          nombre?: string
          storage_path?: string
          subido_por?: string | null
          tamaño_bytes?: number | null
          tipo?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_institucional: {
        Row: {
          created_at: string
          created_by: string
          estado: string
          fecha_reunion: string
          id: string
          observaciones: string | null
          periodo_anio: number
          periodo_mes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          estado?: string
          fecha_reunion: string
          id?: string
          observaciones?: string | null
          periodo_anio: number
          periodo_mes: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          estado?: string
          fecha_reunion?: string
          id?: string
          observaciones?: string | null
          periodo_anio?: number
          periodo_mes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_institucional_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_institucional_asistentes: {
        Row: {
          asistio: boolean
          created_at: string
          evaluacion_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          asistio?: boolean
          created_at?: string
          evaluacion_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          asistio?: boolean
          created_at?: string
          evaluacion_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_institucional_asistentes_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_institucional_asistentes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_institucional_casos: {
        Row: {
          created_at: string
          evaluacion_id: string
          id: string
          indicador_avance: number | null
          nnya_id: string
          recomendaciones: string | null
          resumen_situacion: string
          seguimiento_requerido: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluacion_id: string
          id?: string
          indicador_avance?: number | null
          nnya_id: string
          recomendaciones?: string | null
          resumen_situacion: string
          seguimiento_requerido?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluacion_id?: string
          id?: string
          indicador_avance?: number | null
          nnya_id?: string
          recomendaciones?: string | null
          resumen_situacion?: string
          seguimiento_requerido?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_institucional_casos_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_institucional_casos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      incidentes: {
        Row: {
          acciones_tomadas: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha_hora: string
          gravedad: string
          gravedad_sugerida: string | null
          id: string
          legajo_id: string
          nnya_id: string
          reportado_por: string | null
          sugerencia_aceptada: boolean
          tipo: string
          updated_at: string
        }
        Insert: {
          acciones_tomadas?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha_hora?: string
          gravedad?: string
          gravedad_sugerida?: string | null
          id?: string
          legajo_id: string
          nnya_id: string
          reportado_por?: string | null
          sugerencia_aceptada?: boolean
          tipo: string
          updated_at?: string
        }
        Update: {
          acciones_tomadas?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_hora?: string
          gravedad?: string
          gravedad_sugerida?: string | null
          id?: string
          legajo_id?: string
          nnya_id?: string
          reportado_por?: string | null
          sugerencia_aceptada?: boolean
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidentes_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidentes_reportado_por_fkey"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      informes: {
        Row: {
          contenido: string
          created_at: string
          elaborado_por: string | null
          estado: string
          fecha_informe: string
          id: string
          legajo_id: string
          nnya_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          contenido: string
          created_at?: string
          elaborado_por?: string | null
          estado?: string
          fecha_informe?: string
          id?: string
          legajo_id: string
          nnya_id: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          contenido?: string
          created_at?: string
          elaborado_por?: string | null
          estado?: string
          fecha_informe?: string
          id?: string
          legajo_id?: string
          nnya_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "informes_elaborado_por_fkey"
            columns: ["elaborado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      intervenciones: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string
          estado: string
          fecha: string
          id: string
          nnya_id: string
          observaciones: string | null
          profesional_id: string | null
          resultado: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: string
          fecha?: string
          id?: string
          nnya_id: string
          observaciones?: string | null
          profesional_id?: string | null
          resultado?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: string
          fecha?: string
          id?: string
          nnya_id?: string
          observaciones?: string | null
          profesional_id?: string | null
          resultado?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervenciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervenciones_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervenciones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      legajos: {
        Row: {
          created_at: string
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          motivo_cierre: string | null
          nnya_id: string
          numero_legajo: string
          observaciones: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          motivo_cierre?: string | null
          nnya_id: string
          numero_legajo: string
          observaciones?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          motivo_cierre?: string | null
          nnya_id?: string
          numero_legajo?: string
          observaciones?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legajos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos: {
        Row: {
          created_at: string
          diagnostico_id: string | null
          dosis: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          frecuencia: string
          id: string
          legajo_id: string
          nnya_id: string
          nombre: string
          observaciones: string | null
          prescriptor: string | null
          updated_at: string
          via_administracion: string | null
        }
        Insert: {
          created_at?: string
          diagnostico_id?: string | null
          dosis: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia: string
          id?: string
          legajo_id: string
          nnya_id: string
          nombre: string
          observaciones?: string | null
          prescriptor?: string | null
          updated_at?: string
          via_administracion?: string | null
        }
        Update: {
          created_at?: string
          diagnostico_id?: string | null
          dosis?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia?: string
          id?: string
          legajo_id?: string
          nnya_id?: string
          nombre?: string
          observaciones?: string | null
          prescriptor?: string | null
          updated_at?: string
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamentos_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamentos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      nnya: {
        Row: {
          activo: boolean
          alertas_importantes: string | null
          apellido: string
          created_at: string
          dni: string
          domicilio: string | null
          email: string | null
          escolaridad: string | null
          estado_actual: string
          fecha_egreso: string | null
          fecha_nacimiento: string
          foto_url: string | null
          genero: string | null
          id: string
          lugar_nacimiento: string | null
          nacionalidad: string | null
          nombre: string
          numero_expediente: string | null
          obra_social: string | null
          telefono: string | null
          turno_escolar: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          alertas_importantes?: string | null
          apellido: string
          created_at?: string
          dni: string
          domicilio?: string | null
          email?: string | null
          escolaridad?: string | null
          estado_actual?: string
          fecha_egreso?: string | null
          fecha_nacimiento: string
          foto_url?: string | null
          genero?: string | null
          id?: string
          lugar_nacimiento?: string | null
          nacionalidad?: string | null
          nombre: string
          numero_expediente?: string | null
          obra_social?: string | null
          telefono?: string | null
          turno_escolar?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          alertas_importantes?: string | null
          apellido?: string
          created_at?: string
          dni?: string
          domicilio?: string | null
          email?: string | null
          escolaridad?: string | null
          estado_actual?: string
          fecha_egreso?: string | null
          fecha_nacimiento?: string
          foto_url?: string | null
          genero?: string | null
          id?: string
          lugar_nacimiento?: string | null
          nacionalidad?: string | null
          nombre?: string
          numero_expediente?: string | null
          obra_social?: string | null
          telefono?: string | null
          turno_escolar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nnya_tutores: {
        Row: {
          created_at: string
          es_principal: boolean
          id: string
          nnya_id: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          es_principal?: boolean
          id?: string
          nnya_id: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          es_principal?: boolean
          id?: string
          nnya_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nnya_tutores_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nnya_tutores_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      novedades: {
        Row: {
          created_at: string
          descripcion: string
          fecha_hora: string
          id: string
          nnya_id: string
          tipo: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          fecha_hora?: string
          id?: string
          nnya_id: string
          tipo: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          fecha_hora?: string
          id?: string
          nnya_id?: string
          tipo?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "novedades_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas_mejora: {
        Row: {
          area: string | null
          created_at: string
          descripcion: string
          estado: string
          evaluacion_id: string
          fecha_vencimiento: string | null
          id: string
          observaciones: string | null
          responsable_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          evaluacion_id: string
          fecha_vencimiento?: string | null
          id?: string
          observaciones?: string | null
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          evaluacion_id?: string
          fecha_vencimiento?: string | null
          id?: string
          observaciones?: string | null
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_mejora_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_mejora_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      referentes: {
        Row: {
          activo: boolean
          apellido: string
          created_at: string
          created_by: string
          dni: string
          domicilio: string | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          telefono: string | null
          tipo: string
          updated_at: string
          vinculo_descripcion: string | null
        }
        Insert: {
          activo?: boolean
          apellido: string
          created_at?: string
          created_by: string
          dni: string
          domicilio?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          tipo: string
          updated_at?: string
          vinculo_descripcion?: string | null
        }
        Update: {
          activo?: boolean
          apellido?: string
          created_at?: string
          created_by?: string
          dni?: string
          domicilio?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string
          vinculo_descripcion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referentes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      seguimiento_post_egreso: {
        Row: {
          contactado_por: string | null
          contacto_efectivo: boolean | null
          contacto_realizado: boolean
          created_at: string
          detalle_incumplimiento: string | null
          dias_post_egreso: number
          escolaridad: string | null
          fecha_contacto: string | null
          fecha_programada: string
          id: string
          indicador_reinsercion: number | null
          nnya_id: string
          observaciones: string | null
          percibe_auh: boolean | null
          requiere_intervencion: boolean
          salud: string | null
          terapias: string | null
          updated_at: string
          vinculo_id: string | null
        }
        Insert: {
          contactado_por?: string | null
          contacto_efectivo?: boolean | null
          contacto_realizado?: boolean
          created_at?: string
          detalle_incumplimiento?: string | null
          dias_post_egreso: number
          escolaridad?: string | null
          fecha_contacto?: string | null
          fecha_programada: string
          id?: string
          indicador_reinsercion?: number | null
          nnya_id: string
          observaciones?: string | null
          percibe_auh?: boolean | null
          requiere_intervencion?: boolean
          salud?: string | null
          terapias?: string | null
          updated_at?: string
          vinculo_id?: string | null
        }
        Update: {
          contactado_por?: string | null
          contacto_efectivo?: boolean | null
          contacto_realizado?: boolean
          created_at?: string
          detalle_incumplimiento?: string | null
          dias_post_egreso?: number
          escolaridad?: string | null
          fecha_contacto?: string | null
          fecha_programada?: string
          id?: string
          indicador_reinsercion?: number | null
          nnya_id?: string
          observaciones?: string | null
          percibe_auh?: boolean | null
          requiere_intervencion?: boolean
          salud?: string | null
          terapias?: string | null
          updated_at?: string
          vinculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_post_egreso_contactado_por_fkey"
            columns: ["contactado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_post_egreso_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_post_egreso_vinculo_id_fkey"
            columns: ["vinculo_id"]
            isOneToOne: false
            referencedRelation: "vinculos_tutela"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencia_auh: {
        Row: {
          created_at: string
          created_by: string
          estado: string
          fecha_efectiva: string | null
          fecha_gestion: string | null
          id: string
          nnya_id: string
          observaciones: string | null
          organismo: string | null
          updated_at: string
          vinculo_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          estado?: string
          fecha_efectiva?: string | null
          fecha_gestion?: string | null
          id?: string
          nnya_id: string
          observaciones?: string | null
          organismo?: string | null
          updated_at?: string
          vinculo_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          estado?: string
          fecha_efectiva?: string | null
          fecha_gestion?: string | null
          id?: string
          nnya_id?: string
          observaciones?: string | null
          organismo?: string | null
          updated_at?: string
          vinculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transferencia_auh_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencia_auh_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencia_auh_vinculo_id_fkey"
            columns: ["vinculo_id"]
            isOneToOne: false
            referencedRelation: "vinculos_tutela"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          fecha_hora: string
          id: string
          legajo_id: string
          lugar: string | null
          motivo: string | null
          nnya_id: string
          observaciones: string | null
          profesional: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_hora: string
          id?: string
          legajo_id: string
          lugar?: string | null
          motivo?: string | null
          nnya_id: string
          observaciones?: string | null
          profesional?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_hora?: string
          id?: string
          legajo_id?: string
          lugar?: string | null
          motivo?: string | null
          nnya_id?: string
          observaciones?: string | null
          profesional?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_legajo_id_fkey"
            columns: ["legajo_id"]
            isOneToOne: false
            referencedRelation: "legajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_personal: {
        Row: {
          created_at: string
          entregado_at: string | null
          entregado_por: string | null
          estado: string
          fecha: string
          hora_cierre: string | null
          hora_inicio: string | null
          id: string
          novedades_traspaso: string | null
          recibido_at: string | null
          recibido_por: string | null
          turno: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          entregado_at?: string | null
          entregado_por?: string | null
          estado?: string
          fecha: string
          hora_cierre?: string | null
          hora_inicio?: string | null
          id?: string
          novedades_traspaso?: string | null
          recibido_at?: string | null
          recibido_por?: string | null
          turno: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          entregado_at?: string | null
          entregado_por?: string | null
          estado?: string
          fecha?: string
          hora_cierre?: string | null
          hora_inicio?: string | null
          id?: string
          novedades_traspaso?: string | null
          recibido_at?: string | null
          recibido_por?: string | null
          turno?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_personal_entregado_por_fkey"
            columns: ["entregado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_personal_recibido_por_fkey"
            columns: ["recibido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_personal_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tutores: {
        Row: {
          activo: boolean
          apellido: string
          created_at: string
          dni: string
          domicilio: string | null
          email: string | null
          id: string
          nombre: string
          ocupacion: string | null
          parentesco: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          created_at?: string
          dni: string
          domicilio?: string | null
          email?: string | null
          id?: string
          nombre: string
          ocupacion?: string | null
          parentesco: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          created_at?: string
          dni?: string
          domicilio?: string | null
          email?: string | null
          id?: string
          nombre?: string
          ocupacion?: string | null
          parentesco?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          apellido: string
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          rol_id: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          nombre: string
          rol_id: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol_id?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      validaciones_renaper: {
        Row: {
          consultado_at: string
          consultado_por: string
          dni_consultado: string
          estado_dni: string
          id: string
          momento: string
          referente_id: string
          respuesta_cruda: Json | null
          resultado: string
          tiene_antecedentes: boolean | null
        }
        Insert: {
          consultado_at?: string
          consultado_por: string
          dni_consultado: string
          estado_dni: string
          id?: string
          momento: string
          referente_id: string
          respuesta_cruda?: Json | null
          resultado: string
          tiene_antecedentes?: boolean | null
        }
        Update: {
          consultado_at?: string
          consultado_por?: string
          dni_consultado?: string
          estado_dni?: string
          id?: string
          momento?: string
          referente_id?: string
          respuesta_cruda?: Json | null
          resultado?: string
          tiene_antecedentes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "validaciones_renaper_consultado_por_fkey"
            columns: ["consultado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_renaper_referente_id_fkey"
            columns: ["referente_id"]
            isOneToOne: false
            referencedRelation: "referentes"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculos_tutela: {
        Row: {
          created_at: string
          created_by: string
          estado: string
          id: string
          motivo_finalizacion: string | null
          nnya_id: string
          observaciones: string | null
          referente_id: string | null
          resolucion_respaldo: string | null
          tipo: string
          updated_at: string
          usuario_id: string | null
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          estado?: string
          id?: string
          motivo_finalizacion?: string | null
          nnya_id: string
          observaciones?: string | null
          referente_id?: string | null
          resolucion_respaldo?: string | null
          tipo: string
          updated_at?: string
          usuario_id?: string | null
          vigente_desde: string
          vigente_hasta?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          estado?: string
          id?: string
          motivo_finalizacion?: string | null
          nnya_id?: string
          observaciones?: string | null
          referente_id?: string | null
          resolucion_respaldo?: string | null
          tipo?: string
          updated_at?: string
          usuario_id?: string | null
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_tutela_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_tutela_nnya_id_fkey"
            columns: ["nnya_id"]
            isOneToOne: false
            referencedRelation: "nnya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_tutela_referente_id_fkey"
            columns: ["referente_id"]
            isOneToOne: false
            referencedRelation: "referentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_tutela_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
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
