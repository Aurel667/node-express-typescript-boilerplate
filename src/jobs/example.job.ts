import { Job } from "bull";

const exampleJob = async (job: Job) => {
    try {
        job.progress(0)


        job.progress(100)
    } catch (error) {
        throw error; // Propager l'erreur pour que Bull marque le job comme failed
    }
}

export default exampleJob