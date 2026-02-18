// controllers/schedule.controller.js
import { ScheduleModel } from "../models/schedule.model.js";
import { TeacherModel } from "../models/teacher.model.js";

// ============================================
// SECCIONES
// ============================================

const listSections = async (req, res) => {
    try {
        const academicYearId = req.query.academicYearId || null;
        const sections = await ScheduleModel.findAllSections(academicYearId);

        return res.json({
            ok: true,
            data: sections,
            total: sections.length
        });
    } catch (error) {
        console.error("❌ Error en listSections:", error);
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
        const section = await ScheduleModel.findSectionById(id);

        if (!section) {
            return res.status(404).json({
                ok: false,
                msg: "Sección no encontrada"
            });
        }

        return res.json({
            ok: true,
            section
        });
    } catch (error) {
        console.error("❌ Error en getSection:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener sección",
            error: error.message
        });
    }
};

// En controllers/schedule.controller.js, modificar createSection:

const createSection = async (req, res) => {
    try {
        console.log('🎯 CONTROLADOR - req.body COMPLETO:', JSON.stringify(req.body, null, 2));
        const sectionData = req.body;

        console.log('📥 CONTROLLER - Datos recibidos del frontend:', sectionData);

        // Validar datos requeridos
        if (!sectionData.section_name) {
            return res.status(400).json({
                ok: false,
                msg: "El nombre de la sección es obligatorio"
            });
        }

        const academicYearId = sectionData.academic_year_id || sectionData.academicYearId;

        if (!academicYearId) {
            return res.status(400).json({
                ok: false,
                msg: "El año académico es obligatorio",
                receivedData: sectionData
            });
        }

        // ✅ IMPORTANTE: Incluir grade_level en los datos que envías al modelo
        const modelData = {
            section_name: sectionData.section_name,
            grade_level: sectionData.grade_level,  // ← AGREGAR ESTA LÍNEA
            capacity: sectionData.capacity || 30,
            subject_id: sectionData.subject_id || null,
            academic_year_id: academicYearId
        };

        console.log('📤 CONTROLLER - Enviando al modelo:', modelData);

        const newSection = await ScheduleModel.createSection(modelData);

        return res.status(201).json({
            ok: true,
            msg: "Sección creada correctamente",
            section: newSection
        });

    } catch (error) {
        console.error("❌ Error en createSection:", error);
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

        const updatedSection = await ScheduleModel.updateSection(id, sectionData);

        if (!updatedSection) {
            return res.status(404).json({
                ok: false,
                msg: "Sección no encontrada"
            });
        }

        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} actualizó sección ID ${id}`);

        return res.json({
            ok: true,
            msg: "Sección actualizada correctamente",
            section: updatedSection
        });
    } catch (error) {
        console.error("❌ Error en updateSection:", error);
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

        const result = await ScheduleModel.deleteSection(id);

        if (!result) {
            return res.status(404).json({
                ok: false,
                msg: "Sección no encontrada"
            });
        }

        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} eliminó sección ID ${id}`);

        return res.json({
            ok: true,
            msg: "Sección eliminada correctamente"
        });
    } catch (error) {
        console.error("❌ Error en deleteSection:", error);
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

const listSchedules = async (req, res) => {
    try {
        const filters = req.query;
        const schedules = await ScheduleModel.findAllSchedules(filters);

        return res.json({
            ok: true,
            schedules,
            total: schedules.length
        });
    } catch (error) {
        console.error("❌ Error en listSchedules:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar horarios",
            error: error.message
        });
    }
};

const createSchedule = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const scheduleData = { ...req.body, section_id: sectionId };

        // Validar datos requeridos
        if (!scheduleData.classroom_id || !scheduleData.teacher_id || !scheduleData.block_id || !scheduleData.day_id) {
            return res.status(400).json({
                ok: false,
                msg: "Faltan datos requeridos: aula, profesor, bloque y día son obligatorios"
            });
        }

        const newSchedule = await ScheduleModel.createSchedule(scheduleData);

        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} agregó horario a sección ${sectionId}`);

        return res.status(201).json({
            ok: true,
            msg: "Horario agregado correctamente",
            schedule: newSchedule
        });
    } catch (error) {
        console.error("❌ Error en createSchedule:", error);

        // Si es error de conflicto, devolver 409
        if (error.message.includes('Conflicto')) {
            return res.status(409).json({
                ok: false,
                msg: error.message
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error al agregar horario",
            error: error.message
        });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const scheduleData = req.body;

        const updatedSchedule = await ScheduleModel.updateSchedule(scheduleId, scheduleData);

        if (!updatedSchedule) {
            return res.status(404).json({
                ok: false,
                msg: "Horario no encontrado"
            });
        }

        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} actualizó horario ID ${scheduleId}`);

        return res.json({
            ok: true,
            msg: "Horario actualizado correctamente",
            schedule: updatedSchedule
        });
    } catch (error) {
        console.error("❌ Error en updateSchedule:", error);

        if (error.message.includes('Conflicto')) {
            return res.status(409).json({
                ok: false,
                msg: error.message
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error al actualizar horario",
            error: error.message
        });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const result = await ScheduleModel.deleteSchedule(scheduleId);

        if (!result) {
            return res.status(404).json({
                ok: false,
                msg: "Horario no encontrado"
            });
        }

        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} eliminó horario ID ${scheduleId}`);

        return res.json({
            ok: true,
            msg: "Horario eliminado correctamente"
        });
    } catch (error) {
        console.error("❌ Error en deleteSchedule:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al eliminar horario",
            error: error.message
        });
    }
};

// ============================================
// VALIDACIÓN DE DISPONIBILIDAD
// ============================================

const checkAvailability = async (req, res) => {
    try {
        const params = req.query;
        const result = await ScheduleModel.checkAvailability(params);

        return res.json({
            ok: true,
            ...result
        });
    } catch (error) {
        console.error("❌ Error en checkAvailability:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al verificar disponibilidad",
            error: error.message
        });
    }
};

// ============================================
// CATÁLOGOS
// ============================================

const listClassrooms = async (req, res) => {
    try {
        const classrooms = await ScheduleModel.getAllClassrooms();
        return res.json({
            ok: true,
            classrooms
        });
    } catch (error) {
        console.error("❌ Error en listClassrooms:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar aulas",
            error: error.message
        });
    }
};

const listDays = async (req, res) => {
    try {
        const days = await ScheduleModel.getAllDays();
        return res.json({
            ok: true,
            days
        });
    } catch (error) {
        console.error("❌ Error en listDays:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar días",
            error: error.message
        });
    }
};

const listBlocks = async (req, res) => {
    try {
        const blocks = await ScheduleModel.getAllBlocks();
        return res.json({
            ok: true,
            blocks
        });
    } catch (error) {
        console.error("❌ Error en listBlocks:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar bloques",
            error: error.message
        });
    }
};

// ============================================
// EXPORTAR CONTROLADOR
// ============================================

export const ScheduleController = {
    // Secciones
    listSections,
    getSection,
    createSection,
    updateSection,
    deleteSection,

    // Horarios
    listSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,

    // Validación
    checkAvailability,

    // Catálogos
    listClassrooms,
    listDays,
    listBlocks
};