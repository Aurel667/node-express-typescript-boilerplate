import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../utils";
import { User } from "../generated/prisma/client";
import { createError } from "./errorHandlers";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export async function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user} = await getUserFromToken(req);
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

export async function admin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user} = await getUserFromToken(req);
        req.user = user;
        if (user.role !== "admin") {
            next(createError.forbidden("Accès réservé aux administrateurs"));
            return;
        }
        next();
    } catch (error) {
        next(error);
    }
}