import { Response, Request, NextFunction } from "express"
import * as usersServicePrisma from "../services/users.service.prisma"
import * as usersServiceMongo from "../services/users.service.mongodb"

export async function getUsers(req: Request, res: Response, next: NextFunction){
    try {
        /** Utiliser cette méthode si vous utilisez prisma */
        const usersPrisma = await usersServicePrisma.getAllUsers();
        
        /** Utiliser cette méthode si vous utilisez MongoDB avec Mongoose */
        const usersMongo = await usersServiceMongo.getAllUsers();

        //Vous pourrez choisir l'un ou l'autre selon la base de données utilisée
        const users = usersPrisma || usersMongo;

        res.status(200).json(users)
    } catch (error) {
        next(error)
    }
}