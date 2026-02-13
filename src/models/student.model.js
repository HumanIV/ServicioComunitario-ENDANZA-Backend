import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE ESTUDIANTES
// ============================================

/**
 * Obtiene todos los estudiantes con sus relaciones
 * @param {Object} filters - Filtros opcionales (academicYearId, sectionId)
 * @returns {Promise<Array>}
 */
const findAll = async (filters = {}) => {
  try {
    let query = {
      text: `
        SELECT 
          e."Id_estudiante" as id,
          e."nombre" as first_name,
          e."apellido" as last_name,
          e."cedula" as dni,
          e."fecha_nacimiento" as birth_date,
          e."genero" as gender,
          e."seguro_escolar" as school_insurance,
          e."Id_nivel" as grade_level_id,
          nl."nivel" as grade_level_name,
          e."Id_nivel_danza" as dance_level_id,
          nd."nivel_danza" as dance_level_name,
          e."Id_escuela" as school_id,
          er."nombre_escuela" as school_name,
          e."Id_seguro" as insurance_id,
          s."tipo_seguro" as insurance_name,
          e."Id_representante" as representative_id,
          r."Id_usuario" as representative_user_id,
          u_r."nombre" as representative_first_name,
          u_r."apellido" as representative_last_name,
          u_r."cedula" as representative_dni,
          u_r."telefono" as representative_phone,
          u_r."correo" as representative_email,
          e."Id_historial" as medical_history_id
        FROM "Estudiante" e
        LEFT JOIN "Nivel_Escolar" nl ON e."Id_nivel" = nl."Id_nivel"
        LEFT JOIN "Nivel_Danza" nd ON e."Id_nivel_danza" = nd."Id_nivel_danza"
        LEFT JOIN "Escuela_Regular" er ON e."Id_escuela" = er."Id_escuela"
        LEFT JOIN "Seguro" s ON e."Id_seguro" = s."Id_seguro"
        LEFT JOIN "Representante" r ON e."Id_representante" = r."Id_representante"
        LEFT JOIN "Usuario" u_r ON r."Id_usuario" = u_r."Id_usuario"
        WHERE 1=1
      `
    };

    const values = [];
    let paramIndex = 1;

    // Filtro por año académico (a través de las secciones)
    if (filters.academicYearId) {
      query.text += ` AND EXISTS (
        SELECT 1 FROM "Estudiante_Seccion" es
        JOIN "Seccion" s ON es."Id_seccion" = s."Id_seccion"
        JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        WHERE es."Id_estudiante" = e."Id_estudiante"
        AND l."Id_ano" = $${paramIndex}
      )`;
      values.push(filters.academicYearId);
      paramIndex++;
    }

    // Filtro por sección específica
    if (filters.sectionId) {
      query.text += ` AND EXISTS (
        SELECT 1 FROM "Estudiante_Seccion" es
        WHERE es."Id_estudiante" = e."Id_estudiante"
        AND es."Id_seccion" = $${paramIndex}
      )`;
      values.push(filters.sectionId);
      paramIndex++;
    }

    query.text += ` ORDER BY e."apellido", e."nombre"`;
    query.values = values;

    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findAll students:", error);
    throw error;
  }
};

/**
 * Obtiene un estudiante por ID
 * @param {number} id - ID del estudiante
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  try {
    const query = {
      text: `
        SELECT 
          e."Id_estudiante" as id,
          e."nombre" as first_name,
          e."apellido" as last_name,
          e."cedula" as dni,
          e."fecha_nacimiento" as birth_date,
          e."genero" as gender,
          e."seguro_escolar" as school_insurance,
          e."Id_nivel" as grade_level_id,
          nl."nivel" as grade_level_name,
          e."Id_nivel_danza" as dance_level_id,
          nd."nivel_danza" as dance_level_name,
          e."Id_escuela" as school_id,
          er."nombre_escuela" as school_name,
          e."Id_seguro" as insurance_id,
          s."tipo_seguro" as insurance_name,
          e."Id_representante" as representative_id,
          r."Id_usuario" as representative_user_id,
          u_r."nombre" as representative_first_name,
          u_r."apellido" as representative_last_name,
          u_r."cedula" as representative_dni,
          u_r."telefono" as representative_phone,
          u_r."correo" as representative_email,
          e."Id_historial" as medical_history_id
        FROM "Estudiante" e
        LEFT JOIN "Nivel_Escolar" nl ON e."Id_nivel" = nl."Id_nivel"
        LEFT JOIN "Nivel_Danza" nd ON e."Id_nivel_danza" = nd."Id_nivel_danza"
        LEFT JOIN "Escuela_Regular" er ON e."Id_escuela" = er."Id_escuela"
        LEFT JOIN "Seguro" s ON e."Id_seguro" = s."Id_seguro"
        LEFT JOIN "Representante" r ON e."Id_representante" = r."Id_representante"
        LEFT JOIN "Usuario" u_r ON r."Id_usuario" = u_r."Id_usuario"
        WHERE e."Id_estudiante" = $1
      `,
      values: [id]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en findById student:", error);
    throw error;
  }
};

/**
 * Obtiene las secciones de un estudiante
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<Array>}
 */
