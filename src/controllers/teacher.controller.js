// controllers/teacher.controller.js
import { TeacherModel } from "../models/teacher.model.js";
import { UserModel } from "../models/user.model.js";

// ============================================
// LISTAR TODOS LOS DOCENTES (acceso público autenticado)
// ============================================
const listTeachers = async (req, res) => {
    try {
        const teachers = await TeacherModel.findAll();
        
        // ✅ USAR Id_rol SIEMPRE (consistente con el token)
        // req.user.Id_rol = 1 (admin), 2 (docente), 3 (estudiante), 4 (representante)
        
        // Si es docente (Id_rol=2), solo ve información básica
        if (req.user.Id_rol === 2) {
            const sanitizedTeachers = teachers.map(t => ({
                id: t.id,
                first_name: t.first_name,
                last_name: t.last_name,
                specialty: t.specialty,
                grades: t.grades,
                teacher_id: t.teacher_id
                // No incluir email, teléfono, etc.
            }));
            return res.json({ ok: true, teachers: sanitizedTeachers });
        }
        
        return res.json({
            ok: true,
            teachers: teachers,
            total: teachers.length
        });
    } catch (error) {
        console.error("❌ Error en listTeachers:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar docentes",
            error: error.message
        });
    }
};

// ============================================
// OBTENER DOCENTE POR ID (CORREGIDO - CONSISTENTE)
// ============================================
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await TeacherModel.findById(id);
        
        if (!teacher) {
            return res.status(404).json({
                ok: false,
                msg: "Docente no encontrado"
            });
        }
        
        // ✅ VERIFICACIÓN CONSISTENTE: Usar Id_rol SIEMPRE
        // req.user.Id_rol = 1 (admin), 2 (docente), 3 (estudiante), 4 (representante)
        
        // Si es docente (Id_rol=2), solo puede ver su propio perfil
        if (req.user.Id_rol === 2 && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                ok: false,
                msg: "No puedes ver el perfil de otro docente"
            });
        }
        
        // Si es representante (4) o estudiante (3), solo ve información básica
        if (req.user.Id_rol === 3 || req.user.Id_rol === 4) {
            const sanitizedTeacher = {
                id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                specialty: teacher.specialty,
                grades: teacher.grades,
                teacher_id: teacher.teacher_id
                // No incluir datos de contacto
            };
            return res.json({ ok: true, teacher: sanitizedTeacher });
        }
        
        // Admin (1) y el propio docente (2 verificando propiedad) ven todo
        return res.json({
            ok: true,
            teacher
        });
    } catch (error) {
        console.error("❌ Error en getTeacherById:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener docente",
            error: error.message
        });
    }
};

