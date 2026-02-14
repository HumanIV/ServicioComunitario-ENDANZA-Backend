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

export const NotaController = {
  getPendientes,
  aprobarNota,
  rechazarNota,
  aprobarTodas,
  verificarPendientes
};