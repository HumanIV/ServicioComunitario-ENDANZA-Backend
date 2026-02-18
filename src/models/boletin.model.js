// Archivo: backend/models/boletin.model.js

import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE BOLETINES - CON CAMPOS REALES
//============================================

// Inicializar tabla si no existe
const initTable = async () => {
  try {
    await db.query(`
            CREATE TABLE IF NOT EXISTS "Boletin_Estudiante" (
                "id" SERIAL PRIMARY KEY,
                "student_id" INTEGER NOT NULL,
                "academic_year_id" INTEGER NOT NULL,
                "is_available" BOOLEAN DEFAULT TRUE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "downloads" INTEGER DEFAULT 0,
                UNIQUE("student_id", "academic_year_id")
            );
        `);
  } catch (error) {
    console.error("Error inicializando tabla Boletin_Estudiante:", error);
  }
};

// Ejecutar inicialización
initTable();

const findByYearId = async (academicYearId) => {
  try {
    // Retorna conteo o resumen por ahora, ya que el boletín es por estudiante
    const query = {
      text: `
        SELECT 
           be."id",
           e."nombre" || ' ' || e."apellido" as estudiante,
           be."is_available",
           be."downloads",
           be."created_at"
        FROM "Boletin_Estudiante" be
        JOIN "Estudiante" e ON be."student_id" = e."Id_estudiante"
        WHERE be."academic_year_id" = $1
      `,
      values: [academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findByYearId:", error);
    return [];
  }
};

const generarBoletin = async (studentId, academicYearId, gradeId) => {
  try {
    // VALIDACIÓN: Verificar que el estudiante tenga TODAS sus notas cargadas (filtrando por grado si aplica)
    const validacionQuery = {
      text: `
        -- Obtener todas las estructuras de evaluación de las secciones del estudiante
        WITH estructuras_estudiante AS (
          SELECT DISTINCT ee."Id_estructura_evaluacion"
          FROM "Estudiante_Seccion" es
          JOIN "Seccion" s ON es."Id_seccion" = s."Id_seccion"
          JOIN "Estructura_Evaluacion" ee ON ee."Id_seccion" = s."Id_seccion"
          LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
          LEFT JOIN "Grado" g ON m."ano_materia" = g."Id_grado"
          WHERE es."Id_estudiante" = $1
            AND s."Id_ano" = $2
            AND ($3::int IS NULL OR g."Id_grado" = $3::int)
        ),
        -- Contar cuántas notas tiene el estudiante
        notas_estudiante AS (
          SELECT COUNT(*) as notas_cargadas
          FROM "Carga_Nota" cn
          WHERE cn."Id_estudiante" = $1
            AND cn."Id_estructura_evaluacion" IN (SELECT "Id_estructura_evaluacion" FROM estructuras_estudiante)
        )
        -- Comparar: ¿Tiene todas las notas?
        SELECT 
          (SELECT COUNT(*) FROM estructuras_estudiante) as total_evaluaciones,
          (SELECT notas_cargadas FROM notas_estudiante) as notas_cargadas,
          CASE 
            WHEN (SELECT COUNT(*) FROM estructuras_estudiante) = 0 THEN false
            WHEN (SELECT notas_cargadas FROM notas_estudiante) >= (SELECT COUNT(*) FROM estructuras_estudiante) THEN true
            ELSE false
          END as tiene_todas_notas
      `,
      values: [studentId, academicYearId, gradeId]
    };

    const validacion = await db.query(validacionQuery.text, validacionQuery.values);
    const { total_evaluaciones, notas_cargadas, tiene_todas_notas } = validacion.rows[0];

    // Si no tiene todas las notas, lanzar error
    if (!tiene_todas_notas) {
      throw new Error(
        `El estudiante no tiene todas sus notas cargadas${gradeId ? ' para este grado' : ''}. ` +
        `Notas cargadas: ${notas_cargadas}/${total_evaluaciones}. ` +
        `Complete todas las evaluaciones antes de generar el boletín.`
      );
    }

    // Si tiene todas las notas, proceder a generar/actualizar el boletín
    const query = {
      text: `
                INSERT INTO "Boletin_Estudiante" ("student_id", "academic_year_id", "is_available")
                VALUES ($1, $2, true)
                ON CONFLICT ("student_id", "academic_year_id") 
                DO UPDATE SET "is_available" = true, "updated_at" = CURRENT_TIMESTAMP
                RETURNING "id"
            `,
      values: [studentId, academicYearId] // No guardamos gradeId en la tabla por ahora, es validación lógica
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en generarBoletin:", error);
    throw error;
  }
};

const verificarDisponibilidad = async (studentId, academicYearId) => {
  try {
    const query = {
      text: `SELECT "is_available" FROM "Boletin_Estudiante" WHERE "student_id" = $1 AND "academic_year_id" = $2`,
      values: [studentId, academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows.length > 0 && rows[0].is_available;
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return false;
  }
};

const incrementarDescarga = async (boletinId) => {
  try {
    // Si boletinId es el ID de la tabla Boletin_Estudiante
    const query = {
      text: `
        UPDATE "Boletin_Estudiante"
        SET "downloads" = COALESCE("downloads", 0) + 1
        WHERE "id" = $1
        RETURNING "downloads"
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

const toggleDisponible = async (id, disponible) => {
  // Implementación para compatibilidad si se usa ID directo
  try {
    const query = {
      text: `
        UPDATE "Boletin_Estudiante"
        SET "is_available" = $1
        WHERE "id" = $2
        RETURNING "id", "is_available"
      `,
      values: [disponible, id]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en toggleDisponible:", error);
    throw error;
  }
}


const habilitarTodos = async (academicYearId) => {
  // Esto es más complejo ahora porque depende de qué estudiantes existen.
  // Por simplicidad, habilitamos los que ya existen en la tabla.
  try {
    const query = {
      text: `
        UPDATE "Boletin_Estudiante"
        SET "is_available" = true
        WHERE "academic_year_id" = $1
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
}

export const BoletinModel = {
  findByYearId,
  generarBoletin,
  verificarDisponibilidad,
  incrementarDescarga,
  toggleDisponible,
  habilitarTodos
};