# Nutrididactica - Catálogo de Productos Naturales

![Nutrididactica Banner](public/images/logo.png)

Una aplicación web desarrollada con **Node.js**, **Express** y **MySQL** que permite a los usuarios explorar, buscar y comprar productos para nutriólogos y personas en el área de la salus. Incluye autenticación de usuarios, gestión de carrito y control de inventario en tiempo real.

**Panel de administración completo • Carrito de compras • Gestión de stock • Autenticación segura**

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Funcionalidades

| Funcionalidad                   | Estado | Descripción |
|-------------------------------|--------|-----------|
| Catálogo con búsqueda en tiempo real | Done | Filtros instantáneos sin recargar |
| Carrito de compras (sesión)     | Done | Añadir, modificar y eliminar productos |
| Panel de administración completo | Done | Solo usuarios tipo `admin` |
| Gestión de productos            | Done | Crear, editar, eliminar + subida de imágenes |
| Gestión de categorías           | Done | Crear y eliminar categorías |
| Control de stock en tiempo real | Done | Actualización manual con un clic |
| Gestión de usuarios             | Done | Ver, editar y eliminar cuentas |
| Registro e inicio de sesión     | Done | Con hash seguro (bcrypt) |
| Diseño 100% responsive          | Done | Se ve perfecto en móvil y escritorio |

---

## Tecnologías utilizadas

- **Backend**: Node.js + Express.js
- **Base de datos**: MySQL (`mysql2/promise`)
- **Autenticación**: bcrypt + express-session
- **Subida de archivos**: Multer
- **Frontend**: HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript
- **Arquitectura**: MVC-inspired (controllers, models, routes)

---
