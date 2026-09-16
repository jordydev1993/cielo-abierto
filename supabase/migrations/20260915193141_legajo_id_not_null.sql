-- legajo_id debía ser NOT NULL: todo formulario de alta de estas 7 entidades ya exige
-- seleccionar un legajo (issue #8/prompts/020 encontró el desvío entre el schema real,
-- nullable, y el tipo de dominio, que ya lo declaraba requerido). Verificado 0 filas con
-- legajo_id NULL en las 7 tablas antes de aplicar.
ALTER TABLE turnos                 ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE incidentes             ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE diagnosticos           ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE medicamentos           ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE informes               ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE documentos             ALTER COLUMN legajo_id SET NOT NULL;
ALTER TABLE audiencias_judiciales  ALTER COLUMN legajo_id SET NOT NULL;
