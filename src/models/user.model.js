import { db } from "../db/connection.database.js";
import bcryptjs from "bcryptjs";

// ============================================
// FUNCIÓN PARA MIGRAR PASSWORD AUTOMÁTICAMENTE
// ============================================
const migratePasswordToHash = async (userId, plainPassword) => {
  try {
    console.log(`🔄 MIGRATE - Migrando password a hash para usuario ${userId}`);
    
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(plainPassword, salt);
    
    const query = {
      text: `
        UPDATE "Usuario"
        SET "clave" = $1,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $2
      `,
      values: [hashedPassword, userId],
    };
    
    await db.query(query.text, query.values);
    console.log(`✅ MIGRATE - Password migrado exitosamente para usuario ${userId}`);
    
    return hashedPassword;
  } catch (error) {
    console.error(`❌ MIGRATE - Error migrando password usuario ${userId}:`, error);
    throw error;
  }
};

// ============================================
// FUNCIÓN PARA MIGRAR TODOS LOS PASSWORDS
// ============================================
const migrateAllPasswords = async () => {
  try {
    console.log("🚀 MIGRATE ALL - Iniciando migración de todos los passwords...");
    
    // Obtener todos los usuarios con passwords en texto plano
    const query = {
      text: `
        SELECT "Id_usuario", "clave", "username", "correo" 
        FROM "Usuario" 
        WHERE "clave" IS NOT NULL 
        AND "clave" != '' 
        AND "clave" NOT LIKE '$2%'
      `
    };
    
    const { rows } = await db.query(query.text);
    
    console.log(`📊 MIGRATE ALL - Encontrados ${rows.length} usuarios para migrar`);
    
    let migrated = 0;
    let errors = 0;
    const results = [];
    
    for (const user of rows) {
      try {
        if (!user.clave || user.clave.trim() === '') {
          console.log(`⚠️ Usuario ${user.Id_usuario} tiene password vacío, omitiendo`);
          continue;
        }
        
        console.log(`🔄 Migrando usuario ${user.Id_usuario} (${user.username || user.correo})`);
        
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(user.clave, salt);
        
        const updateQuery = {
          text: `UPDATE "Usuario" SET "clave" = $1 WHERE "Id_usuario" = $2`,
          values: [hashedPassword, user.Id_usuario]
        };
        
        await db.query(updateQuery.text, updateQuery.values);
        migrated++;
        
        results.push({
          id: user.Id_usuario,
          username: user.username || user.correo,
          status: 'success'
        });
        
        console.log(`✅ Migrado usuario ${user.Id_usuario}`);
        
      } catch (error) {
        errors++;
        results.push({
          id: user.Id_usuario,
          username: user.username || user.correo,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error migrando usuario ${user.Id_usuario}:`, error.message);
      }
    }
    
    console.log(`🎉 MIGRATE ALL - Migración completada: ${migrated} exitosos, ${errors} errores`);
    
    return {
      migrated,
      errors,
      total: rows.length,
      results
    };
    
  } catch (error) {
    console.error("❌ MIGRATE ALL - Error general:", error);
    throw error;
  }
};

const create = async ({
  username,
  email,
  password,
  Id_rol,
  security_word,
  respuesta_de_seguridad,
  nombre,
  apellido,
  cedula,
  telefono,
  fecha_nacimiento,
  genero,
  foto_usuario,
  Id_direccion
}) => {
  try {
    console.log("🔍 CREATE - Creando usuario con datos:", {
      username,
      email,
      passwordLength: password?.length || 0,
      Id_rol,
      nombre,
      apellido,
      cedula
    });

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    console.log("🔍 CREATE - Password hasheado. Longitud:", hashedPassword.length);
    console.log("🔍 CREATE - Formato hash:", hashedPassword.substring(0, 10) + "...");

    const query = {
      text: `
        INSERT INTO "Usuario" (
          "cedula", "nombre", "apellido", "clave", "telefono", "correo",
          "fecha_nacimiento", "genero", "foto_usuario", "estatus_usuario",
          "creado_en", "actualizado_en", "Id_rol", "Id_direccion",
          "username", "security_word", "respuesta_de_seguridad",
          "email_verified"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'activo',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10, $11,
                $12, $13, $14, false)
        RETURNING 
          "Id_usuario" as id, 
          "username", 
          "correo" as email, 
          "nombre", 
          "apellido", 
          "cedula", 
          "telefono",
          "fecha_nacimiento",
          "genero",
          "foto_usuario",
          "estatus_usuario" as is_active,
          "creado_en" as created_at,
          "actualizado_en" as updated_at,
          "Id_rol",
          "Id_direccion",
          "email_verified"
      `,
      values: [
        cedula, 
        nombre, 
        apellido, 
        hashedPassword,
        telefono, 
        email,
        fecha_nacimiento, 
        genero, 
        foto_usuario, 
        Id_rol, 
        Id_direccion,
        username || email, 
        security_word, 
        respuesta_de_seguridad
      ],
    };
    
    console.log("🔍 CREATE - Ejecutando query con valores:", query.values.length, "parámetros");
    
    const { rows } = await db.query(query.text, query.values);
    
    console.log("✅ CREATE - Usuario creado exitosamente:", rows[0].id);
    
    return rows[0];
  } catch (error) {
    console.error("❌ CREATE - Error creando usuario:", error);
    console.error("❌ CREATE - Detalle del error:", error.message);
    throw error;
  }
};

const findOneByEmail = async (email) => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."clave" as password,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."fecha_nacimiento",
          u."genero",
          u."foto_usuario",
          u."security_word",
          u."respuesta_de_seguridad",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."Id_direccion",
          u."password_reset_token",
          u."password_reset_expires",
          u."email_verification_token",
          u."last_login",
          u."creado_en" as created_at,
          u."actualizado_en" as updated_at,
          r."tipo_rol",
          d."nombre_direccion",
          d."Id_ciudad",
          ci."nombre_ciudad",
          ci."Id_parroquia",
          p."nombre_parroquia",
          p."Id_municipio",
          m."nombre_municipio",
          m."Id_estado",
          e."nombre_estado",
          e."Id_pais",
          pa."nombre_pais"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        LEFT JOIN "Direccion" d ON u."Id_direccion" = d."Id_direccion"
        LEFT JOIN "Ciudad" ci ON d."Id_ciudad" = ci."Id_ciudad"
        LEFT JOIN "Parroquia" p ON ci."Id_parroquia" = p."Id_parroquia"
        LEFT JOIN "Municipio" m ON p."Id_municipio" = m."Id_municipio"
        LEFT JOIN "Estado" e ON m."Id_estado" = e."Id_estado"
        LEFT JOIN "Pais" pa ON e."Id_pais" = pa."Id_pais"
        WHERE u."correo" = $1
      `,
      values: [email],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in findOneByEmail:", error);
    throw error;
  }
};

const findOneByUsername = async (username) => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."clave" as password,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."fecha_nacimiento",
          u."genero",
          u."foto_usuario",
          u."security_word",
          u."respuesta_de_seguridad",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."Id_direccion",
          u."password_reset_token",
          u."password_reset_expires",
          u."email_verification_token",
          u."last_login",
          u."creado_en" as created_at,
          u."actualizado_en" as updated_at,
          r."tipo_rol",
          d."nombre_direccion",
          d."Id_ciudad",
          ci."nombre_ciudad",
          ci."Id_parroquia",
          p."nombre_parroquia",
          p."Id_municipio",
          m."nombre_municipio",
          m."Id_estado",
          e."nombre_estado",
          e."Id_pais",
          pa."nombre_pais"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        LEFT JOIN "Direccion" d ON u."Id_direccion" = d."Id_direccion"
        LEFT JOIN "Ciudad" ci ON d."Id_ciudad" = ci."Id_ciudad"
        LEFT JOIN "Parroquia" p ON ci."Id_parroquia" = p."Id_parroquia"
        LEFT JOIN "Municipio" m ON p."Id_municipio" = m."Id_municipio"
        LEFT JOIN "Estado" e ON m."Id_estado" = e."Id_estado"
        LEFT JOIN "Pais" pa ON e."Id_pais" = pa."Id_pais"
        WHERE u."username" = $1 OR u."correo" = $1
      `,
      values: [username],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in findOneByUsername:", error);
    throw error;
  }
};

const findOneById = async (id) => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."clave" as password,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."fecha_nacimiento",
          u."genero",
          u."foto_usuario",
          u."security_word",
          u."respuesta_de_seguridad",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."Id_direccion",
          u."password_reset_token",
          u."password_reset_expires",
          u."email_verification_token",
          u."last_login",
          u."creado_en" as created_at,
          u."actualizado_en" as updated_at,
          r."tipo_rol",
          d."nombre_direccion",
          d."Id_ciudad",
          ci."nombre_ciudad",
          ci."Id_parroquia",
          p."nombre_parroquia",
          p."Id_municipio",
          m."nombre_municipio",
          m."Id_estado",
          e."nombre_estado",
          e."Id_pais",
          pa."nombre_pais"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        LEFT JOIN "Direccion" d ON u."Id_direccion" = d."Id_direccion"
        LEFT JOIN "Ciudad" ci ON d."Id_ciudad" = ci."Id_ciudad"
        LEFT JOIN "Parroquia" p ON ci."Id_parroquia" = p."Id_parroquia"
        LEFT JOIN "Municipio" m ON p."Id_municipio" = m."Id_municipio"
        LEFT JOIN "Estado" e ON m."Id_estado" = e."Id_estado"
        LEFT JOIN "Pais" pa ON e."Id_pais" = pa."Id_pais"
        WHERE u."Id_usuario" = $1
      `,
      values: [id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in findOneById:", error);
    throw error;
  }
};

const findAll = async () => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."fecha_nacimiento",
          u."genero",
          u."foto_usuario",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."Id_direccion",
          u."creado_en" as created_at,
          u."last_login",
          r."tipo_rol",
          d."nombre_direccion",
          ci."nombre_ciudad"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        LEFT JOIN "Direccion" d ON u."Id_direccion" = d."Id_direccion"
        LEFT JOIN "Ciudad" ci ON d."Id_ciudad" = ci."Id_ciudad"
        ORDER BY u."Id_usuario"
      `,
    };
    const { rows } = await db.query(query.text);
    return rows;
  } catch (error) {
    console.error("Error in findAll users:", error);
    throw error;
  }
};

const updatePassword = async (id, hashedPassword) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET "clave" = $1,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $2
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email,
          "nombre",
          "apellido"
      `,
      values: [hashedPassword, id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in updatePassword:", error);
    throw error;
  }
};

const updateProfile = async (id, { 
  email, security_word, respuesta_de_seguridad, 
  nombre, apellido, telefono, cedula,
  fecha_nacimiento, genero, foto_usuario, Id_direccion 
}) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET 
          "correo" = COALESCE($1, "correo"),
          "security_word" = COALESCE($2, "security_word"),
          "respuesta_de_seguridad" = COALESCE($3, "respuesta_de_seguridad"),
          "nombre" = COALESCE($4, "nombre"),
          "apellido" = COALESCE($5, "apellido"),
          "telefono" = COALESCE($6, "telefono"),
          "cedula" = COALESCE($7, "cedula"),
          "fecha_nacimiento" = COALESCE($8, "fecha_nacimiento"),
          "genero" = COALESCE($9, "genero"),
          "foto_usuario" = COALESCE($10, "foto_usuario"),
          "Id_direccion" = COALESCE($11, "Id_direccion"),
          "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $12
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email, 
          "security_word", 
          "nombre", 
          "apellido", 
          "telefono",
          "cedula",
          "fecha_nacimiento",
          "genero",
          "foto_usuario",
          "Id_direccion"
      `,
      values: [email, security_word, respuesta_de_seguridad, nombre, apellido, 
               telefono, cedula, fecha_nacimiento, genero, foto_usuario, 
               Id_direccion, id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in updateProfile:", error);
    throw error;
  }
};

const updateLastLogin = async (id) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET "last_login" = CURRENT_TIMESTAMP,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $1
      `,
      values: [id],
    };
    await db.query(query.text, query.values);
  } catch (error) {
    console.error("Error in updateLastLogin:", error);
  }
};

