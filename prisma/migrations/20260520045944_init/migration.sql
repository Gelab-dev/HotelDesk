-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "turno" TEXT NOT NULL,
    "sinTacc" BOOLEAN NOT NULL DEFAULT false,
    "sinLactosa" BOOLEAN NOT NULL DEFAULT false,
    "vegetariano" BOOLEAN NOT NULL DEFAULT false,
    "vegano" BOOLEAN NOT NULL DEFAULT false,
    "comentarios" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HuespedDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_habitacion_nombre_apellido_fecha_key" ON "Reserva"("habitacion", "nombre", "apellido", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "HuespedDemo_habitacion_nombre_apellido_key" ON "HuespedDemo"("habitacion", "nombre", "apellido");
