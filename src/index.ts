import path from 'path';
import Express, { Application, json, urlencoded } from 'express';
import {Server} from "http"
import cookieParser from 'cookie-parser';
import cors from "cors"
import bodyParser from 'body-parser';
import config from './config/environnement'
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from "./middlewares/errorHandlers"
import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';
import connectMongoDatabase from './config/database.mongodb';
import { verifyApiKey } from './middlewares/apiCheck.middleware';
import compression from 'compression';
import userRoutes from "./routes/user.routes"

class App {
    private app: Application | null = null;
    private server: Server | null = null;

    constructor(){
        this.app = Express()
        this.server = new Server(this.app)
        this.initializeMiddlewares()
        this.initializeRoutes()
        this.initializeErrorsHandling()
    }

    private initializeMiddlewares(){
        this.app?.use(bodyParser.json())
        this.app?.use(json({ limit: "10mb" }));
        this.app?.use(urlencoded({ extended: true, limit: "10mb" }));
        this.app?.use(compression())
        //Configuration des cors
        this.app?.use(
            cors({
                origin: config.cors.origin,
                credentials: true,
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                allowedHeaders: ["Content-Type", "Authorization"],
            })
        );
        // Configuration de la limation de requête
        this.app?.use("/api/", rateLimit({
            windowMs: config.rateLimit.windowMs, //Temps imparti pour le max de requêtes
            max: config.rateLimit.maxRequests, //Maximum de requêtes dans le temps imparti
            message: {
                error: "Trop de requêtes pourn cette adresse IP. Réessayez plus tard.",
            },
            standardHeaders: true,
            legacyHeaders: false,
        }))
        this.app?.use(cookieParser());
        this.app?.use((req, res, next) => {
            const { method, url } = req;
            const timestamp = new Date().toISOString();
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.info(
                `\x1b[36m[${timestamp}]\x1b[0m \x1b[32m${method}\x1b[0m \x1b[33m${url}\x1b[0m \x1b[35mIP:\x1b[0m ${ip}`
            );
            next()
        })
        this.app?.use("/", Express.static(path.join(__dirname, "public/")));
        this.app?.use(verifyApiKey);
        console.info("🗂  Middlewares initialisés");
    }

    private initializeRoutes(){
        //Route pour vérifier la santé de l'api
        this.app?.use("/api/health", (req, res) => {
            return res.status(200).json({
                status: "OK",
                timestamp: new Date().toLocaleDateString(),
                environment: config.nodeEnv,
                version: process.env.npm_package_version || "1.0.0",
            });
        });
        //Routes utilisateurs
        this.app?.use("/api/users", userRoutes);
        this.app?.use("/uploads",Express.static(path.join(__dirname, "public/uploads")));
        console.info("🛣  Routes initialisés");
    }

    private initializeErrorsHandling(){
        this.app?.use(errorHandler);
        this.app?.use(notFoundHandler);
        console.info("⭕ Gestion d'erreurs initialisés");
    }

    public async start(){
        try {
            // Connexion à la base de données
            await connectMongoDatabase(); //Si vous utilisez MongoDB
            
            await connectPrismaDatabase(); //Si vous utilisez Prisma


            // Lancement du serveur
            this.server?.listen(config.port, config.host as string, () => {
                console.info(
                `🚀 Serveur lancé sur http://${config.host}:${config.port}`
                );
                console.info(`📝 Environment: ${config.nodeEnv}`);
                console.info(
                `📦 Base de données: ${config.database.uri.replace(
                    /\/\/.*@/,
                    "//***:***@"
                )}`
                );
            });

            // Arrêt gracieux du serveur
            process.on("SIGINT", this.shutdown.bind(this));
            process.on("SIGTERM", this.shutdown.bind(this));
        } catch (error) {
            /** Déconnexion de la base de données, seulement si Prisma est utilisé */
            await disconnectPrismaDatabase();

            console.error("Failed to start server:", error);
            process.exit(1);
        }
    }

    /**
     * Arrêt gracieux du serveur
    */
    public async shutdown() {
        console.info("🛑 Arrêt du serveur...");
        await disconnectDatabase();
        this.server?.close(() => {
            console.info("✅ Serveur arrêté");
            process.exit(0);
        });

        // Forcer à s'arrêter après 10 secondes
        setTimeout(() => {
            console.error("❌ Le serveur ne s'est pas arrêté. L'arrêt forcé a été déclenché.");
            process.exit(1);
        }, 10000);
    }
}


const app = new App();
app.start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});