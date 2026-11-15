import { Queue } from "bull";
import { connectPrismaDatabase, disconnectPrismaDatabase } from "../config/database";

//Queues
import exampleQueue from "../queues/example.queue";

//Jobs
import exampleJob from "../jobs/example.job";

class Worker {
    private name;
    private queue;
    private jobProcessor;
    private concurrency;
    private isRunning;

    constructor(name: string, queue: Queue, jobProcessor: Function, concurrency: number = 1){
        this.name = name;
        this.jobProcessor = jobProcessor;
        this.queue = queue;
        this.concurrency = concurrency;
        this.isRunning = false
    }
    
    public async start(){
        if(this.isRunning){
            console.log(`le Worker ${this.name} est déjà démarré.`)
            return;
        }
        this.isRunning = true

        console.log(`Démarrage du worker "${this.name}" (concurrence: ${this.concurrency})`);

        this.queue.process(this.concurrency, async (job) => {
            console.log(`🚀 Démarrage du worker "${this.name}" (concurrence: ${this.concurrency})`);
            try {
                const result = await this.jobProcessor(job);
                console.log(`✅ [${this.name}] Job #${job.id} terminé avec succès`);
                return result;
            } catch (error) {
                console.error(`❌ [${this.name}] Erreur job #${job.id}:`);
                throw error;
            }
        })

        // Événements de la queue
        this.queue.on('completed', (job) => {
            console.log(`✅ [${this.name}] Job #${job.id} complété`);
        });

        this.queue.on('failed', (job, err) => {
            console.error(`❌ [${this.name}] Job #${job.id} échoué:`, err.message);
        });

        console.log(`📡 [${this.name}] En écoute...`);
    }

    public async shutdown() {
        if (!this.isRunning) return;
        console.log(`Arrêt du worker "${this.name}"...`);
        await this.queue.close();
        this.isRunning = false;
        console.log(`Worker "${this.name}" arrêté`);
    }
}

const workers : Worker[] = [
    new Worker("example-worker", exampleQueue, exampleJob, 3),

]

//Démarrage de tous les workers
async function startAllWorkers(){
    await connectPrismaDatabase()

    console.log('✅ Worker connecté à MySQL\n');

    // Démarrer chaque worker
    for (const worker of workers) {
        await worker.start();
    }

    console.log(`\n📡 ${workers.length} worker(s) en écoute...\n`);
}

// Arrêt gracieux de tous les workers
async function shutdownAllWorkers() {
    console.log('\n⏸️  Arrêt des workers...');

    for (const worker of workers) {
        await worker.shutdown();
    }

    // Fermer la connexion DB unique
    await disconnectPrismaDatabase();
    console.log('✅ Tous les workers arrêtés proprement\n');
    process.exit(0);
}

// Gestion des signaux d'arrêt
process.on('SIGTERM', shutdownAllWorkers);
process.on('SIGINT', shutdownAllWorkers);

// Lancer tous les workers
startAllWorkers().catch((error) => {
    console.error('❌ Erreur démarrage workers:', error);
    process.exit(1);
});
