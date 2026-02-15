import { SectionModel } from "../models/section.model.js";

// ============================================
// CONTROLADOR DE SECCIONES
// ============================================

const listSections = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const sections = await SectionModel.findAll(academicYearId);
    
    // Transformar al formato esperado por el frontend
    const transformed = sections.map(s => ({
      id: s.id,
      sectionName: s.section_name,
      gradeLevel: s.subject_name, // Temporal, necesitarás mapear mejor
      academicYear: s.academic_year_name,
      schedules: [] // Se cargarán después
    }));

    return res.json({
      ok: true,
      data: transformed
    });
  } catch (error) {
    console.error("Error en listSections:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al listar secciones",
      error: error.message
    });
  }
};

const getSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await SectionModel.findById(id);
    
    if (!section) {
      return res.status(404).json({
        ok: false,
        msg: "Sección no encontrada"
      });
    }

    const schedules = await SectionModel.findSchedulesBySectionId(id);

    const transformed = {
      id: section.id,
      sectionName: section.section_name,
      gradeLevel: section.subject_name,
      academicYear: section.academic_year_name,
      schedules: schedules.map(s => ({
        id: s.id,
        subject: s.subject_name || 'Materia',
        teacherName: s.teacher_name ? `${s.teacher_name} ${s.teacher_lastname}`.trim() : 'Sin profesor',
        teacherId: s.teacher_id,
        dayOfWeek: s.day_name,
        startTime: s.start_time,
        endTime: s.end_time,
        classroom: s.classroom_name
      }))
    };

    return res.json({
      ok: true,
      data: transformed
    });
  } catch (error) {
    console.error("Error en getSection:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener sección",
      error: error.message
    });
  }
};

const createSection = async (req, res) => {
  try {
    const sectionData = req.body;
    const newSection = await SectionModel.create(sectionData);
    
    return res.status(201).json({
      ok: true,
      msg: "Sección creada exitosamente",
      data: newSection
    });
  } catch (error) {
    console.error("Error en createSection:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear sección",
      error: error.message
    });
  }
};

const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const sectionData = req.body;
    
    const updated = await SectionModel.update(id, sectionData);
    
    return res.json({
      ok: true,
      msg: "Sección actualizada",
      data: updated
    });
  } catch (error) {
    console.error("Error en updateSection:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar sección",
      error: error.message
    });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await SectionModel.remove(id);
    
    return res.json({
      ok: true,
      msg: "Sección eliminada"
    });
  } catch (error) {
    console.error("Error en deleteSection:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar sección",
      error: error.message
    });
  }
};

// ============================================
// HORARIOS
// ============================================

const addSchedule = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const scheduleData = req.body;
    
    const newSchedule = await SectionModel.addSchedule(sectionId, scheduleData);
    
    return res.status(201).json({
      ok: true,
      msg: "Horario agregado",
      data: newSchedule
    });
  } catch (error) {
    console.error("Error en addSchedule:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al agregar horario",
      error: error.message
    });
  }
};

const removeSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    await SectionModel.removeSchedule(scheduleId);
    
    return res.json({
      ok: true,
      msg: "Horario eliminado"
    });
  } catch (error) {
    console.error("Error en removeSchedule:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar horario",
      error: error.message
    });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { academicYearId, day, startTime, endTime, classroom, excludeSectionId } = req.query;
    
    const result = await SectionModel.checkClassroomAvailability({
      academicYearId,
      day,
      startTime,
      endTime,
      classroom,
      excludeSectionId
    });
    
    return res.json({
      ok: true,
      data: result
    });
  } catch (error) {
    console.error("Error en checkAvailability:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al verificar disponibilidad",
      error: error.message
    });
  }
};




const getSectionStudents = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        // Aquí obtienes los estudiantes de la sección desde la BD
        const students = await SectionModel.getStudentsBySection(sectionId);
        
        return res.json({
            ok: true,
            data: students
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener estudiantes de la sección"
        });
    }
};


const getEvaluationStructure = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        // Aquí obtienes la estructura de evaluaciones
        const structure = await SectionModel.getEvaluationStructure(sectionId);
        
        return res.json({
            ok: true,
            data: structure
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener estructura de evaluaciones"
        });
    }
};






export const SectionController = {
  listSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  addSchedule,
  removeSchedule,
  checkAvailability,
  getSectionStudents,
  getEvaluationStructure 
};