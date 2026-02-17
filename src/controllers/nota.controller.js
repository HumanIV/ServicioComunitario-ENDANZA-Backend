// Archivo: backend/controllers/nota.controller.js

import { NotaModel } from "../models/nota.model.js";

// ============================================
// CONTROLADOR DE NOTAS
// ============================================

const getPendientes = async (req, res) => {
  try {
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const notas = await NotaModel.findPendientesByYearId(academicYearId);

    return res.json({
      ok: true,
      data: notas
    });
  } catch (error) {
    console.error("Error en getPendientes:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener notas pendientes",
      error: error.message
    });
  }
};

const aprobarNota = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NotaModel.aprobar(id);

    if (!result) {
      return res.status(404).json({
        ok: false,
        msg: "Nota no encontrada"
      });
    }

    return res.json({
      ok: true,
      msg: "Nota aprobada correctamente",
      data: result
    });
  } catch (error) {
    console.error("Error en aprobarNota:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al aprobar nota",
      error: error.message
    });
  }
};

const rechazarNota = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NotaModel.rechazar(id);

    if (!result) {
      return res.status(404).json({
        ok: false,
        msg: "Nota no encontrada"
      });
    }

    return res.json({
      ok: true,
      msg: "Nota rechazada correctamente",
      data: result
    });
  } catch (error) {
    console.error("Error en rechazarNota:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al rechazar nota",
      error: error.message
    });
  }
};

const aprobarTodas = async (req, res) => {
  try {
    const { academicYearId } = req.body;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const result = await NotaModel.aprobarTodas(academicYearId);

    return res.json({
      ok: true,
      msg: `${result.actualizadas} notas aprobadas correctamente`,
      data: result
    });
  } catch (error) {
    console.error("Error en aprobarTodas:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al aprobar todas las notas",
      error: error.message
    });
  }
};

const verificarPendientes = async (req, res) => {
  try {
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const result = await NotaModel.verificarPendientes(academicYearId);

    return res.json({
      ok: true,
      data: result
    });
  } catch (error) {
    console.error("Error en verificarPendientes:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al verificar notas pendientes",
      error: error.message
    });
  }
};


const getTeacherAllocations = async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const allocations = await NotaModel.findTeacherAllocations(teacherUserId, academicYearId);

    // Agrupar por materia/sección para facilitar el frontend
    // O devolver plano y que el frontend agrupe. Devolveremos plano por ahora.

    return res.json({
      ok: true,
      data: allocations
    });
  } catch (error) {
    console.error("Error en getTeacherAllocations:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener carga académica del docente",
      error: error.message
    });
  }
};

const saveCompetenciaGrade = async (req, res) => {
  try {
    const { studentId, competenceId, score, observation, evaluationStructureId } = req.body;

    // Validación básica
    if (!studentId || !competenceId || score === undefined || !evaluationStructureId) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos requeridos (studentId, competenceId, score, evaluationStructureId)"
      });
    }

    const result = await NotaModel.saveCompetenciaNota(studentId, competenceId, score, observation, evaluationStructureId);

    return res.json({
      ok: true,
      msg: "Nota guardada correctamente",
      data: result
    });
  } catch (error) {
    console.error("Error en saveCompetenciaGrade:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al guardar la nota",
      error: error.message
    });
  }
};


const getSectionStudents = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID de la sección es requerido"
      });
    }

    const students = await NotaModel.getSectionStudents(sectionId);

    return res.json({
      ok: true,
      data: students
    });
  } catch (error) {
    console.error("Error en getSectionStudents:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener estudiantes de la sección",
      error: error.message
    });
  }
};


const saveGradesBatch = async (req, res) => {
  try {
    const { sectionId, grades } = req.body;

    if (!sectionId || !grades) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos requeridos (sectionId, grades)"
      });
    }

    // grades es un objeto { studentId: { n1: val, ... } }
    await NotaModel.saveGradesBatch(sectionId, grades);

    return res.json({
      ok: true,
      msg: "Notas guardadas correctamente en lote"
    });
  } catch (error) {
    console.error("Error en saveGradesBatch:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al guardar notas en lote",
      error: error.message
    });
  }
};

export const NotaController = {
  getPendientes,
  aprobarNota,
  rechazarNota,
  aprobarTodas,
  verificarPendientes,
  getTeacherAllocations,
  saveCompetenciaGrade,
  getSectionStudents,
  saveGradesBatch
};