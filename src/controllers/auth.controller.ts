import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "../config/environnement";

import * as userRepo from "../repositories/user.repository";

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const {email, password} = req.body;

        const user = await userRepo.getUserByEmail(email);

        if (!user) {
            throw createError.unauthorized("Email ou mot de passe invalide");
        }
        const isMatch = await bcrypt.compare(password, user?.password);
        if (!isMatch) {
            throw createError.unauthorized("Email ou mot de passe invalide");
        }
        const token = signJWT({ id: user?.id, email: user?.email, role: user?.role });
        const { password: _, ...userWithoutPassword } = user;
        res.cookie("token", token, config.cookie);
        res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        res.clearCookie("token", config.cookie);
        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        next(error);
    }
}
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user.id;
        /** Utiliser cette méthode si vous utilisez prisma */
        const user = await userRepo.getUserById(userId);
        if (!user) {
            throw createError.notFound("Utilisateur non trouvé");
        }
        const { password: _, ...userWithoutPassword } = user; 
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
}