import { db } from "../db/connection.database.js";

// ============================================
// OBTENER TODOS LOS DOCENTES - ¡CORREGIDO!
// ============================================
const findAll = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    u."Id_usuario" as id,
                    u."cedula" as dni,
                    u."nombre" as first_name,
                    u."apellido" as last_name,
                    u."correo" as email,
                    u."telefono" as phone,
                    u."estatus_usuario" as status,
                    u."creado_en" as created_at,
                    COALESCE(p."Id_profesor", NULL) as teacher_id,  -- ✅ Puede ser NULL
                    COALESCE(p."especialidad", NULL) as specialty, -- ✅ Puede ser NULL
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', g."Id_grado",
                                    'name', g."nombre_grado",
                                    'level', g."nivel"
                                )
                            )
                            FROM "Profesor_Grado" pg
                            JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                            WHERE pg."Id_profesor" = p."Id_profesor"
                        ),
                        '[]'::json
                    ) as grades
                FROM "Usuario" u
                LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"  -- ✅ LEFT JOIN para TODOS
                WHERE u."Id_rol" = 2
                ORDER BY u."creado_en" DESC
            `
        };
        
        const { rows } = await db.query(query.text);
        console.log(`📋 TeacherModel.findAll: ${rows.length} docentes encontrados`);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.findAll:", error);
        throw error;
    }
};


// ============================================
// OBTENER DOCENTE POR ID - ¡CORREGIDO!
// ============================================
const findById = async (id) => {
    try {
        const query = {
            text: `
                SELECT 
                    u."Id_usuario" as id,
                    u."cedula" as dni,
                    u."nombre" as first_name,
                    u."apellido" as last_name,
                    u."correo" as email,
                    u."telefono" as phone,
                    u."estatus_usuario" as status,
                    u."creado_en" as created_at,
                    COALESCE(p."Id_profesor", NULL) as teacher_id,
                    COALESCE(p."especialidad", NULL) as specialty,
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', g."Id_grado",
                                    'name', g."nombre_grado",
                                    'level', g."nivel"
                                )
                            )
                            FROM "Profesor_Grado" pg
                            JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                            WHERE pg."Id_profesor" = p."Id_profesor"
                        ),
                        '[]'::json
                    ) as grades
                FROM "Usuario" u
                LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"
                WHERE u."Id_usuario" = $1 AND u."Id_rol" = 2
            `,
            values: [id]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.findById:", error);
        throw error;
    }
};
// ============================================
// ASIGNAR ESPECIALIDAD AL DOCENTE
// ============================================
const assignSpecialty = async (userId, specialty) => {
    try {
        const query = {
            text: `
                UPDATE "Profesor"
                SET "especialidad" = $1
                WHERE "Id_usuario" = $2
                RETURNING 
                    "Id_profesor" as teacher_id,
                    "especialidad" as specialty,
                    "Id_usuario" as user_id
            `,
            values: [specialty, userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.assignSpecialty:", error);
        throw error;
    }
};

// ============================================
// ASIGNAR GRADOS AL DOCENTE - ¡CORREGIDO!
// ============================================
const assignGrades = async (userId, gradeIds) => {
    try {
        // 1. Obtener el Id_profesor
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            throw new Error("Profesor no encontrado");
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        // 2. Iniciar transacción
        await db.query('BEGIN');
        
        // 3. Eliminar asignaciones actuales
        await db.query(
            'DELETE FROM "Profesor_Grado" WHERE "Id_profesor" = $1',
            [profesorId]
        );
        
        // 4. Insertar nuevas asignaciones
        if (gradeIds && gradeIds.length > 0) {
            for (const gradoId of gradeIds) {
                await db.query(
                    `INSERT INTO "Profesor_Grado" ("Id_profesor", "Id_grado")
                     VALUES ($1, $2)`,
                    [profesorId, gradoId]
                );
            }
        }
        
        // 5. Obtener los grados asignados para devolverlos
        const gradesResult = await db.query(
            `SELECT 
                g."Id_grado" as id,
                g."nombre_grado" as name,
                g."nivel" as level
             FROM "Profesor_Grado" pg
             JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
             WHERE pg."Id_profesor" = $1
             ORDER BY g."Id_grado"`,
            [profesorId]
        );
        
        // 6. Commit transacción
        await db.query('COMMIT');
        
        return { 
            profesorId, 
            gradeIds,
            grades: gradesResult.rows  // ✅ DEVOLVER LOS GRADOS ASIGNADOS
        };
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("❌ Error en teacher.assignGrades:", error);
        throw error;
    }
};


// ============================================
// OBTENER TODAS LAS ESPECIALIDADES
// ============================================
const getAllSpecialties = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_especialidad" as id,
                    "nombre_especialidad" as name,
                    "descripcion" as description,
                    "area"
                FROM "Especialidad"
                WHERE activo = true
                ORDER BY "nombre_especialidad"
            `
        };
        
        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getAllSpecialties:", error);
        throw error;
    }
};

