// controllers/grade.controller.js
import { GradeModel } from "../models/grade.model.js";

// ============================================
// CONTROLADOR DE NOTAS
// ============================================

/**
 * Guarda las notas de una sección
 */
const saveGrades = async (req, res) => {
    try {
        const { sectionId, grades, academicYearId } = req.body;
        
        if (!sectionId || !grades) {
            return res.status(400).json({
                ok: false,
                msg: "Faltan datos requeridos: sectionId y grades"
            });
        }
        
        const results = await GradeModel.saveGrades({ sectionId, grades, academicYearId });
        
        console.log(`📝 NOTAS GUARDADAS: Usuario ${req.user.userId} guardó notas en sección ${sectionId}`);
        
        return res.json({
            ok: true,
            msg: "Notas guardadas correctamente",
            data: results
        });
        
    } catch (error) {
        console.error("❌ Error en saveGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al guardar las notas",
            error: error.message
        });
    }
};

/**
 * Obtiene todas las notas de una sección
 */
const getSectionGrades = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const grades = await GradeModel.getGradesBySection(sectionId);
        
        return res.json({
            ok: true,
            data: grades
        });
        
    } catch (error) {
        console.error("❌ Error en getSectionGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener las notas",
            error: error.message
        });
    }
};

/**
 * Obtiene los estudiantes de una sección
 */
const getSectionStudents = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const students = await GradeModel.getStudentsBySection(sectionId);
        
        return res.json({
            ok: true,
            data: students
        });
        
    } catch (error) {
        console.error("❌ Error en getSectionStudents:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener los estudiantes",
            error: error.message
        });
    }
};

/**
 * Obtiene la estructura de evaluaciones de una sección
 */
const getEvaluationStructure = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const structure = await GradeModel.getEvaluationStructure(sectionId);
        
        return res.json({
            ok: true,
            data: structure
        });
        
    } catch (error) {
        console.error("❌ Error en getEvaluationStructure:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener estructura de evaluaciones",
            error: error.message
        });
    }
};

/**
 * Obtiene las notas de un estudiante específico
 */
const getStudentGrades = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const grades = await GradeModel.getStudentGrades(studentId);
        
        return res.json({
            ok: true,
            data: grades
        });
        
    } catch (error) {
        console.error("❌ Error en getStudentGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener notas del estudiante",
            error: error.message
        });
    }
};

/**
 * Exporta las notas de una sección (para reportes)
 */
const exportSectionGrades = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const grades = await GradeModel.getGradesBySection(sectionId);
        const students = await GradeModel.getStudentsBySection(sectionId);
        const structure = await GradeModel.getEvaluationStructure(sectionId);
        
        // Formato para exportación
        const exportData = {
            sectionId,
            students: students.map(s => ({
                id: s.id,
                name: s.full_name,
                grades: grades.filter(g => g.student_id === s.id)
            })),
            evaluationStructure: structure
        };
        
        return res.json({
            ok: true,
            data: exportData
        });
        
    } catch (error) {
        console.error("❌ Error en exportSectionGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al exportar notas",
            error: error.message
        });
    }
};

export const GradeController = {
    saveGrades,
    getSectionGrades,
    getSectionStudents,
    getEvaluationStructure,
    getStudentGrades,
    exportSectionGrades
};