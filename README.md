# Archive Master 📁

![Archive Master Logo](https://i.ibb.co/HPRbSNM/archive-master-blanco.png)

![Desarrollo](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/version-0.2.0-blue)
![Licencia](https://img.shields.io/badge/license-MIT-green)
![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-v8-4479A1?style=flat&logo=mysql&logoColor=white)

## 🚀 Descripción del Proyecto

Archive Master es un sistema de gestión documental avanzado, diseñado para optimizar el almacenamiento, organización y flujo de trabajo de documentos en entornos empresariales. Con enfoque en estándares colombianos pero adaptable a nivel mundial, ofrece una solución robusta y escalable para la administración eficiente de documentos.

## 🛠️ Tecnologías Principales

### Backend

- NestJS v10
- TypeORM
- MySQL 8
- Redis (Sistema de Caché)
- Swagger (Documentación de API)
- Jest (Testing)

### Frontend (En desarrollo)

- Next.js
- React
- Tailwind CSS
- Filament Admin Panel

## ⚡ Características Principales

- 📄 Gestión completa de documentos
- 🔒 Sistema de autenticación y autorización robusto
- 📊 Flujos de trabajo personalizables
- 🔍 Motor de búsqueda avanzado (En desarrollo)
- 📈 Versionado de documentos
- 🏷️ Sistema de categorías y etiquetas
- 📝 Gestión de permisos granular
- 📨 Sistema de notificaciones (En desarrollo)

## 📋 Estado del Proyecto

### Módulos Implementados ✅

#### Core

- [x] Sistema Base
  - Configuración y estructura del proyecto
  - Manejo de errores y logging
  - Sistema de caché con Redis
  - Documentación con Swagger

#### Autenticación y Usuarios

- [x] Sistema de Autenticación
  - JWT Integration
  - Gestión de Sesiones
  - Rate Limiting

#### Organización

- [x] Gestión Empresarial
  - Estructura organizacional
  - Compañías
  - Sucursales
  - Departamentos

#### Gestión Documental

- [x] Documentos
  - CRUD básico
  - Versionamiento
  - Categorización
  - Etiquetado

#### Workflows

- [x] Motor de Flujos de Trabajo
  - Definición de flujos
  - Estados y transiciones
  - Asignación de tareas
  - Notificaciones básicas

### Módulos en Desarrollo 🚧

#### Motor de Búsqueda

- [ ] Indexación de contenido
- [ ] Búsqueda Full-Text
- [ ] Filtros avanzados
- [ ] Sistema de relevancia

#### Sistema de Notificaciones

- [ ] Notificaciones en tiempo real
- [ ] Múltiples canales (email, in-app)
- [ ] Plantillas personalizables
- [ ] Preferencias de usuario

### Módulos Pendientes ⏳

#### OCR y Procesamiento

- [ ] Reconocimiento de texto
- [ ] Procesamiento de documentos escaneados
- [ ] Extracción automática de metadatos

#### Reportes y Analytics

- [ ] Dashboards personalizables
- [ ] Métricas y KPIs
- [ ] Exportación multiformato

#### Integraciones

- [ ] APIs para terceros
- [ ] Webhooks
- [ ] Storage providers
- [ ] Servicios externos

## 🎯 Próximos Pasos

1. Completar implementación del motor de búsqueda
2. Desarrollar sistema de notificaciones avanzado
3. Implementar OCR y procesamiento de documentos
4. Mejorar cobertura de pruebas
5. Optimizar rendimiento y escalabilidad
6. Desarrollar módulo de reportes y analytics

## 🔧 Requisitos Previos

- Node.js (v18+)
- npm (v9+)
- MySQL (v8+)
- Redis

## 📦 Instalación

1. Clonar el repositorio

```bash
git clone <https://github.com/korozcolt/archive-master-backend.git>
cd archive-master
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar variables de entorno

- Crear archivo .env basado en .env.example
- Configurar credenciales de base de datos y Redis
- Establecer claves JWT y otros secretos

4. Iniciar base de datos

```bash
npm run migration:run
npm run seed
```

5. Iniciar servidor de desarrollo

```bash
npm run start:dev
```

## 🧪 Testing

```bash

# Pruebas unitarias

npm run test

# Pruebas e2e

npm run test:e2e

# Cobertura

npm run test:cov
```

## 📚 Documentación

La documentación de la API está disponible en:

- Desarrollo: <http://localhost:3000/api/docs>
- Producción: <https://tu-dominio.com/api/docs>

## 🤝 Contribuciones

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Crear Pull Request

### Guías de Contribución

- Seguir estándares de código establecidos
- Incluir pruebas para nueva funcionalidad
- Actualizar documentación según sea necesario
- Seguir convenciones de commits

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

## 📞 Contacto

Desarrollador: Kristian Orozco
Email: [ing.korozco@gmail.com](mailto:ing.korozco@gmail.com)
LinkedIn: [Kristian Orozco](https://www.linkedin.com/in/kristian-orozco-backend/)

## 🌟 Agradecimientos

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Redis](https://redis.io/)
- [Swagger](https://swagger.io/)

---

**🚀 Desarrollado con ❤️ para revolucionar la gestión documental**
