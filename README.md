# API REST - Node + Express + TypeScript + PostgreSQL + PostGIS

## Tecnologías

- Node.js + Express
- TypeScript
- PostgreSQL + PostGIS
- Prisma ORM
- JWT Authentication
- Zod (Validación)
- Swagger (Documentación)

## Estructura del Proyecto

```
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── .env
└── package.json
```

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env` y configura tu base de datos PostgreSQL
2. Ejecuta las migraciones de Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Testing con Postman

Importa la colección de Postman incluida en `/postman` para probar los endpoints.
