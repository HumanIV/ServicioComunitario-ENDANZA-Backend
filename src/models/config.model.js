// Archivo: backend/models/config.model.js

import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE CONFIGURACIÓN - Años Académicos y Periodos
// ============================================

// ============================================
// AÑOS ACADÉMICOS
// ============================================

const findAllAcademicYears = async () => {
  try {
    const query = {
      text: `
        SELECT 
          "Id_ano" as id,
          "nombre_ano" as name,
          "estatus_ano" as status,
          "inicio_ano" as start_date,
          "fin_ano" as end_date,
          "activo" as active
        FROM public."Ano_Academico"
        ORDER BY "nombre_ano" DESC
      `,
    };
    const { rows } = await db.query(query.text);
    return rows;
  } catch (error) {
    console.error("Error en findAllAcademicYears:", error);
    throw error;
  }
};

const findActiveAcademicYear = async () => {
  try {
    const query = {
      text: `
        SELECT 
          "Id_ano" as id,
          "nombre_ano" as name
        FROM public."Ano_Academico"
        WHERE "activo" = true
        LIMIT 1
      `,
    };
    const { rows } = await db.query(query.text);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en findActiveAcademicYear:", error);
    throw error;
  }
};

const createAcademicYear = async (name, startDate, endDate) => {
  try {
    // Iniciamos una transacción manual
    await db.query('BEGIN');

    try {
      // 1. Desactivar el año actual
      await db.query(`
        UPDATE public."Ano_Academico" 
        SET "activo" = false 
        WHERE "activo" = true
      `);

      // 2. Crear el nuevo año
      const insertQuery = {
        text: `
          INSERT INTO public."Ano_Academico" 
            ("nombre_ano", "estatus_ano", "inicio_ano", "fin_ano", "activo")
          VALUES ($1, 'Activo', $2, $3, true)
          RETURNING 
            "Id_ano" as id,
            "nombre_ano" as name
        `,
        values: [name, startDate, endDate],
      };

      const { rows } = await db.query(insertQuery.text, insertQuery.values);
      const newYear = rows[0];

      // 3. Crear registros por defecto para las configuraciones
      // Período de inscripción (por defecto con las mismas fechas, inactivo)
      await db.query(
        `INSERT INTO public."Periodo_Inscripcion" 
          ("Id_ano", "fecha_inicio", "fecha_fin", "activo", "creado_en", "actualizado_en")
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [newYear.id, startDate, endDate]
      );

      // Período de subida de notas (por defecto con las mismas fechas, inactivo)
      await db.query(
        `INSERT INTO public."Periodo_Subida_Notas" 
          ("Id_ano", "fecha_inicio", "fecha_fin", "activo", "creado_en", "actualizado_en")
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [newYear.id, startDate, endDate]
      );

      await db.query('COMMIT');
      return newYear;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Error en createAcademicYear:", error);
    throw error;
  }
};

// ============================================
// PERÍODO DE INSCRIPCIÓN
// ============================================

const findEnrollmentPeriodByYearId = async (yearId) => {
  try {
    const query = {
      text: `
        SELECT 
          "fecha_inicio" as "fechaInicio",
          "fecha_fin" as "fechaFin",
          "activo"
        FROM public."Periodo_Inscripcion"
        WHERE "Id_ano" = $1
      `,
      values: [yearId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en findEnrollmentPeriodByYearId:", error);
    throw error;
  }
};

const updateEnrollmentPeriod = async (yearId, { fechaInicio, fechaFin, activo }) => {
  try {
    // Verificar si existe el registro
    const checkQuery = {
      text: `SELECT "Id_periodo_inscripcion" FROM public."Periodo_Inscripcion" WHERE "Id_ano" = $1`,
      values: [yearId]
    };
    const checkResult = await db.query(checkQuery.text, checkQuery.values);

    if (checkResult.rows.length === 0) {
      // Si no existe, insertar
      const insertQuery = {
        text: `
          INSERT INTO public."Periodo_Inscripcion" 
            ("Id_ano", "fecha_inicio", "fecha_fin", "activo", "creado_en", "actualizado_en")
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING 
            "fecha_inicio" as "fechaInicio",
            "fecha_fin" as "fechaFin",
            "activo"
        `,
        values: [yearId, fechaInicio, fechaFin, activo],
      };
      const { rows } = await db.query(insertQuery.text, insertQuery.values);
      return rows[0];
    } else {
      // Si existe, actualizar
      const updateQuery = {
        text: `
          UPDATE public."Periodo_Inscripcion"
          SET 
            "fecha_inicio" = $1,
            "fecha_fin" = $2,
            "activo" = $3,
            "actualizado_en" = CURRENT_TIMESTAMP
          WHERE "Id_ano" = $4
          RETURNING 
            "fecha_inicio" as "fechaInicio",
            "fecha_fin" as "fechaFin",
            "activo"
        `,
        values: [fechaInicio, fechaFin, activo, yearId],
      };
      const { rows } = await db.query(updateQuery.text, updateQuery.values);
      return rows[0];
    }
  } catch (error) {
    console.error("Error en updateEnrollmentPeriod:", error);
    throw error;
  }
};

// ============================================
// LAPSOS
// ============================================

const findLapsosByYearId = async (yearId) => {
  try {
    const query = {
      text: `
        SELECT 
          "Id_lapso" as id,
          "nombre_lapso" as name,
          "inicio_lapso" as start_date,
          "fin_lapso" as end_date
        FROM public."Lapso"
        WHERE "Id_ano" = $1
        ORDER BY "Id_lapso"
      `,
      values: [yearId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findLapsosByYearId:", error);
    throw error;
  }
};

// ============================================
// PERÍODO DE SUBIDA DE NOTAS
// ============================================

const findGradesPeriodByYearId = async (yearId) => {
  try {
    const query = {
      text: `
        SELECT 
          "fecha_inicio" as "fechaInicio",
          "fecha_fin" as "fechaFin",
          "activo"
        FROM public."Periodo_Subida_Notas"
        WHERE "Id_ano" = $1
      `,
      values: [yearId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en findGradesPeriodByYearId:", error);
    throw error;
  }
};

const updateGradesPeriod = async (yearId, { fechaInicio, fechaFin, activo }) => {
  try {
    // Verificar si existe el registro
    const checkQuery = {
      text: `SELECT "Id_periodo_notas" FROM public."Periodo_Subida_Notas" WHERE "Id_ano" = $1`,
      values: [yearId]
    };
    const checkResult = await db.query(checkQuery.text, checkQuery.values);

    if (checkResult.rows.length === 0) {
      // Si no existe, insertar
      const insertQuery = {
        text: `
          INSERT INTO public."Periodo_Subida_Notas" 
            ("Id_ano", "fecha_inicio", "fecha_fin", "activo", "creado_en", "actualizado_en")
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING 
            "fecha_inicio" as "fechaInicio",
            "fecha_fin" as "fechaFin",
            "activo"
        `,
        values: [yearId, fechaInicio, fechaFin, activo],
      };
      const { rows } = await db.query(insertQuery.text, insertQuery.values);
      return rows[0];
    } else {
      // Si existe, actualizar
      const updateQuery = {
        text: `
          UPDATE public."Periodo_Subida_Notas"
          SET 
            "fecha_inicio" = $1,
            "fecha_fin" = $2,
            "activo" = $3,
            "actualizado_en" = CURRENT_TIMESTAMP
          WHERE "Id_ano" = $4
          RETURNING 
            "fecha_inicio" as "fechaInicio",
            "fecha_fin" as "fechaFin",
            "activo"
        `,
        values: [fechaInicio, fechaFin, activo, yearId],
      };
      const { rows } = await db.query(updateQuery.text, updateQuery.values);
      return rows[0];
    }
  } catch (error) {
    console.error("Error en updateGradesPeriod:", error);
    throw error;
  }
};

// ============================================
// EXPORTAR MODELO
// ============================================
export const ConfigModel = {
  // Años académicos
  findAllAcademicYears,
  findActiveAcademicYear,
  createAcademicYear,

  // Período de inscripción
  findEnrollmentPeriodByYearId,
  updateEnrollmentPeriod,

  // Lapsos
  findLapsosByYearId,

  // Período de subida de notas
  findGradesPeriodByYearId,
  updateGradesPeriod,
};