// Archivo: backend/controllers/boletin.controller.js

import { BoletinModel } from "../models/boletin.model.js";

// ============================================
// CONTROLADOR DE BOLETINES - ACTUALIZADO
// ============================================

const getBoletines = async (req, res) => {
  try {
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const boletines = await BoletinModel.findByYearId(academicYearId);

    return res.json({
      ok: true,
      data: boletines
    });
  } catch (error) {
    console.error("Error en getBoletines:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener boletines",
      error: error.message
    });
  }
};

const updateBoletin = async (req, res) => {
  try {
    const { id } = req.params;
    const { disponible } = req.body;

    if (disponible === undefined) {
      return res.status(400).json({
        ok: false,
        msg: "El estado 'disponible' es requerido"
      });
    }

    const result = await BoletinModel.toggleDisponible(id, disponible);

    if (!result) {
      return res.status(404).json({
        ok: false,
        msg: "Boletín no encontrado"
      });
    }

    return res.json({
      ok: true,
      msg: `Boletín ${disponible ? 'habilitado' : 'deshabilitado'} correctamente`,
      data: result
    });
  } catch (error) {
    console.error("Error en updateBoletin:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar boletín",
      error: error.message
    });
  }
};

const habilitarTodos = async (req, res) => {
  try {
    const { academicYearId } = req.body;

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const result = await BoletinModel.habilitarTodos(academicYearId);

    return res.json({
      ok: true,
      msg: `${result.actualizados} boletines habilitados correctamente`,
      data: result
    });
  } catch (error) {
    console.error("Error en habilitarTodos:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al habilitar todos los boletines",
      error: error.message
    });
  }
};

const incrementarDescarga = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await BoletinModel.incrementarDescarga(id);

    return res.json({
      ok: true,
      msg: "Descarga registrada",
      data: result
    });
  } catch (error) {
    console.error("Error en incrementarDescarga:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al registrar descarga",
      error: error.message
    });
  }
};

const generarBoletines = async (req, res) => {
  try {
    const { studentIds, academicYearId, gradeId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        ok: false,
        msg: "Se requiere una lista de IDs de estudiantes"
      });
    }

    if (!academicYearId) {
      return res.status(400).json({
        ok: false,
        msg: "El ID del año académico es requerido"
      });
    }

    const resultados = [];
    for (const studentId of studentIds) {
      const resultado = await BoletinModel.generarBoletin(studentId, academicYearId, gradeId);
      resultados.push(resultado);
    }

    return res.json({
      ok: true,
      msg: `${resultados.length} boletines generados correctamente`,
      data: resultados
    });

  } catch (error) {
    console.error("Error en generarBoletines:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al generar boletines",
      error: error.message
    });
  }
};

export const BoletinController = {
  getBoletines,
  updateBoletin,
  habilitarTodos,
  incrementarDescarga,
  generarBoletines
};