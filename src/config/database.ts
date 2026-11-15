import prisma from "./prisma"

export async function connectPrismaDatabase(){
    await prisma.$connect()
    .then(() => console.info("✅ Base de données connectée"))
    
}

export async function disconnectPrismaDatabase(){
    try {
        await prisma.$disconnect()
        console.info("✅ Base de données déconnectée");
    } catch (error) {
        console.error("Error disconnecting from the database:", error)
    }
}