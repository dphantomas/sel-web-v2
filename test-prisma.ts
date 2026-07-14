import 'dotenv/config'
import { prisma } from './src/lib/prisma'

async function main() {
  const user = await prisma.user.findFirst({
    include: {
      unlockedInstances: {
        include: {
          courseInstance: {
            include: {
              course: true
            }
          }
        },
        orderBy: {
          courseInstance: { startDate: 'desc' }
        }
      }
    }
  })
  console.log("Success");
}

main().catch(console.error).finally(() => prisma.$disconnect())
