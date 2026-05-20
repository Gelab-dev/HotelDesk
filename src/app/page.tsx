import FormularioReserva from '@/components/huesped/FormularioReserva'
import { getConfiguracion } from '@/services/configuracion.service'

export default async function Home() {
  const config = await getConfiguracion()
  return <FormularioReserva bloqueado={config.bloqueado} />
}