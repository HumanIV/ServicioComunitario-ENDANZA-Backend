// backend/controllers/representante.controller.js
import { RepresentanteModel } from "../models/representante.model.js";
import { db } from "../db/connection.database.js";

export const RepresentanteController = {
  // Crear representante desde preinscripción (o agregar estudiantes a existente)
  createFromPreinscripcion: async (req, res) => {
    try {
      const {
        dni, first_name, last_name, phone, email,
        parentesco, parentesco_otro, direccion,
        estudiantes, // Array de estudiantes
        id_representante, // Si viene, es un representante existente
        password // 🔐 RECIBIR CONTRASEÑA DEL FRONTEND
      } = req.body;

      console.log("📝 Recibida preinscripción:", { 
        dni, email, parentesco, estudiantesCount: estudiantes?.length,
        esExistente: !!id_representante,
        tienePassword: !!password
      });

      // Validaciones básicas
      if (!dni || !first_name || !last_name || !email || !parentesco) {
        return res.status(400).json({
          ok: false,
          msg: "Faltan datos obligatorios del representante"
        });
      }

      let representante;
      let esNuevoRepresentante = false;

      // CASO 1: Buscar si ya existe por cédula
      const existing = await RepresentanteModel.findByCedula(dni);
      
      if (existing) {
        // Representante EXISTENTE - solo usamos sus datos
        console.log("✅ Representante existente encontrado:", existing.id_representante);
        representante = {
          id_representante: existing.id_representante,
          id_usuario: existing.id_usuario,
          dni: existing.dni,
          first_name: existing.first_name,
          last_name: existing.last_name,
          email: existing.email,
          phone: existing.phone
        };
        esNuevoRepresentante = false;
      } else {
        // CASO 2: Representante NUEVO - crear usuario + representante
        console.log("🆕 Creando nuevo representante...");
        
        // Validar que la contraseña exista para nuevos representantes
        if (!password) {
          return res.status(400).json({
            ok: false,
            msg: "La contraseña es obligatoria para nuevos representantes"
          });
        }
        
        if (password.length < 4) {
          return res.status(400).json({
            ok: false,
            msg: "La contraseña debe tener al menos 4 caracteres"
          });
        }

        representante = await RepresentanteModel.create({
          dni, 
          first_name, 
          last_name, 
          phone, 
          email,
          parentesco, 
          parentesco_otro, 
          direccion,
          password // ✅ AHORA SÍ SE ENVÍA LA CONTRASEÑA
        });
        esNuevoRepresentante = true;
        console.log("✅ Nuevo representante creado:", representante.id_representante);
      }

      // Crear estudiantes asociados (tanto para nuevo como existente)
      const estudiantesCreados = [];
      if (estudiantes && estudiantes.length > 0) {
        for (const estudiante of estudiantes) {
          // Mapear grado a Id_nivel
          let Id_nivel = null;
          const gradoMap = {
            '1er Grado': 1,
            '2do Grado': 2,
            '3er Grado': 3,
            '4to Grado': 4,
            '5to Grado': 5,
            '6to Grado': 6
          };
          
          if (estudiante.gradeLevel) {
            Id_nivel = gradoMap[estudiante.gradeLevel] || 1;
          }

          // Generar cédula única para el estudiante
          const cedulaEstudiante = `E${Date.now()}${Math.floor(Math.random()*1000)}`;

          // Crear estudiante con el ID del representante
          const studentQuery = {
            text: `
              INSERT INTO "Estudiante" (
                "nombre", "apellido", "cedula", "fecha_nacimiento", "genero",
                "seguro_escolar", "Id_nivel", "Id_nivel_danza", "Id_representante"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING 
                "Id_estudiante" as id,
                "nombre" as first_name,
                "apellido" as last_name,
                "cedula" as dni
            `,
            values: [
              estudiante.name,
              estudiante.lastName,
              cedulaEstudiante,
              estudiante.birthDate,
              estudiante.gender,
              true, // seguro_escolar por defecto
              Id_nivel,
              Id_nivel,
              representante.id_representante
            ]
          };

          const result = await db.query(studentQuery.text, studentQuery.values);
          
          estudiantesCreados.push({
            ...result.rows[0],
            gradeLevel: estudiante.gradeLevel
          });
        }
      }

      // Preparar respuesta
      const response = {
        ok: true,
        msg: esNuevoRepresentante 
          ? "Representante y estudiantes registrados exitosamente"
          : "Estudiantes agregados al representante existente",
        representante: {
          id_representante: representante.id_representante,
          id_usuario: representante.id_usuario,
          dni: representante.dni,
          first_name: representante.first_name,
          last_name: representante.last_name,
          email: representante.email,
          phone: representante.phone,
          parentesco: parentesco,
          parentesco_otro: parentesco_otro
        },
        estudiantes: estudiantesCreados
      };

      // Solo incluir credenciales si es NUEVO representante
      if (esNuevoRepresentante && representante.plainPassword) {
        response.representante.credenciales = {
          email: representante.email,
          password: representante.plainPassword
        };
        response.msg = response.msg + " - Las credenciales se muestran una sola vez";
      } else {
        response.msg = response.msg + " - Las credenciales existentes no han sido modificadas";
      }

      res.status(201).json(response);

    } catch (error) {
      console.error("❌ Error en createFromPreinscripcion:", error);
      res.status(500).json({
        ok: false,
        msg: "Error al procesar la preinscripción",
        error: error.message
      });
    }
  },

  // Buscar representantes
  searchRepresentantes: async (req, res) => {
    try {
      const { term } = req.query;
      
      if (!term || term.length < 2) {
        return res.json({
          ok: true,
          representantes: []
        });
      }

      const representantes = await RepresentanteModel.search(term);

      res.json({
        ok: true,
        representantes
      });

    } catch (error) {
      console.error("Error en searchRepresentantes:", error);
      res.status(500).json({
        ok: false,
        msg: "Error al buscar representantes",
        error: error.message
      });
    }
  },

  // Obtener representante con sus estudiantes
  getRepresentanteConEstudiantes: async (req, res) => {
    try {
      const { id } = req.params;
      
      const representante = await RepresentanteModel.findById(id);
      if (!representante) {
        return res.status(404).json({
          ok: false,
          msg: "Representante no encontrado"
        });
      }

      const estudiantes = await RepresentanteModel.getEstudiantes(id);

      res.json({
        ok: true,
        representante,
        estudiantes
      });

    } catch (error) {
      console.error("Error en getRepresentanteConEstudiantes:", error);
      res.status(500).json({
        ok: false,
        msg: "Error al obtener datos",
        error: error.message
      });
    }
  },



  // Listar todos los representantes
listRepresentantes: async (req, res) => {
  try {
    console.log("📋 Listando todos los representantes...");
    
    const representantes = await RepresentanteModel.list();

    res.json({
      ok: true,
      representantes,
      total: representantes.length
    });

  } catch (error) {
    console.error("Error en listRepresentantes:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al listar representantes",
      error: error.message
    });
  }
},

};