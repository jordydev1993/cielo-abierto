-- incidentes.legajo_id: ON DELETE CASCADE -> RESTRICT
-- Borrar un legajo no debe borrar sus incidentes: se perdería la trazabilidad
-- (mismo criterio que prompts/025 para nnya_id). Ningún hook del código borra
-- legajos en duro, así que no cambia el comportamiento actual.

ALTER TABLE public.incidentes DROP CONSTRAINT incidentes_legajo_id_fkey;

ALTER TABLE public.incidentes
  ADD CONSTRAINT incidentes_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;
