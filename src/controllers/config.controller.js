import { ConfigModel } from "../models/config.model.js";

// ============================================
// CONTROLADOR DE CONFIGURACIÓN
// ============================================

// ============================================
// AÑOS ACADÉMICOS
// ============================================

const getAcademicYears = async (req, res) => {
  try {
    const years = await ConfigModel.findAllAcademicYears();
    
    return res.json({
      ok: true,
      data: years,
    });
  } catch (error) {
    console.error("Error en getAcademicYears:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener años académicos",
      error: error.message,
    });
  }
};

const getActiveAcademicYear = async (req, res) => {
  try {
    const activeYear = await ConfigModel.findActiveAcademicYear();
    
    return res.json({
      ok: true,
      data: activeYear,
    });
  } catch (error) {
    console.error("Error en getActiveAcademicYear:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener año activo",
      error: error.message,
    });
  }
};

const createAcademicYear = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        msg: "El nombre del año es requerido (formato: YYYY-YYYY)",
      });
    }

    // Validar formato YYYY-YYYY
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(name)) {
      return res.status(400).json({
        ok: false,
        msg: "Formato inválido. Debe ser YYYY-YYYY (ej: 2025-2026)",
      });
    }

    const [startYear, endYear] = name.split('-');
    
    // Verificar que el año de inicio sea menor que el de fin
    if (parseInt(startYear) >= parseInt(endYear)) {
      return res.status(400).json({
        ok: false,
        msg: "El año de inicio debe ser menor que el año de fin",
      });
    }

    // Fechas por defecto: inicio 1 de septiembre, fin 15 de julio
    const startDate = `${startYear}-09-01`;
    const endDate = `${endYear}-07-15`;

    const newYear = await ConfigModel.createAcademicYear(name, startDate, endDate);

    return res.status(201).json({
      ok: true,
      msg: "Año académico creado exitosamente",
      data: newYear,
    });
  } catch (error) {
    console.error("Error en createAcademicYear:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear año académico",
      error: error.message,
    });
  }
};

// ============================================
// PERÍODO DE INSCRIPCIÓN
// ============================================

const getEnrollmentPeriod = async (req, res) => {
  try {
    const { yearId } = req.params;

    if (!yearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año es requerido",
      });
    }

    const period = await ConfigModel.findEnrollmentPeriodByYearId(yearId);

    if (!period) {
      return res.status(404).json({
        ok: false,
        msg: "No hay configuración de inscripción para este año",
      });
    }

    return res.json({
      ok: true,
      data: period,
    });
  } catch (error) {
    console.error("Error en getEnrollmentPeriod:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener período de inscripción",
      error: error.message,
    });
  }
};

const updateEnrollmentPeriod = async (req, res) => {
  try {
    const { yearId } = req.params;
    const { fechaInicio, fechaFin, activo } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        ok: false,
        msg: "Las fechas de inicio y fin son requeridas",
      });
    }

    // Validar que fechaFin sea posterior a fechaInicio
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      return res.status(400).json({
        ok: false,
        msg: "La fecha de fin debe ser posterior a la fecha de inicio",
      });
    }

    const updated = await ConfigModel.updateEnrollmentPeriod(yearId, {
      fechaInicio,
      fechaFin,
      activo: activo || false,
    });

    return res.json({
      ok: true,
      msg: "Período de inscripción actualizado",
      data: updated,
    });
  } catch (error) {
    console.error("Error en updateEnrollmentPeriod:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar período de inscripción",
      error: error.message,
    });
  }
};

// ============================================
// PERÍODO DE SUBIDA DE NOTAS
// ============================================

const getGradesPeriod = async (req, res) => {
  try {
    const { yearId } = req.params;

    if (!yearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año es requerido",
      });
    }

    const period = await ConfigModel.findGradesPeriodByYearId(yearId);

    if (!period) {
      return res.status(404).json({
        ok: false,
        msg: "No hay configuración de subida de notas para este año",
      });
    }

    return res.json({
      ok: true,
      data: period,
    });
  } catch (error) {
    console.error("Error en getGradesPeriod:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener período de subida de notas",
      error: error.message,
    });
  }
};

const updateGradesPeriod = async (req, res) => {
  try {
    const { yearId } = req.params;
    const { fechaInicio, fechaFin, activo } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        ok: false,
        msg: "Las fechas de inicio y fin son requeridas",
      });
    }

    // Validar que fechaFin sea posterior a fechaInicio
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      return res.status(400).json({
        ok: false,
        msg: "La fecha de fin debe ser posterior a la fecha de inicio",
      });
    }

    const updated = await ConfigModel.updateGradesPeriod(yearId, {
      fechaInicio,
      fechaFin,
      activo: activo || false,
    });

    return res.json({
      ok: true,
      msg: "Período de subida de notas actualizado",
      data: updated,
    });
  } catch (error) {
    console.error("Error en updateGradesPeriod:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar período de subida de notas",
      error: error.message,
    });
  }
};

// ============================================
// EXPORTAR CONTROLADOR
// ============================================
export const ConfigController = {
  // Años académicos
  getAcademicYears,
  getActiveAcademicYear,
  createAcademicYear,
  
  // Período de inscripción
  getEnrollmentPeriod,
  updateEnrollmentPeriod,
  
  // Período de subida de notas
  getGradesPeriod,
  updateGradesPeriod,
};