-- prompts/036: ON DELETE CASCADE -> RESTRICT en las FKs que borraban historia del caso.
-- Borrar un legajo no debe llevarse sus turnos, diagnósticos, medicamentos, informes,
-- documentos ni audiencias (mismo criterio que prompts/025 y que incidentes.legajo_id en
-- 20261003193718). Tampoco borrar un referente debe llevarse su evidencia RENAPER, ni
-- borrar un tutor debe llevarse sus vínculos con NNyA. Ningún hook borra legajos ni
-- referentes. Sí existe useDeleteTutor: un tutor con NNyA asignados ya no se puede eliminar
-- (antes se borraban sus vínculos en silencio); la pantalla de Tutores muestra el motivo.

-- legajo_id (6 tablas)
ALTER TABLE public.turnos DROP CONSTRAINT turnos_legajo_id_fkey;
ALTER TABLE public.turnos
  ADD CONSTRAINT turnos_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

ALTER TABLE public.diagnosticos DROP CONSTRAINT diagnosticos_legajo_id_fkey;
ALTER TABLE public.diagnosticos
  ADD CONSTRAINT diagnosticos_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

ALTER TABLE public.medicamentos DROP CONSTRAINT medicamentos_legajo_id_fkey;
ALTER TABLE public.medicamentos
  ADD CONSTRAINT medicamentos_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

ALTER TABLE public.informes DROP CONSTRAINT informes_legajo_id_fkey;
ALTER TABLE public.informes
  ADD CONSTRAINT informes_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

ALTER TABLE public.documentos DROP CONSTRAINT documentos_legajo_id_fkey;
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

ALTER TABLE public.audiencias_judiciales DROP CONSTRAINT audiencias_judiciales_legajo_id_fkey;
ALTER TABLE public.audiencias_judiciales
  ADD CONSTRAINT audiencias_judiciales_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;

-- validaciones_renaper.referente_id: la evidencia RENAPER no se borra con el referente
ALTER TABLE public.validaciones_renaper DROP CONSTRAINT validaciones_renaper_referente_id_fkey;
ALTER TABLE public.validaciones_renaper
  ADD CONSTRAINT validaciones_renaper_referente_id_fkey
  FOREIGN KEY (referente_id) REFERENCES public.referentes(id) ON DELETE RESTRICT;

-- nnya_tutores.tutor_id: el vínculo tutor–NNyA no se borra con el tutor
ALTER TABLE public.nnya_tutores DROP CONSTRAINT nnya_tutores_tutor_id_fkey;
ALTER TABLE public.nnya_tutores
  ADD CONSTRAINT nnya_tutores_tutor_id_fkey
  FOREIGN KEY (tutor_id) REFERENCES public.tutores(id) ON DELETE RESTRICT;
