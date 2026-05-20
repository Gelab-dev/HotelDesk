import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.huespedDemo.deleteMany()
  await prisma.huespedDemo.createMany({
    data: [
      { habitacion: '101', nombre: 'Maria',     apellido: 'Garcia',    checkIn: new Date('2026-05-19'), checkOut: new Date('2026-05-24') },
      { habitacion: '102', nombre: 'Carlos',    apellido: 'Lopez',     checkIn: new Date('2026-05-18'), checkOut: new Date('2026-05-23') },
      { habitacion: '201', nombre: 'Ana',       apellido: 'Martinez',  checkIn: new Date('2026-05-20'), checkOut: new Date('2026-05-25') },
      { habitacion: '202', nombre: 'Pablo',     apellido: 'Rodriguez', checkIn: new Date('2026-05-19'), checkOut: new Date('2026-05-22') },
      { habitacion: '301', nombre: 'John',      apellido: 'Smith',     checkIn: new Date('2026-05-21'), checkOut: new Date('2026-05-26') },
      { habitacion: '302', nombre: 'Sophie',    apellido: 'Martin',    checkIn: new Date('2026-05-20'), checkOut: new Date('2026-05-23') },
      { habitacion: '303', nombre: 'Juan Cruz', apellido: 'Gelabert',  checkIn: new Date('2026-05-20'), checkOut: new Date('2026-05-27') },
      { habitacion: '401', nombre: 'Lucia',     apellido: 'Fernandez', checkIn: new Date('2026-05-19'), checkOut: new Date('2026-05-21') },
      { habitacion: '402', nombre: 'Roberto',   apellido: 'Sanchez',   checkIn: new Date('2026-05-22'), checkOut: new Date('2026-05-25') },
      { habitacion: '501', nombre: 'Emma',      apellido: 'Wilson',    checkIn: new Date('2026-05-20'), checkOut: new Date('2026-05-24') },
    ],
  })
  console.log('✅ Huéspedes demo cargados')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())