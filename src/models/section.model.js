import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE SECCIONES
// ============================================

const findAll = async (academicYearId = null) => {
  try {
    let query = {
      text: `
        SELECT 
          s."Id_seccion" as id,
          s."nombre_seccion" as section_name,
          s."capacidad" as capacity,
          s."Id_materia" as subject_id,
          m."nombre_materia" as subject_name,
          s."Id_lapso" as period_id,
          l."nombre_lapso" as period_name,
          s."Id_ano" as academic_year_id,
          a."nombre_ano" as academic_year_name
        FROM "Seccion" s
        LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
        LEFT JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        LEFT JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
      `
    };

    if (academicYearId) {
      query.text += ` WHERE s."Id_ano" = $1`;
      query.values = [academicYearId];
    }

    query.text += ` ORDER BY s."Id_seccion"`;

    const { rows } = await db.query(query.text, query.values || []);
    return rows;
  } catch (error) {
    console.error("Error en findAll sections:", error);
    throw error;
  }
};

const findById = async (id) => {
  try {
    const query = {
      text: `
        SELECT 
          s."Id_seccion" as id,
          s."nombre_seccion" as section_name,
          s."capacidad" as capacity,
          s."Id_materia" as subject_id,
          m."nombre_materia" as subject_name,
          s."Id_lapso" as period_id,
          l."nombre_lapso" as period_name,
          l."Id_ano" as academic_year_id,
          a."nombre_ano" as academic_year_name
        FROM "Seccion" s
        LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
        LEFT JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        LEFT JOIN "Ano_Academico" a ON l."Id_ano" = a."Id_ano"
        WHERE s."Id_seccion" = $1
      `,
      values: [id]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en findById section:", error);
    throw error;
  }
};

const create = async (sectionData) => {
  try {
    const { nombre_seccion, capacidad, Id_materia, Id_lapso } = sectionData;

    const query = {
      text: `
        INSERT INTO "Seccion" ("nombre_seccion", "capacidad", "Id_materia", "Id_lapso")
        VALUES ($1, $2, $3, $4)
        RETURNING 
          "Id_seccion" as id,
          "nombre_seccion" as section_name,
          "capacidad" as capacity,
          "Id_materia" as subject_id,
          "Id_lapso" as period_id
      `,
      values: [nombre_seccion, capacidad, Id_materia, Id_lapso]
    };

    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en create section:", error);
    throw error;
  }
};

const update = async (id, sectionData) => {
  try {
    const { nombre_seccion, capacidad, Id_materia, Id_lapso } = sectionData;

    const query = {
      text: `
        UPDATE "Seccion"
        SET 
          "nombre_seccion" = COALESCE($1, "nombre_seccion"),
          "capacidad" = COALESCE($2, "capacidad"),
          "Id_materia" = COALESCE($3, "Id_materia"),
          "Id_lapso" = COALESCE($4, "Id_lapso")
        WHERE "Id_seccion" = $5
        RETURNING 
          "Id_seccion" as id,
          "nombre_seccion" as section_name,
          "capacidad" as capacity,
          "Id_materia" as subject_id,
          "Id_lapso" as period_id
      `,
      values: [nombre_seccion, capacidad, Id_materia, Id_lapso, id]
    };

    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en update section:", error);
    throw error;
  }
};

const remove = async (id) => {
  try {
    const query = {
      text: `DELETE FROM "Seccion" WHERE "Id_seccion" = $1 RETURNING "Id_seccion" as id`,
      values: [id]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en remove section:", error);
    throw error;
  }
};

// ============================================
// HORARIOS (SCHEDULES)
// ============================================

const findSchedulesBySectionId = async (sectionId) => {
  try {
    const query = {
      text: `
        SELECT 
          h."Id_horario" as id,
          h."Id_seccion" as section_id,
          h."Id_aula" as classroom_id,
          a."nombre_aula" as classroom_name,
          h."Id_profesor" as teacher_id,
          p."Id_usuario" as user_id,
          u."nombre" as teacher_name,
          u."apellido" as teacher_lastname,
          h."Id_bloque" as block_id,
          b."nombre_bloque" as block_name,
          b."inicio_bloque" as start_time,
          b."fin_bloque" as end_time,
          h."Id_dia" as day_id,
          d."nombre_dia" as day_name
        FROM "Horario" h
        LEFT JOIN "Aula" a ON h."Id_aula" = a."Id_aula"
        LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
        LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
        LEFT JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
        LEFT JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
        WHERE h."Id_seccion" = $1
        ORDER BY d."Id_dia", b."inicio_bloque"
      `,
      values: [sectionId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findSchedulesBySectionId:", error);
    throw error;
  }
};

const addSchedule = async (sectionId, scheduleData) => {
  try {
    const { Id_aula, Id_profesor, Id_bloque, Id_dia } = scheduleData;

    const query = {
      text: `
        INSERT INTO "Horario" ("Id_seccion", "Id_aula", "Id_profesor", "Id_bloque", "Id_dia")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          "Id_horario" as id,
          "Id_seccion" as section_id,
          "Id_aula" as classroom_id,
          "Id_profesor" as teacher_id,
          "Id_bloque" as block_id,
          "Id_dia" as day_id
      `,
      values: [sectionId, Id_aula, Id_profesor, Id_bloque, Id_dia]
    };

    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en addSchedule:", error);
    throw error;
  }
};

const removeSchedule = async (scheduleId) => {
  try {
    const query = {
      text: `DELETE FROM "Horario" WHERE "Id_horario" = $1 RETURNING "Id_horario" as id`,
      values: [scheduleId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en removeSchedule:", error);
    throw error;
  }
};

// ============================================
// VERIFICAR DISPONIBILIDAD DE AULA
// ============================================

const checkClassroomAvailability = async ({
  academicYearId,
  day,
  startTime,
  endTime,
  classroom,
  excludeSectionId
}) => {
  try {
    // Convertir día a ID
    const dayMap = {
      'LUNES': 1, 'MARTES': 2, 'MIÉRCOLES': 3, 'JUEVES': 4, 'VIERNES': 5
    };
    const dayId = dayMap[day];

    if (!dayId) {
      return { available: false, error: "Día inválido" };
    }

    // Obtener IDs de bloques que se solapan con el horario
    const blocksQuery = {
      text: `
        SELECT "Id_bloque" as id
        FROM "Bloque_Horario"
        WHERE ($1::time, $2::time) OVERLAPS ("inicio_bloque", "fin_bloque")
      `,
      values: [startTime, endTime]
    };
    const blocks = await db.query(blocksQuery.text, blocksQuery.values);
    const blockIds = blocks.rows.map(b => b.id);

    if (blockIds.length === 0) {
      return { available: true };
    }

    // Verificar conflictos
    let conflictQuery = {
      text: `
        SELECT 
          h."Id_horario" as id,
          s."nombre_seccion" as section_name,
          b."nombre_bloque" as block_name,
          b."inicio_bloque" as start_time,
          b."fin_bloque" as end_time,
          d."nombre_dia" as day_name
        FROM "Horario" h
        JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
        JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
        JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
        WHERE h."Id_aula" = (SELECT "Id_aula" FROM "Aula" WHERE "nombre_aula" = $1)
          AND h."Id_dia" = $2
          AND h."Id_bloque" = ANY($3::int[])
      `,
      values: [classroom, dayId, blockIds]
    };

    if (excludeSectionId) {
      conflictQuery.text += ` AND h."Id_seccion" != $4`;
      conflictQuery.values.push(excludeSectionId);
    }

    const conflicts = await db.query(conflictQuery.text, conflictQuery.values);

    if (conflicts.rows.length > 0) {
      const conflict = conflicts.rows[0];
      return {
        available: false,
        conflict: {
          sectionName: conflict.section_name,
          startTime: conflict.start_time,
          endTime: conflict.end_time
        }
      };
    }

    return { available: true };
  } catch (error) {
    console.error("Error en checkClassroomAvailability:", error);
    throw error;
  }
};


const getStudentsBySection = async (sectionId) => {
  try {
    const query = {
      text: `
                SELECT 
                    e."Id_estudiante" as id,
                    e."nombre" as first_name,
                    e."apellido" as last_name,
                    e."cedula" as dni,
                    e."fecha_nacimiento" as birth_date
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
    console.error("Error en getStudentsBySection:", error);
    throw error;
  }
};

const getEvaluationStructure = async (sectionId) => {
  try {
    // Obtenemos la estructura de evaluación definida para esta sección
    // Si no existe, podríamos devolver una por defecto o vacía
    const query = {
      text: `
                SELECT 
                    ee."Id_estructura_evaluacion" as id,
      ee."numero_evaluacion" as numero,
      ee."porcentaje_peso" as peso,
      te."nombre_evaluacion" as tipo
                FROM "Estructura_Evaluacion" ee
                LEFT JOIN "Tipo_Evaluacion" te ON ee."Id_tipo_evaluacion" = te."Id_tipo_evaluacion"
                WHERE ee."Id_seccion" = $1
                ORDER BY ee."numero_evaluacion"
            `,
      values: [sectionId]
    };
    const { rows } = await db.query(query.text, query.values);

    // Si no hay estructura en BD, retornamos null para que el frontend use el default o muestre aviso
    if (rows.length === 0) return null;

    return rows;
  } catch (error) {
    console.error("Error en getEvaluationStructure:", error);
    throw error;
  }
};

export const SectionModel = {
  findAll,
  findById,
  create,
  update,
  remove,
  findSchedulesBySectionId,
  addSchedule,
  removeSchedule,
  checkClassroomAvailability,
  getStudentsBySection,
  getEvaluationStructure
};