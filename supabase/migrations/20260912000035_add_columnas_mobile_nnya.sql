-- FASE mobile: columnas de nnya que necesita la app mobile (F1), consecuencia de la
-- decisión #2 de mobile/docs/04-backend/modelo-de-datos/CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md
-- (mobile reusa nnya, no crea una tabla `residentes` propia).
-- Ver prompts/014-nnya-columnas-mobile.md para el análisis completo.

ALTER TABLE nnya
  ADD COLUMN foto_url TEXT NULL,
  ADD COLUMN alertas_importantes TEXT NULL,
  ADD COLUMN turno_escolar VARCHAR(50) NULL;

ALTER TABLE nnya ADD CONSTRAINT nnya_turno_escolar_check
  CHECK (turno_escolar IS NULL OR turno_escolar IN ('Mañana', 'Tarde', 'Noche', 'Doble Jornada'));
