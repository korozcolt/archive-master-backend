# Archive Master 📁

![Archive Master Logo](https://i.ibb.co/whRY9b8/logo.png)
![Desarrollo](https://img.shields.io/badge/status-en%20desarrollo-yellow) ![Versión](https://img.shields.io/badge/version-0.1.0-blue) ![Licencia](https://img.shields.io/badge/license-MIT-green) ![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?style=flat&logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat&logo=typescript&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-v8-4479A1?style=flat&logo=mysql&logoColor=white)

## 🚀 Descripción del Proyecto

Archive Master es un sistema de gestión documental avanzado, diseñado para optimizar el almacenamiento, organización y flujo de trabajo de documentos en entornos empresariales. Desarrollado con tecnologías de vanguardia, ofrece una solución integral para la administración eficiente de documentos.

## 🛠️ Tecnologías Principales

### Backend
- NestJS
- TypeORM
- MySQL
- Redis
- Passport.js (Autenticación)
- Swagger (Documentación de API)

### Frontend
- Next.js
- React
- Tailwind CSS

## ✨ Características Principales

- 📄 Gestión completa de documentos
- 🔒 Sistema de autenticación y autorización robusto
- 📊 Flujos de trabajo personalizables
- 🔍 Motor de búsqueda avanzado
- 📈 Versionado de documentos
- 🏷️ Sistema de categorías y etiquetas
- 📝 Gestión de permisos granular

## 🚧 Módulos

- [x] Autenticación
- [x] Usuarios
- [x] Roles y Permisos
- [x] Categorías
- [x] Status y Transiciones
- [x] Tags
- [x] Configuraciones
- [x] Templates
- [x] Documentos
- [ ] Workflow Engine
- [ ] Búsqueda Avanzada
- [ ] Auditoría
- [ ] Reportes
- [ ] Notificaciones

## 🔧 Requisitos Previos

- Node.js (v18+)
- npm (v9+)
- MySQL
- Redis

## 📦 Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/archive-master.git
cd archive-master
```

2. Instalar dependencias del backend
```bash
cd backend
npm install
```

3. Configurar variables de entorno
- Crear un archivo `.env` basado en `.env.example`
- Configurar credenciales de base de datos
- Configurar credenciales de Redis
- Establecer secretos de JWT

4. Iniciar base de datos
```bash
npm run migration:run
npm run seed
```

5. Iniciar servidor de desarrollo
```bash
npm run start:dev
```

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. Los usuarios pueden:
- Registrarse
- Iniciar sesión
- Gestionar perfiles
- Recuperar contraseña

## 📋 Estructura del Proyecto

```
archive-master/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── documents/
│   │   │   └── ...
│   │   ├── common/
│   │   └── config/
│   ├── migrations/
│   └── tests/
└── frontend/
    ├── components/
    ├── pages/
    └── styles/
```

## 🧪 Pruebas

```bash
# Ejecutar pruebas unitarias
npm run test

# Ejecutar pruebas end-to-end
npm run test:e2e
```

## 🤝 Contribuciones

1. Haz un fork del proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulte `LICENSE` para más información.

## 📞 Contacto

- Desarrollador: Kristian Orozco
- Correo: [ing.korozco@gmail.com]
- LinkedIn: [https://www.linkedin.com/in/kristian-orozco-backend/]

## 🌟 Agradecimientos

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Redis](https://redis.io/)
- [Swagger](https://swagger.io/)

---

**🚀 Desarrollado con ❤️ para revolucionar la gestión documental**