const setPasswordResetToken = async (userId, token) => {
  try {
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const query = {
      text: `
        UPDATE "Usuario"
        SET "password_reset_token" = $1,
            "password_reset_expires" = $2,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $3
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email,
          "nombre",
          "apellido"
      `,
      values: [token, expires, userId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in setPasswordResetToken:", error);
    throw error;
  }
};

const findByPasswordResetToken = async (token) => {
  try {
    const query = {
      text: `
        SELECT * FROM "Usuario"
        WHERE "password_reset_token" = $1
        AND "password_reset_expires" > CURRENT_TIMESTAMP
      `,
      values: [token],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in findByPasswordResetToken:", error);
    throw error;
  }
};

const clearPasswordResetToken = async (id) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET "password_reset_token" = NULL,
            "password_reset_expires" = NULL,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $1
      `,
      values: [id],
    };
    await db.query(query.text, query.values);
  } catch (error) {
    console.error("Error in clearPasswordResetToken:", error);
    throw error;
  }
};

const setActive = async (id, isActive) => {
  try {
    const status = isActive ? 'activo' : 'inactivo';
    const query = {
      text: `
        UPDATE "Usuario"
        SET "estatus_usuario" = $1,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $2
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email, 
          "estatus_usuario" as is_active,
          "nombre",
          "apellido"
      `,
      values: [status.toLowerCase(), id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in setActive:", error);
    throw error;
  }
};

const remove = async (id) => {
  try {
    const query = {
      text: 'DELETE FROM "Usuario" WHERE "Id_usuario" = $1 RETURNING "Id_usuario" as id',
      values: [id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in remove user:", error);
    throw error;
  }
};

const findByCedula = async (cedula) => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."clave" as password,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."fecha_nacimiento",
          u."genero",
          u."foto_usuario",
          u."security_word",
          u."respuesta_de_seguridad",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."Id_direccion",
          u."password_reset_token",
          u."password_reset_expires",
          u."email_verification_token",
          u."last_login",
          u."creado_en" as created_at,
          u."actualizado_en" as updated_at,
          r."tipo_rol"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        WHERE u."cedula" = $1
      `,
      values: [cedula],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in findByCedula:", error);
    throw error;
  }
};

const searchByUsername = async (searchTerm) => {
  try {
    const query = {
      text: `
        SELECT 
          u."Id_usuario" as id,
          COALESCE(u."username", u."correo") as username,
          u."correo" as email,
          u."nombre",
          u."apellido",
          u."cedula",
          u."telefono",
          u."estatus_usuario" as is_active,
          u."email_verified",
          u."Id_rol",
          u."creado_en" as created_at,
          u."last_login",
          r."tipo_rol"
        FROM "Usuario" u
        LEFT JOIN "Rol" r ON u."Id_rol" = r."Id_rol"
        WHERE u."username" ILIKE $1 
           OR u."correo" ILIKE $1 
           OR u."nombre" ILIKE $1 
           OR u."apellido" ILIKE $1
           OR u."cedula" ILIKE $1
        ORDER BY u."Id_usuario"
      `,
      values: [`%${searchTerm}%`],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows;
  } catch (error) {
    console.error("Error in searchByUsername:", error);
    throw error;
  }
};

const verifySecurityAnswer = async (username, respuesta_de_seguridad) => {
  try {
    const query = {
      text: `
        SELECT 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email, 
          "security_word", 
          "respuesta_de_seguridad",
          "nombre",
          "apellido"
        FROM "Usuario"
        WHERE ("username" = $1 OR "correo" = $1) 
          AND "respuesta_de_seguridad" = $2
      `,
      values: [username, respuesta_de_seguridad],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in verifySecurityAnswer:", error);
    throw error;
  }
};

const updateProfileWithSecurity = async (
  id,
  { email, security_word, respuesta_de_seguridad, current_security_answer, 
    nombre, apellido, telefono, cedula, fecha_nacimiento, genero, foto_usuario, Id_direccion }
) => {
  try {
    // Primero verificar la respuesta de seguridad actual
    const userQuery = {
      text: `SELECT "respuesta_de_seguridad" FROM "Usuario" WHERE "Id_usuario" = $1`,
      values: [id],
    };
    const userResult = await db.query(userQuery.text, userQuery.values);

    if (!userResult.rows[0] || userResult.rows[0].respuesta_de_seguridad !== current_security_answer) {
      throw new Error("Invalid security answer");
    }

    const query = {
      text: `
        UPDATE "Usuario"
        SET 
          "correo" = COALESCE($1, "correo"),
          "security_word" = COALESCE($2, "security_word"),
          "respuesta_de_seguridad" = COALESCE($3, "respuesta_de_seguridad"),
          "nombre" = COALESCE($4, "nombre"),
          "apellido" = COALESCE($5, "apellido"),
          "telefono" = COALESCE($6, "telefono"),
          "cedula" = COALESCE($7, "cedula"),
          "fecha_nacimiento" = COALESCE($8, "fecha_nacimiento"),
          "genero" = COALESCE($9, "genero"),
          "foto_usuario" = COALESCE($10, "foto_usuario"),
          "Id_direccion" = COALESCE($11, "Id_direccion"),
          "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $12
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email, 
          "security_word",
          "nombre", 
          "apellido", 
          "telefono",
          "cedula",
          "fecha_nacimiento",
          "genero",
          "Id_direccion"
      `,
      values: [email, security_word, respuesta_de_seguridad, nombre, apellido, 
               telefono, cedula, fecha_nacimiento, genero, foto_usuario, 
               Id_direccion, id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in updateProfileWithSecurity:", error);
    throw error;
  }
};

const changePasswordWithSecurity = async (username, respuesta_de_seguridad, newPassword) => {
  try {
    // Verificar la respuesta de seguridad
    const user = await verifySecurityAnswer(username, respuesta_de_seguridad);
    if (!user) {
      throw new Error("Invalid username or security answer");
    }

    // Hash de la nueva contraseña
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    // Actualizar la contraseña
    const query = {
      text: `
        UPDATE "Usuario"
        SET "clave" = $1,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $2
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email,
          "nombre",
          "apellido"
      `,
      values: [hashedPassword, user.id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in changePasswordWithSecurity:", error);
    throw error;
  }
};

const setEmailVerificationToken = async (id, token) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET "email_verification_token" = $1,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "Id_usuario" = $2
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email,
          "nombre",
          "apellido"
      `,
      values: [token, id],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in setEmailVerificationToken:", error);
    throw error;
  }
};

const verifyEmail = async (token) => {
  try {
    const query = {
      text: `
        UPDATE "Usuario"
        SET "email_verified" = true,
            "email_verification_token" = NULL,
            "actualizado_en" = CURRENT_TIMESTAMP
        WHERE "email_verification_token" = $1
        RETURNING 
          "Id_usuario" as id, 
          COALESCE("username", "correo") as username, 
          "correo" as email, 
          "email_verified",
          "nombre",
          "apellido"
      `,
      values: [token],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    throw error;
  }
};

const isProfesor = async (usuarioId) => {
  try {
    const query = {
      text: `
        SELECT p."Id_profesor", p."especialidad"
        FROM "Profesor" p
        WHERE p."Id_usuario" = $1
      `,
      values: [usuarioId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in isProfesor:", error);
    throw error;
  }
};

const isRepresentante = async (usuarioId) => {
  try {
    const query = {
      text: `
        SELECT r."Id_representante", r."es_familiar", r."profesion_rep", r."direccion_trabajo_rep"
        FROM "Representante" r
        WHERE r."Id_usuario" = $1
      `,
      values: [usuarioId],
    };
    const { rows } = await db.query(query.text, query.values);
    return rows[0];
  } catch (error) {
    console.error("Error in isRepresentante:", error);
    throw error;
  }
};

export const UserModel = {
  create,
  findOneByUsername,
  findOneById,
  findOneByEmail,
  findAll,
  updatePassword,
  updateProfile,
  updateProfileWithSecurity,
  changePasswordWithSecurity,
  updateLastLogin,
  setPasswordResetToken,
  findByPasswordResetToken,
  clearPasswordResetToken,
  setActive,
  remove,
  findByCedula,
  searchByUsername,
  verifySecurityAnswer,
  setEmailVerificationToken,
  verifyEmail,
  isProfesor,
  isRepresentante,
  migratePasswordToHash,
  migrateAllPasswords
};