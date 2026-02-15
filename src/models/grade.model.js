// models/grade.model.js
import { db } from "../db/connection.database.js";

// ============================================
// MODELO DE NOTAS
// ============================================

/**
 * Obtiene todas las notas de una sección
 */
const getGradesBySection = async (sectionId) => {
    try {
        const query = {
            text: `
                SELECT 
                    cn."Id_nota" as id,
                    cn."puntaje" as score,
                    cn."esta_formalizada" as is_formalized,
                    cn."Id_estudiante" as student_id,
                    CONCAT(e."nombre", ' ', e."apellido") as student_name,
                    cn."Id_estructura_evaluacion" as evaluation_structure_id,
                    ee."numero_evaluacion" as evaluation_number,
                    ee."porcentaje_peso" as weight,
                    ee."Id_seccion" as section_id
                FROM "Carga_Nota" cn
                INNER JOIN "Estudiante" e ON cn."Id_estudiante" = e."Id_estudiante"
                INNER JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
                WHERE ee."Id_seccion" = $1
                ORDER BY e."apellido", e."nombre", ee."numero_evaluacion"
            `,
            values: [sectionId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getGradesBySection:", error);
        throw error;
    }
};

/**
 * Guarda o actualiza notas de estudiantes
 */
const saveGrades = async (gradesData) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const { sectionId, grades, academicYearId } = gradesData;
        const results = [];
        
        // Obtener la estructura de evaluaciones de la sección
        const structureQuery = {
            text: `
                SELECT "Id_estructura_evaluacion", "numero_evaluacion"
                FROM "Estructura_Evaluacion"
                WHERE "Id_seccion" = $1
            `,
            values: [sectionId]
        };
        
        const structureResult = await client.query(structureQuery.text, structureQuery.values);
        
        if (structureResult.rows.length === 0) {
            throw new Error('No hay estructura de evaluaciones definida para esta sección');
        }
        
        // Mapear número de evaluación a ID de estructura
        const evalMap = {};
        structureResult.rows.forEach(row => {
            evalMap[row.numero_evaluacion] = row.Id_estructura_evaluacion;
        });
        
        // Procesar cada estudiante
        for (const [studentId, notas] of Object.entries(grades)) {
            for (let i = 1; i <= 4; i++) {
                const nota = notas[`n${i}`];
                if (nota && nota !== "") {
                    const estructuraId = evalMap[i];
                    
                    if (!estructuraId) {
                        console.warn(`⚠️ No hay estructura para evaluación ${i} en sección ${sectionId}`);
                        continue;
                    }
                    
                    // Verificar si ya existe una nota para esta evaluación
                    const checkQuery = {
                        text: `
                            SELECT "Id_nota" 
                            FROM "Carga_Nota" 
                            WHERE "Id_estudiante" = $1 
                              AND "Id_estructura_evaluacion" = $2
                        `,
                        values: [studentId, estructuraId]
                    };
                    
                    const existing = await client.query(checkQuery.text, checkQuery.values);
                    
                    if (existing.rows.length > 0) {
                        // Actualizar nota existente
                        const updateQuery = {
                            text: `
                                UPDATE "Carga_Nota"
                                SET "puntaje" = $1, "esta_formalizada" = true
                                WHERE "Id_nota" = $2
                                RETURNING "Id_nota" as id
                            `,
                            values: [parseFloat(nota), existing.rows[0].Id_nota]
                        };
                        
                        const result = await client.query(updateQuery.text, updateQuery.values);
                        results.push(result.rows[0]);
                    } else {
                        // Insertar nueva nota
                        const insertQuery = {
                            text: `
                                INSERT INTO "Carga_Nota" 
                                ("puntaje", "esta_formalizada", "Id_estudiante", "Id_estructura_evaluacion")
                                VALUES ($1, true, $2, $3)
                                RETURNING "Id_nota" as id
                            `,
                            values: [parseFloat(nota), studentId, estructuraId]
                        };
                        
                        const result = await client.query(insertQuery.text, insertQuery.values);
                        results.push(result.rows[0]);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        return results;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error en saveGrades:", error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene los estudiantes de una sección
 */
const getStudentsBySection = async (sectionId) => {
    try {
        const query = {
            text: `
                SELECT 
                    e."Id_estudiante" as id,
                    e."nombre" as first_name,
                    e."apellido" as last_name,
                    CONCAT(e."nombre", ' ', e."apellido") as full_name,
                    e."cedula" as dni,
                    e."fecha_nacimiento" as birth_date
                FROM "Estudiante_Seccion" es
                INNER JOIN "Estudiante" e ON es."Id_estudiante" = e."Id_estudiante"
                WHERE es."Id_seccion" = $1
                ORDER BY e."apellido", e."nombre"
            `,
            values: [sectionId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getStudentsBySection:", error);
        throw error;
    }
};

/**
 * Obtiene la estructura de evaluaciones de una sección
 */
const getEvaluationStructure = async (sectionId) => {
    try {
        const query = {
            text: `
                SELECT 
                    ee."Id_estructura_evaluacion" as id,
                    ee."numero_evaluacion" as number,
                    ee."porcentaje_peso" as weight,
                    te."nombre_evaluacion" as type_name
                FROM "Estructura_Evaluacion" ee
                LEFT JOIN "Tipo_Evaluacion" te ON ee."Id_tipo_evaluacion" = te."Id_tipo_evaluacion"
                WHERE ee."Id_seccion" = $1
                ORDER BY ee."numero_evaluacion"
            `,
            values: [sectionId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getEvaluationStructure:", error);
        throw error;
    }
};

/**
 * Obtiene las notas de un estudiante específico
 */
const getStudentGrades = async (studentId) => {
    try {
        const query = {
            text: `
                SELECT 
                    cn."Id_nota" as id,
                    cn."puntaje" as score,
                    cn."esta_formalizada" as is_formalized,
                    ee."numero_evaluacion" as evaluation_number,
                    ee."porcentaje_peso" as weight,
                    s."nombre_seccion" as section_name,
                    m."nombre_materia" as subject_name
                FROM "Carga_Nota" cn
                INNER JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
                INNER JOIN "Seccion" s ON ee."Id_seccion" = s."Id_seccion"
                LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
                WHERE cn."Id_estudiante" = $1
                ORDER BY s."Id_seccion", ee."numero_evaluacion"
            `,
            values: [studentId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getStudentGrades:", error);
        throw error;
    }
};

export const GradeModel = {
    getGradesBySection,
    saveGrades,
    getStudentsBySection,
    getEvaluationStructure,
    getStudentGrades
};