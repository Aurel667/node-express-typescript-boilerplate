import { Response, Request, NextFunction } from "express"
import * as userRepo from "../repositories/user.repository"

export async function getUsers(req: Request, res: Response, next: NextFunction){
    try {
        const users = await userRepo.getAllUsers();
        res.status(200).json(users)
    } catch (error) {
        next(error)
    }
}