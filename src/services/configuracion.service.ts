import prisma from '@/lib/prisma'

const CONFIG_ID = 'config' as const

/** Garantiza un registro de configuración y devuelve el estado actual */
export async function getConfiguracion() {
  return prisma.configuracion.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID, bloqueado: false },
  })
}

export async function establecerBloqueo(bloqueado: boolean) {
  const cfg = await prisma.configuracion.upsert({
    where: { id: CONFIG_ID },
    update: { bloqueado },
    create: { id: CONFIG_ID, bloqueado },
  })
  return cfg.bloqueado
}
