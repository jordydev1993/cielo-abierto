-- Issue #16 (hallazgo del review de mobile#18): nnya_id tenía ON DELETE CASCADE en 14
-- tablas de negocio, con riesgo de pérdida de auditoría si algún día se borrara
-- físicamente un NNyA. Cambiado a RESTRICT (mismo patrón que ya tenía legajos.nnya_id):
-- no se pierde nada, solo bloquea el borrado si hay historial. SET NULL no es viable
-- (nnya_id es NOT NULL en las 14 tablas) y además destruiría el rastro de auditoría que
-- esto busca proteger. No se dispara en la práctica: el proyecto nunca borra un nnya en
-- duro, siempre marca activo=false / estado_actual.

ALTER TABLE alertas                          DROP CONSTRAINT alertas_nnya_id_fkey,
  ADD CONSTRAINT alertas_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE audiencias_judiciales             DROP CONSTRAINT audiencias_judiciales_nnya_id_fkey,
  ADD CONSTRAINT audiencias_judiciales_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE diagnosticos                      DROP CONSTRAINT diagnosticos_nnya_id_fkey,
  ADD CONSTRAINT diagnosticos_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE documentos                        DROP CONSTRAINT documentos_nnya_id_fkey,
  ADD CONSTRAINT documentos_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE evaluacion_institucional_casos    DROP CONSTRAINT evaluacion_institucional_casos_nnya_id_fkey,
  ADD CONSTRAINT evaluacion_institucional_casos_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE incidentes                        DROP CONSTRAINT incidentes_nnya_id_fkey,
  ADD CONSTRAINT incidentes_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE informes                          DROP CONSTRAINT informes_nnya_id_fkey,
  ADD CONSTRAINT informes_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE intervenciones                    DROP CONSTRAINT intervenciones_nnya_id_fkey,
  ADD CONSTRAINT intervenciones_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE medicamentos                      DROP CONSTRAINT medicamentos_nnya_id_fkey,
  ADD CONSTRAINT medicamentos_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE nnya_tutores                      DROP CONSTRAINT nnya_tutores_nnya_id_fkey,
  ADD CONSTRAINT nnya_tutores_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE novedades                         DROP CONSTRAINT novedades_nnya_id_fkey,
  ADD CONSTRAINT novedades_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE seguimiento_post_egreso           DROP CONSTRAINT seguimiento_post_egreso_nnya_id_fkey,
  ADD CONSTRAINT seguimiento_post_egreso_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE transferencia_auh                 DROP CONSTRAINT transferencia_auh_nnya_id_fkey,
  ADD CONSTRAINT transferencia_auh_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE turnos                            DROP CONSTRAINT turnos_nnya_id_fkey,
  ADD CONSTRAINT turnos_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;

ALTER TABLE vinculos_tutela                   DROP CONSTRAINT vinculos_tutela_nnya_id_fkey,
  ADD CONSTRAINT vinculos_tutela_nnya_id_fkey FOREIGN KEY (nnya_id) REFERENCES nnya(id) ON DELETE RESTRICT;