// ============================================
// OBTENER TODOS LOS GRADOS
// ============================================
const getAllGrades = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_grado" as id,
                    "nombre_grado" as name,
                    "nivel" as level
                FROM "Grado"
                WHERE activo = true
                ORDER BY "Id_grado"
            `
        };
        
        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getAllGrades:", error);
        throw error;
    }
};

// ============================================
// ACTUALIZAR DATOS BÁSICOS DEL DOCENTE
// ============================================
const update = async (userId, teacherData) => {
    try {
        const { dni, first_name, last_name, phone, email, status } = teacherData;
        
        let dbStatus = 'activo';
        if (status === 'inactive') dbStatus = 'inactivo';
        if (status === 'suspended') dbStatus = 'suspendido';
        
        const query = {
            text: `
                UPDATE "Usuario"
                SET 
                    "cedula" = COALESCE($1, "cedula"),
                    "nombre" = COALESCE($2, "nombre"),
                    "apellido" = COALESCE($3, "apellido"),
                    "telefono" = COALESCE($4, "telefono"),
                    "correo" = COALESCE($5, "correo"),
                    "estatus_usuario" = COALESCE($6, "estatus_usuario"),
                    "actualizado_en" = CURRENT_TIMESTAMP
                WHERE "Id_usuario" = $7 AND "Id_rol" = 2
                RETURNING 
                    "Id_usuario" as id,
                    "cedula" as dni,
                    "nombre" as first_name,
                    "apellido" as last_name,
                    "telefono" as phone,
                    "correo" as email,
                    "estatus_usuario" as status
            `,
            values: [dni, first_name, last_name, phone, email, dbStatus, userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.update:", error);
        throw error;
    }
};

// ============================================
// ELIMINAR DOCENTE (DESACTIVAR)
// ============================================
const remove = async (userId) => {
    try {
        const query = {
            text: `
                UPDATE "Usuario"
                SET "estatus_usuario" = 'inactivo',
                    "actualizado_en" = CURRENT_TIMESTAMP
                WHERE "Id_usuario" = $1 AND "Id_rol" = 2
                RETURNING "Id_usuario" as id
            `,
            values: [userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.remove:", error);
        throw error;
    }
};

// ============================================
// OBTENER HORARIO DEL DOCENTE
// ============================================
const getSchedule = async (userId) => {
    try {
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            return [];
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        const query = {
            text: `
                SELECT 
                    h."Id_horario" as id,
                    h."Id_dia" as day,
                    h."Id_bloque" as block,
                    a."nombre_aula" as classroom
                FROM "Horario" h
                LEFT JOIN "Aula" a ON h."Id_aula" = a."Id_aula"
                WHERE h."Id_profesor" = $1
                ORDER BY h."Id_dia", h."Id_bloque"
            `,
            values: [profesorId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getSchedule:", error);
        throw error;
    }
};

// ============================================
// OBTENER ESTUDIANTES DEL DOCENTE
// ============================================
const getStudents = async (userId) => {
    try {
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            return [];
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        const query = {
            text: `
                SELECT DISTINCT
                    e."Id_estudiante" as student_id,
                    u."Id_usuario" as user_id,
                    u."nombre" as first_name,
                    u."apellido" as last_name,
                    u."cedula" as dni,
                    g."nombre_grado" as grade
                FROM "Estudiante" e
                JOIN "Usuario" u ON e."Id_usuario" = u."Id_usuario"
                JOIN "Grado" g ON e."Id_grado" = g."Id_grado"
                JOIN "Profesor_Grado" pg ON g."Id_grado" = pg."Id_grado"
                WHERE pg."Id_profesor" = $1
                ORDER BY u."apellido", u."nombre"
            `,
            values: [profesorId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getStudents:", error);
        throw error;
    }
};

// ============================================
// EXPORTAR MODELO
// ============================================
export const TeacherModel = {
    findAll,
    findById,
    assignSpecialty,
    assignGrades,
    update,
    remove,
    getAllSpecialties,
    getAllGrades,
    getSchedule,
    getStudents
};