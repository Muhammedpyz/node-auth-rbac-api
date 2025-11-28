const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'muhammedpyz466@gmail.com';
    try {
        // Check if user exists first
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`User ${email} not found.`);
            return;
        }

        // Delete Refresh Tokens first (if cascade isn't set, but usually good practice to be explicit or rely on cascade)
        // Checking schema, if cascade is there, deleting user is enough.
        // But to be safe:
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

        // Delete User
        await prisma.user.delete({
            where: { email: email },
        });
        console.log(`✅ User ${email} deleted successfully.`);
    } catch (e) {
        console.error(`❌ Error deleting user: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
