// Archivo: backend/models/boletin.model.js

import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE BOLETINES - CON CAMPOS REALES
// ============================================

const findByYearId = async (academicYearId) => {
  try {
    const query = {
      text: `
        SELECT 
          b."Id_boleta" as id,
          l."nombre_lapso" as periodo,
          m."nombre_materia" as curso,
          COALESCE(b."descargas", 0) as descargas,
          COALESCE(b."disponible", false) as disponible
        FROM "Boleta_Notas" b
        JOIN "Lapso" l ON b."Id_lapso" = l."Id_lapso"
        JOIN "Materia" m ON b."Id_materia" = m."Id_materia"
        WHERE l."Id_ano" = $1
        ORDER BY l."nombre_lapso", m."nombre_materia"
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findByYearId:", error);
    throw error;
  }
};

const toggleDisponible = async (boletinId, disponible) => {
  try {
    const query = {
      text: `
        UPDATE "Boleta_Notas"
        SET "disponible" = $1,
            "descargas" = COALESCE("descargas", 0)
        WHERE "Id_boleta" = $2
        RETURNING 
          "Id_boleta" as id, 
          "disponible"
      `,
      values: [disponible, boletinId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en toggleDisponible:", error);
    throw error;
  }
};

const habilitarTodos = async (academicYearId) => {
  try {
    const query = {
      text: `
        UPDATE "Boleta_Notas"
        SET "disponible" = true
        WHERE "Id_lapso" IN (
          SELECT "Id_lapso" FROM "Lapso" WHERE "Id_ano" = $1
        )
        RETURNING COUNT(*) as actualizados
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en habilitarTodos:", error);
    throw error;
  }
};

/**
 * Incrementa el contador de descargas de un boletín
 * @param {number} boletinId - ID del boletín
 * @returns {Promise<Object>}
 */
const incrementarDescarga = async (boletinId) => {
  try {
    const query = {
      text: `
        UPDATE "Boleta_Notas"
        SET "descargas" = COALESCE("descargas", 0) + 1
        WHERE "Id_boleta" = $1
        RETURNING "descargas"
      `,
      values: [boletinId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en incrementarDescarga:", error);
    throw error;
  }
};

export const BoletinModel = {
  findByYearId,
  toggleDisponible,
  habilitarTodos,
  incrementarDescarga
};