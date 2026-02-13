import { StudentModel } from "../models/student.model.js";

// ============================================
// CONTROLADOR DE ESTUDIANTES
// ============================================

/**
 * Listar todos los estudiantes
 */
const listStudents = async (req, res) => {
  try {
    const { academicYearId, sectionId } = req.query;
    
    const students = await StudentModel.findAll({
      academicYearId: academicYearId ? parseInt(academicYearId) : null,
      sectionId: sectionId ? parseInt(sectionId) : null
    });

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
      representative_email: s.representative_email
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

export const StudentController = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  removeEnrollment,
  searchStudents
};