// Archivo: backend/models/nota.model.js

import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE NOTAS - CORREGIDO PARA TU BD
// ============================================

const findPendientesByYearId = async (academicYearId) => {
  try {
    const query = {
      text: `
        SELECT 
          cn."Id_nota" as id,
          u."nombre" || ' ' || u."apellido" as profesor,
          m."nombre_materia" as curso,
          COUNT(DISTINCT cn."Id_estudiante") as estudiantes,
          'pendiente' as estado
        FROM "Carga_Nota" cn
        JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
        JOIN "Seccion" s ON ee."Id_seccion" = s."Id_seccion"
        JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
        JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        -- Relación con profesor a través de Horario
        JOIN "Horario" h ON s."Id_seccion" = h."Id_seccion"
        JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
        JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
        WHERE l."Id_ano" = $1
          AND cn."esta_formalizada" = false
        GROUP BY cn."Id_nota", u."nombre", u."apellido", m."nombre_materia"
        ORDER BY cn."Id_nota" DESC
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findPendientesByYearId:", error);
    throw error;
  }
};

const aprobar = async (notaId) => {
  try {
    const query = {
      text: `
        UPDATE "Carga_Nota"
        SET "esta_formalizada" = true
        WHERE "Id_nota" = $1
        RETURNING "Id_nota" as id
      `,
      values: [notaId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en aprobar nota:", error);
    throw error;
  }
};

const rechazar = async (notaId) => {
  try {
    const query = {
      text: `
        DELETE FROM "Carga_Nota"
        WHERE "Id_nota" = $1
        RETURNING "Id_nota" as id
      `,
      values: [notaId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en rechazar nota:", error);
    throw error;
  }
};

const aprobarTodas = async (academicYearId) => {
  try {
    const query = {
      text: `
        UPDATE "Carga_Nota"
        SET "esta_formalizada" = true
        WHERE "Id_estructura_evaluacion" IN (
          SELECT ee."Id_estructura_evaluacion"
          FROM "Estructura_Evaluacion" ee
          JOIN "Seccion" s ON ee."Id_seccion" = s."Id_seccion"
          JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
          WHERE l."Id_ano" = $1
        )
        RETURNING COUNT(*) as actualizadas
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en aprobarTodas:", error);
    throw error;
  }
};

const verificarPendientes = async (academicYearId) => {
  try {
    const query = {
      text: `
        SELECT COUNT(*) as pendientes
        FROM "Carga_Nota" cn
        JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
        JOIN "Seccion" s ON ee."Id_seccion" = s."Id_seccion"
        JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        WHERE l."Id_ano" = $1
          AND cn."esta_formalizada" = false
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return { hayPendientes: parseInt(rows[0].pendientes) > 0 };
  } catch (error) {
    console.error("Error en verificarPendientes:", error);
    throw error;
  }
};

export const NotaModel = {
  findPendientesByYearId,
  aprobar,
  rechazar,
  aprobarTodas,
  verificarPendientes
};