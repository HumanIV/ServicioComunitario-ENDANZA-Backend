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

// ============================================
// FUNCIONES PARA DOCENTE
// ============================================

const findTeacherAllocations = async (teacherUserId, academicYearId) => {
  try {
    const query = {
      text: `
        SELECT 
          s."Id_seccion" as id,
          g."nombre_grado" || ' ' || s."nombre_seccion" as section_name,
          m."nombre_materia" as subject,
          m."Id_materia" as subject_id,
          l."nombre_lapso" as lapse,
          l."Id_lapso" as lapse_id,
          a."nombre_ano" as academic_year,
          count(es."Id_estudiante") as student_count
        FROM "Profesor" p
        JOIN "Horario" h ON p."Id_profesor" = h."Id_profesor"
        JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
        JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
        JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        JOIN "Ano_Academico" a ON l."Id_ano" = a."Id_ano"
        LEFT JOIN "Estudiante_Seccion" es ON s."Id_seccion" = es."Id_seccion"
        JOIN "Grado" g ON m."ano_materia" = g."Id_grado"
        WHERE p."Id_usuario" = $1 
          AND ($2::int IS NULL OR a."Id_ano" = $2::int)
        GROUP BY s."Id_seccion", g."nombre_grado", s."nombre_seccion", m."nombre_materia", m."Id_materia", l."nombre_lapso", l."Id_lapso", a."nombre_ano"
        ORDER BY l."Id_lapso", m."nombre_materia"
      `,
      values: [teacherUserId, academicYearId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findTeacherAllocations:", error);
    throw error;
  }
};

const saveCompetenciaNota = async (studentId, competenceId, score, observation, evaluationStructureId) => {
  try {
    await db.query('BEGIN');

    // 1. Verificar o crear la Carga_Nota padre (Nota del lapso/evaluación general)
    let noteId;
    const noteCheck = await db.query(
      `SELECT "Id_nota" FROM "Carga_Nota" 
             WHERE "Id_estudiante" = $1 AND "Id_estructura_evaluacion" = $2`,
      [studentId, evaluationStructureId]
    );

    if (noteCheck.rows.length > 0) {
      noteId = noteCheck.rows[0].Id_nota;
    } else {
      // Crear nueva nota padre
      const newNote = await db.query(
        `INSERT INTO "Carga_Nota" ("Id_estudiante", "Id_estructura_evaluacion", "puntaje", "esta_formalizada")
                 VALUES ($1, $2, 0, false) RETURNING "Id_nota"`,
        [studentId, evaluationStructureId]
      );
      noteId = newNote.rows[0].Id_nota;
    }

    // 2. Upsert (Insertar o Actualizar) la nota de la competencia
    // Verificar si ya existe calificación para esta competencia en esta nota
    const compCheck = await db.query(
      `SELECT "Id_estudiante_competencia" FROM "Nota_Competencia_Estudiante"
             WHERE "Id_nota" = $1 AND "Id_competencia" = $2`,
      [noteId, competenceId]
    );

    if (compCheck.rows.length > 0) {
      // Actualizar existente
      await db.query(
        `UPDATE "Nota_Competencia_Estudiante"
                 SET "puntaje" = $1, "observacion" = $2
                 WHERE "Id_estudiante_competencia" = $3`,
        [score, observation, compCheck.rows[0].Id_estudiante_competencia]
      );
    } else {
      // Insertar nueva
      await db.query(
        `INSERT INTO "Nota_Competencia_Estudiante" ("Id_nota", "Id_competencia", "puntaje", "observacion")
                 VALUES ($1, $2, $3, $4)`,
        [noteId, competenceId, score, observation]
      );
    }

    await db.query('COMMIT');
    return { success: true, noteId };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error saving competence grade:", error);
    throw error;
  }
};


const getSectionStudents = async (sectionId) => {
  try {
    const query = {
      text: `
                SELECT 
                    e."Id_estudiante" as id,
                    e."nombre" as first_name,
                    e."apellido" as last_name,
                    e."cedula" as dni,
                    e."foto_usuario" as photo
                FROM "Estudiante_Seccion" es
                JOIN "Estudiante" e ON es."Id_estudiante" = e."Id_estudiante"
                WHERE es."Id_seccion" = $1
                ORDER BY e."apellido", e."nombre"
            `,
      values: [sectionId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en getSectionStudents:", error);
    throw error;
  }
};


const saveGradesBatch = async (sectionId, gradesData) => {
  try {
    await db.query('BEGIN');

    // 1. Obtener estructuras de evaluación de la sección
    // Asumimos que "numero_evaluacion" indica 1, 2, 3, 4 coincidendo con n1, n2, n3, n4
    const structures = await db.query(
      `SELECT "Id_estructura_evaluacion" as id, "numero_evaluacion" as num 
             FROM "Estructura_Evaluacion" 
             WHERE "Id_seccion" = $1`,
      [sectionId]
    );

    const structMap = {};
    structures.rows.forEach(s => structMap[s.num] = s.id);

    // Si no hay estructuras, tal vez deberíamos crearlas por defecto? 
    // Por ahora asumimos que existen o fallamos.

    for (const [studentId, studentGrades] of Object.entries(gradesData)) {
      // studentGrades: { n1: '20', n2: '15' ... }
      for (let i = 1; i <= 4; i++) {
        const key = `n${i}`;
        const valStr = studentGrades[key];

        if (valStr !== undefined && valStr !== "" && valStr !== null) {
          const structId = structMap[i];

          if (structId) {
            const val = parseFloat(valStr);

            // Upsert Carga_Nota
            const check = await db.query(
              `SELECT "Id_nota" FROM "Carga_Nota" WHERE "Id_estudiante" = $1 AND "Id_estructura_evaluacion" = $2`,
              [studentId, structId]
            );

            if (check.rows.length > 0) {
              await db.query(
                `UPDATE "Carga_Nota" SET "puntaje" = $1, "esta_formalizada" = false, "actualizado_en" = CURRENT_TIMESTAMP WHERE "Id_nota" = $2`,
                [val, check.rows[0].Id_nota]
              );
            } else {
              await db.query(
                `INSERT INTO "Carga_Nota" ("Id_estudiante", "Id_estructura_evaluacion", "puntaje", "esta_formalizada") VALUES ($1, $2, $3, false)`,
                [studentId, structId, val]
              );
            }
          }
        }
      }
    }
    await db.query('COMMIT');
    return { success: true };
  } catch (e) {
    await db.query('ROLLBACK');
    console.error("Error en saveGradesBatch:", e);
    throw e;
  }
};

export const NotaModel = {
  findPendientesByYearId,
  aprobar,
  rechazar,
  aprobarTodas,
  verificarPendientes,
  findTeacherAllocations,
  getSectionStudents,
  saveCompetenciaNota,
  saveGradesBatch
};