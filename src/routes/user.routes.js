import express from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js"; // DESCOMENTA ESTA LÍNEA

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/refresh-token", UserController.refreshToken);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);
router.post("/recover-password-security", UserController.recoverPasswordWithSecurity);
router.get("/security-question/:username", UserController.getSecurityQuestion);

// ============================================
// RUTAS PROTEGIDAS CON AUTENTICACIÓN + AUTORIZACIÓN
// ============================================
// Migración de passwords (solo admin - doble protección)
router.post("/migrate-passwords", verifyToken, verifyAdmin, autoVerifyRole, UserController.migrateAllPasswords);

// Rutas que requieren autenticación + verificación automática de roles
router.get("/list", verifyToken, autoVerifyRole, UserController.listUsers);
router.get("/search", verifyToken, autoVerifyRole, UserController.searchUsers);
router.get("/profile", verifyToken, autoVerifyRole, UserController.profile);
router.put("/profile", verifyToken, autoVerifyRole, UserController.updateProfile);
router.put("/profile/security", verifyToken, autoVerifyRole, UserController.updateProfileWithSecurity);
router.put("/change-password", verifyToken, autoVerifyRole, UserController.changePassword);
router.put("/change-password/security", verifyToken, autoVerifyRole, UserController.changePasswordWithSecurity);

// Logout (requiere token válido)
router.post("/logout", verifyToken, autoVerifyRole, UserController.logout);

// Rutas administrativas (solo admin - doble protección)
router.put("/activate/:id", verifyToken, verifyAdmin, autoVerifyRole, UserController.activateUser);
router.put("/deactivate/:id", verifyToken, verifyAdmin, autoVerifyRole, UserController.deactivateUser);
router.delete("/:id", verifyToken, verifyAdmin, autoVerifyRole, UserController.deleteUser);

export default router;