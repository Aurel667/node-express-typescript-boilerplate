import dotenv from 'dotenv';
dotenv.config();
import path from "path";
import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandlers';

export function verifyApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    const APP_API_KEY = process.env.API_KEY
    if(!APP_API_KEY){
        next(createError.internal("APP API NOT SET"))
        return;
    }
    if (apiKey === APP_API_KEY) {
        next();
    } else {
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.status(404).sendFile(path.join(__dirname, '../html/403.html'));
        }
        next(createError.forbidden("Invalid or missing api key"))
    }
}

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin: string | undefined = req.headers.origin;
    if (allowedOrigins.includes(origin as string)) {
        next();
    } else {
        next(createError.forbidden("Origin not allowed"))
    }
}