const findSectionsByStudentId = async (studentId) => {
  try {
    const query = {
      text: `
        SELECT 
          es."Id_estudiante_seccion" as id,
          es."Id_seccion" as section_id,
          s."nombre_seccion" as section_name,
          l."Id_ano" as academic_year_id,
          a."nombre_ano" as academic_year_name,
          l."nombre_lapso" as period_name
        FROM "Estudiante_Seccion" es
        JOIN "Seccion" s ON es."Id_seccion" = s."Id_seccion"
        JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
        JOIN "Ano_Academico" a ON l."Id_ano" = a."Id_ano"
        WHERE es."Id_estudiante" = $1
        ORDER BY a."nombre_ano" DESC, l."nombre_lapso"
      `,
      values: [studentId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en findSectionsByStudentId:", error);
    throw error;
  }
};

/**
 * Crea un nuevo estudiante
 * @param {Object} studentData - Datos del estudiante
 * @returns {Promise<Object>}
 */
const create = async (studentData) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const {
      nombre,
      apellido,
      cedula,
      fecha_nacimiento,
      genero,
      seguro_escolar,
      Id_nivel,
      Id_nivel_danza,
      Id_escuela,
      Id_seguro,
      Id_representante,
      Id_historial
    } = studentData;

    const query = {
      text: `
        INSERT INTO "Estudiante" (
          "nombre", "apellido", "cedula", "fecha_nacimiento", "genero",
          "seguro_escolar", "Id_nivel", "Id_nivel_danza", "Id_escuela",
          "Id_seguro", "Id_representante", "Id_historial"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING 
          "Id_estudiante" as id,
          "nombre" as first_name,
          "apellido" as last_name,
          "cedula" as dni
      `,
      values: [
        nombre, apellido, cedula, fecha_nacimiento, genero,
        seguro_escolar || false, Id_nivel, Id_nivel_danza, Id_escuela,
        Id_seguro, Id_representante, Id_historial
      ]
    };

    const { rows } = await client.query(query.text, query.values);
    
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en create student:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza un estudiante existente
 * @param {number} id - ID del estudiante
 * @param {Object} studentData - Datos a actualizar
 * @returns {Promise<Object>}
 */
const update = async (id, studentData) => {
  try {
    const {
      nombre,
      apellido,
      cedula,
      fecha_nacimiento,
      genero,
      seguro_escolar,
      Id_nivel,
      Id_nivel_danza,
      Id_escuela,
      Id_seguro,
      Id_representante,
      Id_historial
    } = studentData;

    const query = {
      text: `
        UPDATE "Estudiante"
        SET 
          "nombre" = COALESCE($1, "nombre"),
          "apellido" = COALESCE($2, "apellido"),
          "cedula" = COALESCE($3, "cedula"),
          "fecha_nacimiento" = COALESCE($4, "fecha_nacimiento"),
          "genero" = COALESCE($5, "genero"),
          "seguro_escolar" = COALESCE($6, "seguro_escolar"),
          "Id_nivel" = COALESCE($7, "Id_nivel"),
          "Id_nivel_danza" = COALESCE($8, "Id_nivel_danza"),
          "Id_escuela" = COALESCE($9, "Id_escuela"),
          "Id_seguro" = COALESCE($10, "Id_seguro"),
          "Id_representante" = COALESCE($11, "Id_representante"),
          "Id_historial" = COALESCE($12, "Id_historial")
        WHERE "Id_estudiante" = $13
        RETURNING 
          "Id_estudiante" as id,
          "nombre" as first_name,
          "apellido" as last_name,
          "cedula" as dni
      `,
      values: [
        nombre, apellido, cedula, fecha_nacimiento, genero,
        seguro_escolar, Id_nivel, Id_nivel_danza, Id_escuela,
        Id_seguro, Id_representante, Id_historial, id
      ]
    };

    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en update student:", error);
    throw error;
  }
};

/**
 * Elimina un estudiante
 * @param {number} id - ID del estudiante
 * @returns {Promise<Object>}
 */
const remove = async (id) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Eliminar relaciones en Estudiante_Seccion
    await client.query(
      'DELETE FROM "Estudiante_Seccion" WHERE "Id_estudiante" = $1',
      [id]
    );

    // Eliminar el estudiante
    const query = {
      text: 'DELETE FROM "Estudiante" WHERE "Id_estudiante" = $1 RETURNING "Id_estudiante" as id',
      values: [id]
    };
    const { rows } = await client.query(query.text, query.values);

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en remove student:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Inscribe un estudiante en una sección
 * @param {number} studentId - ID del estudiante
 * @param {number} sectionId - ID de la sección
 * @returns {Promise<Object>}
 */
const enrollInSection = async (studentId, sectionId) => {
  try {
    // Verificar que la sección tenga capacidad disponible
    const checkQuery = {
      text: `
        SELECT s."capacidad", COUNT(es."Id_estudiante_seccion") as enrolled
        FROM "Seccion" s
        LEFT JOIN "Estudiante_Seccion" es ON s."Id_seccion" = es."Id_seccion"
        WHERE s."Id_seccion" = $1
        GROUP BY s."Id_seccion"
      `,
      values: [sectionId]
    };
    const { rows } = await db.query(checkQuery.text, checkQuery.values);
    
    if (rows.length > 0) {
      const { capacidad, enrolled } = rows[0];
      if (enrolled >= capacidad) {
        throw new Error("La sección ha alcanzado su capacidad máxima");
      }
    }

    // Inscribir estudiante
    const query = {
      text: `
        INSERT INTO "Estudiante_Seccion" ("Id_estudiante", "Id_seccion")
        VALUES ($1, $2)
        RETURNING 
          "Id_estudiante_seccion" as id,
          "Id_estudiante" as student_id,
          "Id_seccion" as section_id
      `,
      values: [studentId, sectionId]
    };
    const result = await db.query(query.text, query.values);
    return result.rows[0];
  } catch (error) {
    console.error("Error en enrollInSection:", error);
    throw error;
  }
};

/**
 * Elimina la inscripción de un estudiante de una sección
 * @param {number} studentId - ID del estudiante
 * @param {number} sectionId - ID de la sección
 * @returns {Promise<Object>}
 */
const removeFromSection = async (studentId, sectionId) => {
  try {
    const query = {
      text: `
        DELETE FROM "Estudiante_Seccion"
        WHERE "Id_estudiante" = $1 AND "Id_seccion" = $2
        RETURNING "Id_estudiante_seccion" as id
      `,
      values: [studentId, sectionId]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error en removeFromSection:", error);
    throw error;
  }
};

/**
 * Busca estudiantes por criterios (nombre, apellido, cédula)
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>}
 */
const search = async (searchTerm) => {
  try {
    const query = {
      text: `
        SELECT 
          e."Id_estudiante" as id,
          e."nombre" as first_name,
          e."apellido" as last_name,
          e."cedula" as dni,
          e."fecha_nacimiento" as birth_date,
          e."genero" as gender
        FROM "Estudiante" e
        WHERE e."nombre" ILIKE $1
           OR e."apellido" ILIKE $1
           OR e."cedula" ILIKE $1
        ORDER BY e."apellido", e."nombre"
        LIMIT 50
      `,
      values: [`%${searchTerm}%`]
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error en search students:", error);
    throw error;
  }
};

/**
 * Verifica si una cédula ya está registrada
 * @param {string} cedula - Cédula a verificar
 * @param {number} excludeId - ID a excluir (para actualizaciones)
 * @returns {Promise<boolean>}
 */
const existsByCedula = async (cedula, excludeId = null) => {
  try {
    let query = {
      text: 'SELECT "Id_estudiante" as id FROM "Estudiante" WHERE "cedula" = $1',
      values: [cedula]
    };
    
    if (excludeId) {
      query.text += ' AND "Id_estudiante" != $2';
      query.values.push(excludeId);
    }
    
    const { rows } = await db.query(query.text, query.values);
    return rows.length > 0;
  } catch (error) {
    console.error("Error en existsByCedula:", error);
    throw error;
  }
};

export const StudentModel = {
  findAll,
  findById,
  findSectionsByStudentId,
  create,
  update,
  remove,
  enrollInSection,
  removeFromSection,
  search,
  existsByCedula
};