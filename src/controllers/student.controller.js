import { StudentModel } from "../models/student.model.js";
import { RepresentanteModel } from "../models/representante.model.js"; // 👈 IMPORTANTE
import { db } from "../db/connection.database.js"; // Solo si otros métodos lo necesitan

// ============================================
// CONTROLADOR DE ESTUDIANTES
// ============================================

/**
 * Listar todos los estudiantes
 */
const listStudents = async (req, res) => {
  try {
    const { academicYearId, sectionId } = req.query;
    console.log(`🔍 listStudents request - academicYearId: ${academicYearId}, sectionId: ${sectionId}`);

    const students = await StudentModel.findAll({
      academicYearId: academicYearId ? parseInt(academicYearId) : null,
      sectionId: sectionId ? parseInt(sectionId) : null
    });

    console.log(`✅ listStudents result - found ${students.length} raw students`);

    // Transformar al formato esperado por el frontend
    const transformed = students.map(s => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      full_name: `${s.first_name} ${s.last_name}`.trim(),
      dni: s.dni,
      birth_date: s.birth_date,
      gender: s.gender,
      grade_level: s.grade_level_name,
      dance_level: s.dance_level_name,
      school: s.school_name,
      insurance: s.insurance_name,
      representative: s.representative_first_name ?
        `${s.representative_first_name} ${s.representative_last_name}`.trim() : null,
      representative_phone: s.representative_phone,
      representative_email: s.representative_email,
      status: 'active', // Por defecto todos activos si están en la base de datos
      sections: s.sections || []
    }));

    return res.json({
      ok: true,
      data: transformed,
      total: transformed.length
    });
  } catch (error) {
    console.error("Error en listStudents:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al listar estudiantes",
      error: error.message
    });
  }
};

/**
 * Obtener un estudiante por ID
 */
const getStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.findById(id);

    if (!student) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    // Obtener las secciones del estudiante
    const sections = await StudentModel.findSectionsByStudentId(id);

    const transformed = {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`.trim(),
      dni: student.dni,
      birth_date: student.birth_date,
      gender: student.gender,
      school_insurance: student.school_insurance,
      grade_level_id: student.grade_level_id,
      grade_level_name: student.grade_level_name,
      dance_level_id: student.dance_level_id,
      dance_level_name: student.dance_level_name,
      school_id: student.school_id,
      school_name: student.school_name,
      insurance_id: student.insurance_id,
      insurance_name: student.insurance_name,
      representative_id: student.representative_id,
      representative: student.representative_first_name ?
        `${student.representative_first_name} ${student.representative_last_name}`.trim() : null,
      representative_phone: student.representative_phone,
      representative_email: student.representative_email,
      medical_history_id: student.medical_history_id,
      sections: sections.map(s => ({
        id: s.id,
        section_id: s.section_id,
        section_name: s.section_name,
        academic_year: s.academic_year_name,
        period: s.period_name
      }))
    };

    return res.json({
      ok: true,
      data: transformed
    });
  } catch (error) {
    console.error("Error en getStudent:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener estudiante",
      error: error.message
    });
  }
};

/**
 * Crear un nuevo estudiante
 */
const createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // Validar campos obligatorios
    if (!studentData.nombre || !studentData.apellido || !studentData.cedula || !studentData.fecha_nacimiento) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan campos obligatorios: nombre, apellido, cédula, fecha de nacimiento"
      });
    }

    // Verificar si la cédula ya existe
    const exists = await StudentModel.existsByCedula(studentData.cedula);
    if (exists) {
      return res.status(400).json({
        ok: false,
        msg: "La cédula ya está registrada para otro estudiante"
      });
    }

    const newStudent = await StudentModel.create(studentData);

    return res.status(201).json({
      ok: true,
      msg: "Estudiante creado exitosamente",
      data: newStudent
    });
  } catch (error) {
    console.error("Error en createStudent:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear estudiante",
      error: error.message
    });
  }
};

/**
 * Actualizar un estudiante
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = req.body;

    // Verificar si el estudiante existe
    const existing = await StudentModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    // Verificar si la cédula ya existe (si se está cambiando)
    if (studentData.cedula && studentData.cedula !== existing.dni) {
      const exists = await StudentModel.existsByCedula(studentData.cedula, id);
      if (exists) {
        return res.status(400).json({
          ok: false,
          msg: "La cédula ya está registrada para otro estudiante"
        });
      }
    }

    const updated = await StudentModel.update(id, studentData);

    return res.json({
      ok: true,
      msg: "Estudiante actualizado",
      data: updated
    });
  } catch (error) {
    console.error("Error en updateStudent:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar estudiante",
      error: error.message
    });
  }
};

/**
 * Eliminar un estudiante
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el estudiante existe
    const existing = await StudentModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    await StudentModel.remove(id);

    return res.json({
      ok: true,
      msg: "Estudiante eliminado"
    });
  } catch (error) {
    console.error("Error en deleteStudent:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar estudiante",
      error: error.message
    });
  }
};

/**
 * Inscribir estudiante en una sección
 */
const enrollStudent = async (req, res) => {
  try {
    const { studentId, sectionId } = req.body;

    if (!studentId || !sectionId) {
      return res.status(400).json({
        ok: false,
        msg: "Se requiere studentId y sectionId"
      });
    }

    // Verificar que el estudiante existe
    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    const enrollment = await StudentModel.enrollInSection(studentId, sectionId);

    return res.status(201).json({
      ok: true,
      msg: "Estudiante inscrito en la sección",
      data: enrollment
    });
  } catch (error) {
    console.error("Error en enrollStudent:", error);

    if (error.message === "La sección ha alcanzado su capacidad máxima") {
      return res.status(400).json({
        ok: false,
        msg: error.message
      });
    }

    return res.status(500).json({
      ok: false,
      msg: "Error al inscribir estudiante",
      error: error.message
    });
  }
};

/**
 * Eliminar inscripción de estudiante
 */
const removeEnrollment = async (req, res) => {
  try {
    const { studentId, sectionId } = req.params;

    await StudentModel.removeFromSection(studentId, sectionId);

    return res.json({
      ok: true,
      msg: "Inscripción eliminada"
    });
  } catch (error) {
    console.error("Error en removeEnrollment:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar inscripción",
      error: error.message
    });
  }
};

/**
 * Buscar estudiantes
 */
const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        ok: true,
        data: []
      });
    }

    const students = await StudentModel.search(q);

    const transformed = students.map(s => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      full_name: `${s.first_name} ${s.last_name}`.trim(),
      dni: s.dni,
      birth_date: s.birth_date,
      gender: s.gender
    }));

    return res.json({
      ok: true,
      data: transformed
    });
  } catch (error) {
    console.error("Error en searchStudents:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al buscar estudiantes",
      error: error.message
    });
  }
};

/**
 * ✅ VERSIÓN CORREGIDA - Obtener estudiantes del representante autenticado
 */
const getMyStudents = async (req, res) => {
  try {
    // ✅ CORREGIDO: Obtener userId de req.user.userId (no de req.userId)
    const userId = req.user?.userId;

    console.log("🔍 Contenido de req.user:", req.user);
    console.log("🔍 Contenido de req.userId (obsoleto):", req.userId);
    console.log(`👤 userId extraído: ${userId}`);

    if (!userId) {
      console.error("❌ No se pudo extraer userId del token");
      return res.status(401).json({
        ok: false,
        msg: "No se pudo identificar al usuario"
      });
    }

    // ✅ Usar el modelo de representantes para obtener el ID
    const representante = await RepresentanteModel.findByUserId(userId);

    if (!representante) {
      return res.json({
        ok: true,
        data: [],
        msg: "No es un representante"
      });
    }

    // ✅ Usar el método en StudentModel para obtener estudiantes
    const students = await StudentModel.findByRepresentante(representante.id);

    // Transformar al formato esperado por el frontend
    const transformed = students.map(s => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      full_name: `${s.first_name} ${s.last_name}`.trim(),
      dni: s.dni,
      birth_date: s.birth_date,
      gender: s.gender,
      grade_level: s.grade_level,
      dance_level: s.dance_level,
      school_insurance: s.school_insurance
    }));

    return res.json({
      ok: true,
      data: transformed,
      total: transformed.length
    });

  } catch (error) {
    console.error("❌ Error en getMyStudents:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener estudiantes del representante",
      error: error.message
    });
  }
};



/**
 * Obtener un estudiante por ID (solo si el representante tiene permiso)
 */
const getStudentForRepresentante = async (req, res) => {
  try {
    const studentId = req.params.id;
    const userId = req.user?.userId;

    console.log(`👤 Representante ${userId} solicitando perfil del estudiante ${studentId}`);

    // 1. Verificar que el usuario es representante
    const representante = await RepresentanteModel.findByUserId(userId);

    if (!representante) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permisos para ver perfiles de estudiantes"
      });
    }

    // 2. Obtener el estudiante
    const student = await StudentModel.findById(studentId);

    if (!student) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    // 3. Verificar que el estudiante pertenece a este representante
    if (student.representative_id !== representante.id) {
      console.warn(`🚨 Intento de acceso no autorizado: Representante ${representante.id} intenta ver estudiante ${studentId} que pertenece a ${student.representative_id}`);
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para ver este estudiante"
      });
    }

    // 4. Obtener las secciones del estudiante
    const sections = await StudentModel.findSectionsByStudentId(studentId);

    // 5. Transformar datos
    const transformed = {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`.trim(),
      dni: student.dni,
      birth_date: student.birth_date,
      gender: student.gender,
      school_insurance: student.school_insurance,
      grade_level_id: student.grade_level_id,
      grade_level_name: student.grade_level_name,
      dance_level_id: student.dance_level_id,
      dance_level_name: student.dance_level_name,
      school_id: student.school_id,
      school_name: student.school_name,
      insurance_id: student.insurance_id,
      insurance_name: student.insurance_name,
      representative_id: student.representative_id,
      representative: student.representative_first_name ?
        `${student.representative_first_name} ${student.representative_last_name}`.trim() : null,
      representative_phone: student.representative_phone,
      representative_email: student.representative_email,
      medical_history_id: student.medical_history_id,
      sections: sections.map(s => ({
        id: s.id,
        section_id: s.section_id,
        section_name: s.section_name,
        academic_year: s.academic_year_name,
        period: s.period_name
      }))
    };

    return res.json({
      ok: true,
      data: transformed
    });

  } catch (error) {
    console.error("❌ Error en getStudentForRepresentante:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener perfil del estudiante",
      error: error.message
    });
  }
};








