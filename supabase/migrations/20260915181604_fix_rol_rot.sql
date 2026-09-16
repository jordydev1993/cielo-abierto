-- Fix rol rot: borra usuarios de prueba sin auth_user_id y los roles legacy que
-- nunca fueron consolidados a Admin/Equipo Tecnico (issue #3, prompts/017).
-- Mismo patrón que 20260522000027_remove_educador_role.sql pero por borrado en vez
-- de reasignación: confirmado con Jordy que los 6 usuarios legacy son datos de prueba.
DELETE FROM usuarios WHERE auth_user_id IS NULL;
DELETE FROM roles WHERE nombre NOT IN ('Admin', 'Equipo Tecnico');
