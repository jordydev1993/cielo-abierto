-- ============================================================
-- Storage: bucket privado para documentos adjuntos de legajos
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  FALSE,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el bucket documentos
CREATE POLICY "documentos_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "documentos_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "documentos_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documentos');