/**
* Obtiene los boletines de un estudiante por año académico
*/
const getStudentBoletines = async (req, res) => {
  try {
    const studentId = req.params.id;
    // 👇 CAMBIA ESTA LÍNEA (la única corrección)
    const userId = req.user?.userId; // Antes era: req.userId
    const { academicYearId } = req.query;

    console.log(`👤 Usuario ${userId} solicitando boletines del estudiante ${studentId}`);

    // 1. Verificar que el usuario es representante
    const representante = await RepresentanteModel.findByUserId(userId);

    if (!representante) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permisos para ver boletines"
      });
    }

    // 2. Verificar que el estudiante pertenece al representante
    const student = await StudentModel.findById(studentId);

    if (!student) {
      return res.status(404).json({
        ok: false,
        msg: "Estudiante no encontrado"
      });
    }

    if (student.representative_id !== representante.id) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para ver este estudiante"
      });
    }

    // 3. Obtener boletines del estudiante
    const boletines = await StudentModel.getStudentBoletines(studentId, academicYearId);

    return res.json({
      ok: true,
      data: boletines
    });

  } catch (error) {
    console.error("❌ Error en getStudentBoletines:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener boletines",
      error: error.message
    });
  }
};


// controllers/student.controller.js
const getCurrentSection = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando sección para estudiante ID: ${id}`);

    const query = `
            SELECT 
                s."Id_seccion" as id,
                s."nombre_seccion" as nombre_seccion,
                g."nombre_grado" as nivel_academico,
                a."nombre_ano" as academic_year_name,
                a."Id_ano" as academic_year_id
            FROM "Estudiante_Seccion" es
            JOIN "Seccion" s ON es."Id_seccion" = s."Id_seccion"
            JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
            JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
            JOIN "Grado" g ON m."ano_materia" = g."Id_grado"
            WHERE es."Id_estudiante" = $1
            ORDER BY es."Id_estudiante_seccion" DESC
            LIMIT 1
        `;

    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "El estudiante no está asignado a ninguna sección"
      });
    }

    console.log(`✅ Sección encontrada:`, rows[0]);

    return res.json({
      ok: true,
      seccion: rows[0]
    });

  } catch (error) {
    console.error("Error en getCurrentSection:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener sección del estudiante"
    });
  }
};


/**
 * Obtener horarios por grado del estudiante
 * Busca la sección actual del estudiante, obtiene su nivel_academico,
 * y luego retorna todos los horarios de TODAS las secciones con ese mismo grado
 * en el mismo año académico.
 */
const getScheduleByGrade = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📅 Buscando horarios por grado para estudiante ID: ${id}`);

    // PASO 1: Obtener el nombre del grado mediante Materia y Grado
    const sectionQuery = `
            SELECT 
                s."Id_seccion" as section_id,
                s."nombre_seccion" as nombre_seccion,
                g."nombre_grado" as nivel_academico,
                g."Id_grado" as grade_id,
                a."nombre_ano" as academic_year_name,
                a."Id_ano" as academic_year_id
            FROM "Estudiante_Seccion" es
            JOIN "Seccion" s ON es."Id_seccion" = s."Id_seccion"
            JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
            JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
            JOIN "Grado" g ON m."ano_materia" = g."Id_grado"
            WHERE es."Id_estudiante" = $1
            ORDER BY es."Id_estudiante_seccion" DESC
            LIMIT 1
        `;

    const { rows: sectionRows } = await db.query(sectionQuery, [id]);

    if (sectionRows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "El estudiante no está asignado a ninguna sección o materia"
      });
    }

    const currentSection = sectionRows[0];
    const gradeId = currentSection.grade_id;
    const nivelAcademico = currentSection.nivel_academico;
    const academicYearId = currentSection.academic_year_id;

    console.log(`✅ Estudiante en grado: "${nivelAcademico}" (ID: ${gradeId}), año académico ID: ${academicYearId}`);

    // PASO 2: Obtener TODOS los horarios de TODAS las secciones que pertenezcan al mismo GRADO
    const schedulesQuery = `
            SELECT 
                h."Id_horario" as id,
                h."Id_dia" as day_id,
                d."nombre_dia" as day_name,
                h."Id_bloque" as block_id,
                b."nombre_bloque" as block_name,
                b."inicio_bloque" as start_time,
                b."fin_bloque" as end_time,
                h."Id_aula" as classroom_id,
                au."nombre_aula" as classroom_name,
                h."Id_profesor" as teacher_id,
                CONCAT(u."nombre", ' ', u."apellido") as teacher_name,
                m."Id_materia" as subject_id,
                m."nombre_materia" as subject_name,
                m."tipo_materia" as subject_type,
                s."Id_seccion" as section_id,
                s."nombre_seccion" as section_name
            FROM "Horario" h
            JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
            JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
            JOIN "Grado" g ON m."ano_materia" = g."Id_grado"
            JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
            JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
            LEFT JOIN "Aula" au ON h."Id_aula" = au."Id_aula"
            LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
            LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
            WHERE g."Id_grado" = $1
              AND s."Id_ano" = $2
            ORDER BY d."Id_dia", b."inicio_bloque"
        `;

    const { rows: scheduleRows } = await db.query(schedulesQuery, [gradeId, academicYearId]);

    console.log(`📋 Horarios encontrados para grado "${nivelAcademico}": ${scheduleRows.length}`);

    return res.json({
      ok: true,
      data: {
        grado: nivelAcademico,
        seccion: currentSection,
        academic_year_name: currentSection.academic_year_name,
        horarios: scheduleRows
      }
    });

  } catch (error) {
    console.error("Error en getScheduleByGrade:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener horarios por grado del estudiante"
    });
  }
};


// Exportar todos los métodos
export const StudentController = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  removeEnrollment,
  searchStudents,
  getMyStudents,
  getStudentForRepresentante, // 👈 NUEVO // 👈 Método corregido
  getStudentBoletines,
  getCurrentSection,
  getScheduleByGrade,
};