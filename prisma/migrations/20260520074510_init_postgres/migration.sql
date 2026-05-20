-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "habitacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" TEXT NOT NULL,
    "sinTacc" BOOLEAN NOT NULL DEFAULT false,
    "sinLactosa" BOOLEAN NOT NULL DEFAULT false,
    "vegetariano" BOOLEAN NOT NULL DEFAULT false,
    "vegano" BOOLEAN NOT NULL DEFAULT false,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuespedDemo" (
    "id" TEXT NOT NULL,
    "habitacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuespedDemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL DEFAULT 'config',
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_habitacion_nombre_apellido_fecha_key" ON "Reserva"("habitacion", "nombre", "apellido", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "HuespedDemo_habitacion_nombre_apellido_key" ON "HuespedDemo"("habitacion", "nombre", "apellido");
