import Queue from "bull";
import redisConfig from "../config/redis.config"

// Créer la queue pour l'expiration des abonnements
const exempleQueue = new Queue("queue-example", {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3, // Nombre de tentatives en cas d'échec
        backoff: {
            type: "exponential", // Délai exponentiel entre les tentatives
            delay: 5000, // 5s, puis 10s, puis 20s
        },
        removeOnComplete: 100, // Garder les 100 derniers jobs terminés
        removeOnFail: 200, // Garder les 200 derniers jobs échoués
    },
});

// Événements de la queue (pour logging)
exempleQueue.on("error", (error) => {
    console.error("❌ Erreur queue:", error);
});

exempleQueue.on("waiting", (jobId) => {
    console.log(`⏳ Job ${jobId} en attente`);
});

exempleQueue.on("active", (job) => {
    console.log(`🚀 Job ${job.id} démarré`);
});

exempleQueue.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} terminé`);
});

exempleQueue.on("failed", (job, error) => {
    console.error(
        `❌ Job ${job.id} échoué `,
        error.message
    );
});

exempleQueue.on("stalled", (job) => {
    console.warn(`⚠️ Job ${job.id} bloqué`);
});

export default exempleQueue