// ============================================
// ASIGNAR ESPECIALIDAD (solo admin - ya verificado por middleware)
// ============================================
const assignSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const { specialty } = req.body;
        
        if (!specialty) {
            return res.status(400).json({
                ok: false,
                msg: "La especialidad es requerida"
            });
        }
        
        // Verificar que el usuario existe y es docente
        const user = await UserModel.findOneById(id);
        if (!user) {
            return res.status(404).json({
                ok: false,
                msg: "Usuario no encontrado"
            });
        }
        
        if (user.Id_rol !== 2) {
            return res.status(400).json({
                ok: false,
                msg: "El usuario no es un docente"
            });
        }
        
        const result = await TeacherModel.assignSpecialty(id, specialty);
        
        // LOG DE AUDITORÍA
        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} asignó especialidad "${specialty}" a docente ${id}`);
        
        return res.json({
            ok: true,
            msg: `Especialidad "${specialty}" asignada correctamente`,
            data: result
        });
    } catch (error) {
        console.error("❌ Error en assignSpecialty:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al asignar especialidad",
            error: error.message
        });
    }
};

// ============================================
// ASIGNAR GRADOS (solo admin)
// ============================================
const assignGrades = async (req, res) => {
    try {
        const { id } = req.params;
        const { gradeIds } = req.body;
        
        if (!gradeIds || !Array.isArray(gradeIds)) {
            return res.status(400).json({
                ok: false,
                msg: "Se requiere un array de IDs de grados"
            });
        }
        
        const result = await TeacherModel.assignGrades(id, gradeIds);
        
        // LOG DE AUDITORÍA
        console.log(`🔐 AUDITORÍA: Admin ${req.user.userId} asignó ${gradeIds.length} grado(s) a docente ${id}`);
        
        return res.json({
            ok: true,
            msg: `${gradeIds.length} grado(s) asignado(s) correctamente`,
            data: result
        });
    } catch (error) {
        console.error("❌ Error en assignGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al asignar grados",
            error: error.message
        });
    }
};

// ============================================
// LISTAR ESPECIALIDADES
// ============================================
const listSpecialties = async (req, res) => {
    try {
        const specialties = await TeacherModel.getAllSpecialties();
        return res.json({
            ok: true,
            specialties
        });
    } catch (error) {
        console.error("❌ Error en listSpecialties:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar especialidades",
            error: error.message
        });
    }
};

// ============================================
// LISTAR GRADOS
// ============================================
const listGrades = async (req, res) => {
    try {
        const grades = await TeacherModel.getAllGrades();
        return res.json({
            ok: true,
            grades
        });
    } catch (error) {
        console.error("❌ Error en listGrades:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al listar grados",
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR DOCENTE
// ============================================
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherData = req.body;
        
        const updatedTeacher = await TeacherModel.update(id, teacherData);
        
        if (!updatedTeacher) {
            return res.status(404).json({
                ok: false,
                msg: "Docente no encontrado"
            });
        }
        
        return res.json({
            ok: true,
            msg: "Docente actualizado correctamente",
            teacher: updatedTeacher
        });
    } catch (error) {
        console.error("❌ Error en updateTeacher:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al actualizar docente",
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR DOCENTE (DESACTIVAR)
// ============================================
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await TeacherModel.remove(id);
        
        if (!result) {
            return res.status(404).json({
                ok: false,
                msg: "Docente no encontrado"
            });
        }
        
        return res.json({
            ok: true,
            msg: "Docente desactivado correctamente",
            id: result.id
        });
    } catch (error) {
        console.error("❌ Error en deleteTeacher:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al eliminar docente",
            error: error.message
        });
    }
};

// ============================================
// OBTENER HORARIO DEL DOCENTE (CORREGIDO - CONSISTENTE)
// ============================================
const getMySchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ VERIFICACIÓN CONSISTENTE: Usar Id_rol
        // Solo admin (Id_rol=1) o el propio docente (Id_rol=2) pueden ver el horario
        if (req.user.Id_rol === 2 && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                ok: false,
                msg: "No puedes ver el horario de otro docente"
            });
        }
        
        const schedule = await TeacherModel.getSchedule(id);
        
        return res.json({
            ok: true,
            schedule
        });
    } catch (error) {
        console.error("❌ Error en getMySchedule:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener horario",
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTUDIANTES DEL DOCENTE (CORREGIDO - CONSISTENTE)
// ============================================
const getMyStudents = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ VERIFICACIÓN CONSISTENTE
        // Solo el propio docente (Id_rol=2) o admin (Id_rol=1) pueden ver sus estudiantes
        if (req.user.Id_rol !== 1 && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                ok: false,
                msg: "No puedes ver los estudiantes de otro docente"
            });
        }
        
        const students = await TeacherModel.getStudents(id);
        
        return res.json({
            ok: true,
            students
        });
    } catch (error) {
        console.error("❌ Error en getMyStudents:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener estudiantes",
            error: error.message
        });
    }
};

// ============================================
// EXPORTAR CONTROLADOR
// ============================================
export const TeacherController = {
    listTeachers,
    getTeacherById,
    assignSpecialty,
    assignGrades,
    updateTeacher,
    deleteTeacher,
    listSpecialties,
    listGrades,
    getMySchedule,
    getMyStudents
};