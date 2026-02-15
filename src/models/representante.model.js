// backend/models/representante.model.js
import { db } from "../db/connection.database.js";
import bcryptjs from "bcryptjs";

export const RepresentanteModel = {
  // Crear representante con usuario simplificado
  create: async (data) => {
    const {
      dni, first_name, last_name, phone, email,
      parentesco, parentesco_otro, direccion,
      password // 🔐 RECIBIR CONTRASEÑA DEL FRONTEND
    } = data;

    try {
      // 1. Hashear la contraseña proporcionada
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      // 2. Iniciar transacción
      await db.query('BEGIN');

      // 3. Insertar en tabla Usuario (con rol representante = 4)
      const userQuery = {
        text: `
          INSERT INTO "Usuario" (
            "cedula", "nombre", "apellido", "clave", "telefono", "correo",
            "username", "Id_rol", "estatus_usuario", "creado_en"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
          RETURNING "Id_usuario" as id
        `,
        values: [
          dni, 
          first_name, 
          last_name, 
          hashedPassword, 
          phone || null, 
          email,
          email.split('@')[0] || `rep_${dni}`, 
          4, // Rol Representante
          'activo'
        ]
      };
      
      const userResult = await db.query(userQuery.text, userQuery.values);
      const usuarioId = userResult.rows[0].id;

      // 4. Insertar en tabla Representante
      const repQuery = {
        text: `
          INSERT INTO "Representante" (
            "Id_usuario", "es_familiar", "profesion_rep", "direccion_trabajo_rep"
          ) VALUES ($1, $2, $3, $4)
          RETURNING "Id_representante" as id
        `,
        values: [
          usuarioId,
          parentesco !== 'Otro', // es_familiar = true si es Madre/Padre
          null, // profesion_rep (opcional)
          direccion || null // direccion_trabajo_rep
        ]
      };
      
      const repResult = await db.query(repQuery.text, repQuery.values);

      await db.query('COMMIT');

      return {
        id_representante: repResult.rows[0].id,
        id_usuario: usuarioId,
        dni,
        first_name,
        last_name,
        phone,
        email,
        parentesco,
        parentesco_otro,
        plainPassword: password // Devolver la contraseña original para mostrarla (solo una vez)
      };

    } catch (error) {
      await db.query('ROLLBACK');
      console.error("❌ Error creando representante:", error);
      throw error;
    }
  },

  // Buscar representante por cédula
  findByCedula: async (cedula) => {
    try {
      const query = {
        text: `
          SELECT 
            u."Id_usuario" as id_usuario,
            r."Id_representante" as id_representante,
            u."cedula" as dni,
            u."nombre" as first_name,
            u."apellido" as last_name,
            u."telefono" as phone,
            u."correo" as email,
            r."es_familiar",
            r."profesion_rep",
            r."direccion_trabajo_rep" as direccion,
            u."estatus_usuario" as status
          FROM "Usuario" u
          INNER JOIN "Representante" r ON u."Id_usuario" = r."Id_usuario"
          WHERE u."cedula" = $1 AND u."Id_rol" = 4
        `,
        values: [cedula]
      };
      
      const { rows } = await db.query(query.text, query.values);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        id_representante: row.id_representante,
        id_usuario: row.id_usuario,
        dni: row.dni,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.email,
        parentesco: row.es_familiar ? 'Familiar' : 'Otro',
        direccion: row.direccion,
        status: row.status
      };
    } catch (error) {
      console.error("Error en findByCedula:", error);
      throw error;
    }
  },

  // Buscar por email
  findByEmail: async (email) => {
    try {
      const query = {
        text: `
          SELECT 
            u."Id_usuario" as id_usuario,
            r."Id_representante" as id_representante,
            u."cedula" as dni,
            u."nombre" as first_name,
            u."apellido" as last_name,
            u."telefono" as phone,
            u."correo" as email,
            r."es_familiar"
          FROM "Usuario" u
          INNER JOIN "Representante" r ON u."Id_usuario" = r."Id_usuario"
          WHERE u."correo" = $1 AND u."Id_rol" = 4
        `,
        values: [email]
      };
      
      const { rows } = await db.query(query.text, query.values);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        parentesco: row.es_familiar ? 'Familiar' : 'Otro'
      };
    } catch (error) {
      console.error("Error en findByEmail:", error);
      throw error;
    }
  },

  // Buscar representantes por término
  search: async (term) => {
    try {
      const query = {
        text: `
          SELECT 
            u."Id_usuario" as id_usuario,
            r."Id_representante" as id_representante,
            u."cedula" as dni,
            u."nombre" as first_name,
            u."apellido" as last_name,
            u."telefono" as phone,
            u."correo" as email
          FROM "Usuario" u
          INNER JOIN "Representante" r ON u."Id_usuario" = r."Id_usuario"
          WHERE u."Id_rol" = 4
            AND (
              u."nombre" ILIKE $1 OR
              u."apellido" ILIKE $1 OR
              u."cedula" ILIKE $1 OR
              u."correo" ILIKE $1
            )
          ORDER BY u."apellido", u."nombre"
          LIMIT 20
        `,
        values: [`%${term}%`]
      };
      
      const { rows } = await db.query(query.text, query.values);
      return rows;
    } catch (error) {
      console.error("Error en search:", error);
      throw error;
    }
  },

  // Obtener estudiantes asociados a un representante
  getEstudiantes: async (representanteId) => {
    try {
      const query = {
        text: `
          SELECT 
            e."Id_estudiante" as id,
            e."nombre" as first_name,
            e."apellido" as last_name,
            e."cedula" as dni,
            e."fecha_nacimiento" as birth_date,
            e."genero" as gender,
            nl."nivel" as grade_level,
            nd."nivel_danza" as dance_level,
            e."seguro_escolar" as school_insurance
          FROM "Estudiante" e
          LEFT JOIN "Nivel_Escolar" nl ON e."Id_nivel" = nl."Id_nivel"
          LEFT JOIN "Nivel_Danza" nd ON e."Id_nivel_danza" = nd."Id_nivel_danza"
          WHERE e."Id_representante" = $1
        `,
        values: [representanteId]
      };
      
      const { rows } = await db.query(query.text, query.values);
      return rows;
    } catch (error) {
      console.error("Error en getEstudiantes:", error);
      throw error;
    }
  },

  // Buscar representante por ID
  findById: async (id) => {
    try {
      const query = {
        text: `
          SELECT 
            u."Id_usuario" as id_usuario,
            r."Id_representante" as id_representante,
            u."cedula" as dni,
            u."nombre" as first_name,
            u."apellido" as last_name,
            u."telefono" as phone,
            u."correo" as email,
            r."es_familiar",
            r."profesion_rep",
            r."direccion_trabajo_rep" as direccion,
            u."estatus_usuario" as status
          FROM "Usuario" u
          INNER JOIN "Representante" r ON u."Id_usuario" = r."Id_usuario"
          WHERE r."Id_representante" = $1
        `,
        values: [id]
      };
      
      const { rows } = await db.query(query.text, query.values);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        parentesco: row.es_familiar ? 'Familiar' : 'Otro'
      };
    } catch (error) {
      console.error("Error en findById:", error);
      throw error;
    }
  },



  // Listar TODOS los representantes
list: async () => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id_usuario,
          r."Id_representante" as id_representante,
          u."cedula" as dni,
          u."nombre" as first_name,
          u."apellido" as last_name,
          u."telefono" as phone,
          u."correo" as email,
          u."estatus_usuario" as status
        FROM "Usuario" u
        INNER JOIN "Representante" r ON u."Id_usuario" = r."Id_usuario"
        WHERE u."Id_rol" = 4
        ORDER BY u."apellido", u."nombre"
      `
    };
    
    const { rows } = await db.query(query.text);
    return rows;
  } catch (error) {
    console.error("Error en list:", error);
    throw error;
  }
},
};