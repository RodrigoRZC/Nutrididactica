const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer'); // ✅ AQUÍ ESTÁ LA IMPORTACIÓN CORRECTA
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'nutrididactica',
    password: '12345',
    database: 'nutrididacticaDB'
};

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public/uploads');
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Validar tipos de archivo
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    secret: 'nutrididactica-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Servir archivos estáticos (incluyendo uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para pasar datos de usuario a las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Inicializar carrito en sesión si no existe
app.use((req, res, next) => {
    if (!req.session.carrito) {
        req.session.carrito = [];
    }
    next();
});

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'views/index.html');
    res.sendFile(htmlPath);
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin.html');
    res.sendFile(htmlPath);
});

// Ruta para agregar productos
app.get('/admin/productos/nuevo', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin-productos.html');
    res.sendFile(htmlPath);
});

// Ruta para la gestión de categorías
app.get('/admin/categorias', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin-categorias.html');
    res.sendFile(htmlPath);
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        // Redirigir al admin si es administrador, al home si es usuario normal
        if (req.session.user.tipo === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/');
        }
    }
    const htmlPath = path.join(__dirname, 'views/login.html');
    res.sendFile(htmlPath);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

// API para productos
app.get('/api/productos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
       
        const [productos] = await connection.execute(`
            SELECT
                name as nombre,
                description as descripcion,
                price as precio,
                stock,
                imagen
            FROM PRODUCTS
            ORDER BY name ASC
        `);
       
        await connection.end();
       
        res.json({
            success: true,
            productos: productos
        });
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.json({
            success: false,
            message: `Error al obtener productos: ${error.message}`,
            productos: []
        });
    }
});

app.get('/api/productos/buscar', async (req, res) => {
    try {
        const { q } = req.query;
        const connection = await mysql.createConnection(dbConfig);
       
        const [productos] = await connection.execute(`
            SELECT
                name as nombre,
                description as descripcion,
                price as precio,
                stock,
                imagen
            FROM PRODUCTS
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY name ASC
        `, [`%${q}%`, `%${q}%`]);
       
        await connection.end();
       
        res.json({
            success: true,
            productos: productos
        });
    } catch (error) {
        res.json({
            success: false,
            message: `Error en la búsqueda: ${error.message}`,
            productos: []
        });
    }
});

// API para carrito
app.get('/api/carrito', (req, res) => {
    res.json({
        success: true,
        carrito: req.session.carrito || []
    });
});

app.post('/api/carrito/agregar', (req, res) => {
    try {
        console.log('📦 Received carrito/agregar request');
        console.log('📦 Request body:', req.body);
       
        // Verificar que el body esté parseado correctamente
        if (!req.body) {
            console.error('❌ No se recibió body en la request');
            return res.json({
                success: false,
                message: 'No se recibieron datos'
            });
        }
        const { producto, cantidad = 1 } = req.body;
       
        if (!producto) {
            console.error('❌ Producto es requerido');
            return res.json({
                success: false,
                message: 'Producto es requerido'
            });
        }
        // Validar campos del producto
        if (!producto.nombre || !producto.precio) {
            console.error('❌ Campos del producto incompletos:', producto);
            return res.json({
                success: false,
                message: 'Campos del producto incompletos'
            });
        }
        // Asegurarse de que el carrito existe en la sesión
        if (!req.session.carrito) {
            console.log('🛒 Inicializando carrito en sesión');
            req.session.carrito = [];
        }
        const carrito = req.session.carrito;
        const productoExistente = carrito.find(item => item.nombre === producto.nombre);
        if (productoExistente) {
            console.log('📈 Incrementando cantidad de producto existente');
            productoExistente.cantidad += parseInt(cantidad);
        } else {
            console.log('🆕 Agregando nuevo producto al carrito');
            carrito.push({
                nombre: String(producto.nombre),
                descripcion: String(producto.descripcion || ''),
                precio: parseFloat(producto.precio),
                cantidad: parseInt(cantidad),
                imagen: String(producto.imagen || ''),
                stock: parseInt(producto.stock) || 0
            });
        }
        req.session.carrito = carrito;
       
        console.log('✅ Carrito actualizado:', carrito);
        res.json({
            success: true,
            message: 'Producto agregado al carrito',
            carrito: carrito
        });
       
    } catch (error) {
        console.error('❌ Error en carrito/agregar:', error);
        res.json({
            success: false,
            message: `Error al agregar producto: ${error.message}`
        });
    }
});

app.post('/api/carrito/actualizar', (req, res) => {
    try {
        const { nombre, cantidad } = req.body;
       
        const carrito = req.session.carrito;
        const producto = carrito.find(item => item.nombre === nombre);
        if (producto) {
            if (cantidad <= 0) {
                req.session.carrito = carrito.filter(item => item.nombre !== nombre);
            } else {
                producto.cantidad = cantidad;
            }
        }
        res.json({
            success: true,
            carrito: req.session.carrito
        });
    } catch (error) {
        res.json({
            success: false,
            message: `Error al actualizar carrito: ${error.message}`
        });
    }
});

app.post('/api/carrito/eliminar', (req, res) => {
    try {
        const { nombre } = req.body;
       
        req.session.carrito = req.session.carrito.filter(item => item.nombre !== nombre);
        res.json({
            success: true,
            message: 'Producto eliminado del carrito',
            carrito: req.session.carrito
        });
    } catch (error) {
        res.json({
            success: false,
            message: `Error al eliminar producto: ${error.message}`
        });
    }
});

app.post('/api/carrito/limpiar', (req, res) => {
    try {
        req.session.carrito = [];
       
        res.json({
            success: true,
            message: 'Carrito limpiado',
            carrito: []
        });
    } catch (error) {
        res.json({
            success: false,
            message: `Error al limpiar carrito: ${error.message}`
        });
    }
});

// API para crear pedidos con items y actualizar stock
app.post('/api/pedidos/crear', async (req, res) => {
    try {
        const { total, productos } = req.body;
       
        console.log('🛒 Recibiendo solicitud de pedido:');
        console.log('💰 Total:', total);
        console.log('📦 Productos:', productos);
       
        // Verificar que el usuario esté logueado
        if (!req.session.user) {
            return res.json({
                success: false,
                message: 'Debes iniciar sesión para crear un pedido'
            });
        }
        const userEmail = req.session.user.email;
        const connection = await mysql.createConnection(dbConfig);
       
        // Iniciar transacción
        await connection.beginTransaction();
       
        try {
            // 1. Insertar el pedido en la tabla ORDERS
            const [orderResult] = await connection.execute(
                'INSERT INTO ORDERS (email, total, status) VALUES (?, ?, ?)',
                [userEmail, total, 'completado']
            );
           
            const orderId = orderResult.insertId;
            console.log('✅ Pedido principal creado con ID:', orderId);
           
            // 2. Insertar los items del pedido en la tabla ORDER_ITEMS
            if (productos && productos.length > 0) {
                console.log(`📝 Insertando ${productos.length} items en ORDER_ITEMS...`);
               
                for (const producto of productos) {
                    await connection.execute(
                        'INSERT INTO ORDER_ITEMS (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)',
                        [orderId, producto.nombre, producto.cantidad, producto.precio]
                    );
                    console.log(`✅ Item agregado: ${producto.nombre} x${producto.cantidad}`);
                   
                    // 3. ACTUALIZAR STOCK del producto
                    const [updateResult] = await connection.execute(
                        'UPDATE PRODUCTS SET stock = stock - ? WHERE name = ? AND stock >= ?',
                        [producto.cantidad, producto.nombre, producto.cantidad]
                    );
                   
                    if (updateResult.affectedRows === 0) {
                        // Si no se pudo actualizar el stock (stock insuficiente), revertir transacción
                        throw new Error(`Stock insuficiente para el producto: ${producto.nombre}`);
                    }
                   
                    console.log(`📉 Stock actualizado: ${producto.nombre} -${producto.cantidad} unidades`);
                   
                    // 4. Obtener el nuevo stock para enviar al frontend
                    const [stockResult] = await connection.execute(
                        'SELECT stock FROM PRODUCTS WHERE name = ?',
                        [producto.nombre]
                    );
                   
                    if (stockResult.length > 0) {
                        producto.nuevo_stock = stockResult[0].stock;
                        console.log(`📊 Nuevo stock de ${producto.nombre}: ${producto.nuevo_stock}`);
                    }
                }
            }
           
            // Confirmar transacción
            await connection.commit();
            await connection.end();
           
            console.log('🎉 Pedido completado exitosamente');
           
            res.json({
                success: true,
                message: 'Pedido creado exitosamente y stock actualizado',
                order_id: orderId,
                total_items: productos ? productos.length : 0,
                productos_actualizados: productos // Incluir productos con nuevo stock
            });
           
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            await connection.end();
            console.error('❌ Error en transacción:', error);
           
            res.json({
                success: false,
                message: `Error al crear el pedido: ${error.message}`
            });
        }
       
    } catch (error) {
        console.error('❌ Error creando pedido:', error);
        res.json({
            success: false,
            message: `Error al crear el pedido: ${error.message}`
        });
    }
});

// API para autenticación
app.post('/api/register', async (req, res) => {
    try {
        const { email, name, phone, password } = req.body;
       
        if (!email || !name || !password) {
            return res.json({
                success: false,
                message: 'Email, nombre y contraseña son obligatorios'
            });
        }
        const connection = await mysql.createConnection(dbConfig);
       
        const [existingUsers] = await connection.execute(
            'SELECT email FROM USERS WHERE email = ?',
            [email]
        );
       
        if (existingUsers.length > 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        await connection.execute(
            'INSERT INTO USERS (email, name, phone, password_hash, tipo) VALUES (?, ?, ?, ?, ?)',
            [email, name, phone, password_hash, 'user']
        );
       
        await connection.end();
       
        res.json({
            success: true,
            message: 'Usuario registrado exitosamente'
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.json({
            success: false,
            message: `Error en el registro: ${error.message}`
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
       
        if (!email || !password) {
            return res.json({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        }
        const connection = await mysql.createConnection(dbConfig);
       
        const [users] = await connection.execute(
            'SELECT * FROM USERS WHERE email = ?',
            [email]
        );
       
        if (users.length === 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        const user = users[0];
       
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
       
        if (!isPasswordValid) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }
        req.session.user = {
            email: user.email,
            name: user.name,
            phone: user.phone,
            tipo: user.tipo  // Asegurar que el tipo se guarda en sesión
        };
        await connection.end();
       
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: req.session.user,
            isAdmin: user.tipo === 'admin'  // Agregar esta propiedad
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.json({
            success: false,
            message: `Error en el inicio de sesión: ${error.message}`
        });
    }
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: false,
            message: 'No hay usuario logueado'
        });
    }
});

// API para estadísticas del admin
app.get('/api/admin/estadisticas', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Obtener estadísticas básicas
        const [totalProductos] = await connection.execute('SELECT COUNT(*) as total FROM PRODUCTS');
        const [totalUsuarios] = await connection.execute('SELECT COUNT(*) as total FROM USERS');
        const [pedidosHoy] = await connection.execute(`
            SELECT COUNT(*) as total FROM ORDERS 
            WHERE DATE(created_at) = CURDATE()
        `);
        const [ingresosMes] = await connection.execute(`
            SELECT COALESCE(SUM(total), 0) as total FROM ORDERS 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        `);

        await connection.end();

        res.json({
            success: true,
            estadisticas: {
                totalProductos: totalProductos[0].total,
                totalUsuarios: totalUsuarios[0].total,
                pedidosHoy: pedidosHoy[0].total,
                ingresosMes: parseFloat(ingresosMes[0].total)
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.json({
            success: false,
            message: `Error al obtener estadísticas: ${error.message}`
        });
    }
});

// API para categorías - Obtener todas las categorías
app.get('/api/admin/categorias', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [categorias] = await connection.execute(`
            SELECT name, description 
            FROM CATEGORIES 
            ORDER BY name ASC
        `);

        await connection.end();

        res.json({
            success: true,
            categorias: categorias
        });

    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.json({
            success: false,
            message: `Error al obtener categorías: ${error.message}`
        });
    }
});

// API para categorías - Crear nueva categoría
app.post('/api/admin/categorias', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name, description } = req.body;

        if (!name || !description) {
            return res.json({
                success: false,
                message: 'Nombre y descripción son obligatorios'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si la categoría ya existe
        const [existingCategories] = await connection.execute(
            'SELECT name FROM CATEGORIES WHERE name = ?',
            [name]
        );

        if (existingCategories.length > 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        // Insertar nueva categoría
        await connection.execute(
            'INSERT INTO CATEGORIES (name, description) VALUES (?, ?)',
            [name, description]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Categoría creada exitosamente'
        });

    } catch (error) {
        console.error('Error creando categoría:', error);
        res.json({
            success: false,
            message: `Error al crear categoría: ${error.message}`
        });
    }
});

// API para categorías - Eliminar categoría
app.delete('/api/admin/categorias/:name', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si hay productos usando esta categoría
        const [productsUsingCategory] = await connection.execute(
            'SELECT COUNT(*) as count FROM PRODUCTS WHERE category_name = ?',
            [name]
        );

        if (productsUsingCategory[0].count > 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'No se puede eliminar la categoría porque hay productos asociados a ella'
            });
        }

        // Eliminar la categoría
        await connection.execute(
            'DELETE FROM CATEGORIES WHERE name = ?',
            [name]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.json({
            success: false,
            message: `Error al eliminar categoría: ${error.message}`
        });
    }
});

// API para obtener categorías (para el dropdown)
app.get('/api/admin/categorias-lista', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [categorias] = await connection.execute(`
            SELECT name 
            FROM CATEGORIES 
            ORDER BY name ASC
        `);

        await connection.end();

        res.json({
            success: true,
            categorias: categorias
        });

    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.json({
            success: false,
            message: `Error al obtener categorías: ${error.message}`
        });
    }
});

// API para productos - Crear nuevo producto CON SUBIDA DE IMAGEN
app.post('/api/admin/productos', upload.single('imagen'), async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            // Eliminar archivo subido si no está autorizado
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name, description, price, stock, category_name } = req.body;

        // Validaciones
        if (!name || !price || !stock) {
            // Eliminar archivo subido si hay error de validación
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Nombre, precio y stock son obligatorios'
            });
        }

        if (price <= 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

        if (stock < 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'El stock no puede ser negativo'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el producto ya existe
        const [existingProducts] = await connection.execute(
            'SELECT name FROM PRODUCTS WHERE name = ?',
            [name]
        );

        if (existingProducts.length > 0) {
            await connection.end();
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }

        // Verificar si la categoría existe (si se proporciona)
        if (category_name) {
            const [existingCategories] = await connection.execute(
                'SELECT name FROM CATEGORIES WHERE name = ?',
                [category_name]
            );

            if (existingCategories.length === 0) {
                await connection.end();
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.json({
                    success: false,
                    message: 'La categoría especificada no existe'
                });
            }
        }

        // Construir la ruta de la imagen
        let imagenPath = null;
        if (req.file) {
            imagenPath = '/uploads/' + req.file.filename;
        }

        // Insertar nuevo producto
        await connection.execute(
            'INSERT INTO PRODUCTS (name, description, price, stock, imagen, category_name) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, stock, imagenPath, category_name]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Producto creado exitosamente',
            imagen: imagenPath
        });

    } catch (error) {
        console.error('Error creando producto:', error);
        // Eliminar archivo subido si hay error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.json({
            success: false,
            message: `Error al crear producto: ${error.message}`
        });
    }
});



//EDITAR_PRODUCTOS-ADMIN
// API para obtener todos los productos (admin)
app.get('/api/admin/productos', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [productos] = await connection.execute(`
            SELECT 
                p.name,
                p.description,
                p.price,
                p.stock,
                p.imagen,
                p.category_name,
                c.description as category_description
            FROM PRODUCTS p
            LEFT JOIN CATEGORIES c ON p.category_name = c.name
            ORDER BY p.name ASC
        `);

        await connection.end();

        res.json({
            success: true,
            productos: productos
        });

    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.json({
            success: false,
            message: `Error al obtener productos: ${error.message}`
        });
    }
});

// API para actualizar producto (sin stock)
app.put('/api/admin/productos/:name', upload.single('imagen'), async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name } = req.params;
        const { description, price, category_name } = req.body;

        // Validaciones
        if (!name || !price) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Nombre y precio son obligatorios'
            });
        }

        if (price <= 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el producto existe
        const [existingProducts] = await connection.execute(
            'SELECT name FROM PRODUCTS WHERE name = ?',
            [name]
        );

        if (existingProducts.length === 0) {
            await connection.end();
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar si la categoría existe (si se proporciona)
        if (category_name) {
            const [existingCategories] = await connection.execute(
                'SELECT name FROM CATEGORIES WHERE name = ?',
                [category_name]
            );

            if (existingCategories.length === 0) {
                await connection.end();
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.json({
                    success: false,
                    message: 'La categoría especificada no existe'
                });
            }
        }

        // Construir la consulta de actualización
        let updateFields = [];
        let updateValues = [];

        updateFields.push('description = ?');
        updateValues.push(description || '');

        updateFields.push('price = ?');
        updateValues.push(price);

        updateFields.push('category_name = ?');
        updateValues.push(category_name || null);

        // Si hay nueva imagen, actualizarla
        if (req.file) {
            // Obtener la imagen anterior para eliminarla
            const [oldProduct] = await connection.execute(
                'SELECT imagen FROM PRODUCTS WHERE name = ?',
                [name]
            );

            // Eliminar la imagen anterior si existe
            if (oldProduct[0].imagen) {
                const oldImagePath = path.join(__dirname, 'public', oldProduct[0].imagen);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            const imagenPath = '/uploads/' + req.file.filename;
            updateFields.push('imagen = ?');
            updateValues.push(imagenPath);
        }

        updateValues.push(name);

        // Actualizar producto
        await connection.execute(
            `UPDATE PRODUCTS SET ${updateFields.join(', ')} WHERE name = ?`,
            updateValues
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando producto:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.json({
            success: false,
            message: `Error al actualizar producto: ${error.message}`
        });
    }
});

// API para eliminar producto
app.delete('/api/admin/productos/:name', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el producto existe
        const [existingProducts] = await connection.execute(
            'SELECT name, imagen FROM PRODUCTS WHERE name = ?',
            [name]
        );

        if (existingProducts.length === 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar si hay pedidos con este producto
        const [ordersWithProduct] = await connection.execute(
            'SELECT COUNT(*) as count FROM ORDER_ITEMS WHERE product_name = ?',
            [name]
        );

        if (ordersWithProduct[0].count > 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'No se puede eliminar el producto porque hay pedidos asociados a él'
            });
        }

        // Eliminar la imagen del producto si existe
        const product = existingProducts[0];
        if (product.imagen) {
            const imagePath = path.join(__dirname, 'public', product.imagen);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Eliminar el producto
        await connection.execute(
            'DELETE FROM PRODUCTS WHERE name = ?',
            [name]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.json({
            success: false,
            message: `Error al eliminar producto: ${error.message}`
        });
    }
});

// Ruta para ver y gestionar productos
app.get('/admin/productos', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin-productos-lista.html');
    res.sendFile(htmlPath);
});
//STOCK-ADMIN
// API para actualizar solo el stock de un producto
app.patch('/api/admin/productos/:name/stock', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { name } = req.params;
        const { stock } = req.body;

        // Validaciones
        if (!stock && stock !== 0) {
            return res.json({
                success: false,
                message: 'El stock es obligatorio'
            });
        }

        if (stock < 0) {
            return res.json({
                success: false,
                message: 'El stock no puede ser negativo'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el producto existe
        const [existingProducts] = await connection.execute(
            'SELECT name FROM PRODUCTS WHERE name = ?',
            [name]
        );

        if (existingProducts.length === 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Actualizar solo el stock
        await connection.execute(
            'UPDATE PRODUCTS SET stock = ? WHERE name = ?',
            [stock, name]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Stock actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando stock:', error);
        res.json({
            success: false,
            message: `Error al actualizar stock: ${error.message}`
        });
    }
});

// Ruta para control de stock
app.get('/admin/stock', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin-stock.html');
    res.sendFile(htmlPath);
});

//EDITAR_USER
// API para obtener todos los usuarios (admin) - VERSIÓN CORREGIDA
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [usuarios] = await connection.execute(`
            SELECT 
                email,
                name,
                phone,
                tipo
            FROM USERS 
            ORDER BY name ASC
        `);

        await connection.end();

        res.json({
            success: true,
            usuarios: usuarios
        });

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.json({
            success: false,
            message: `Error al obtener usuarios: ${error.message}`
        });
    }
});

// API para actualizar usuario
app.put('/api/admin/usuarios/:email', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { email } = req.params;
        const { name, phone, tipo, newPassword } = req.body;

        // Validaciones
        if (!name || !email) {
            return res.json({
                success: false,
                message: 'Nombre y email son obligatorios'
            });
        }

        if (tipo && !['user', 'admin'].includes(tipo)) {
            return res.json({
                success: false,
                message: 'Tipo de usuario inválido'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el usuario existe
        const [existingUsers] = await connection.execute(
            'SELECT email FROM USERS WHERE email = ?',
            [email]
        );

        if (existingUsers.length === 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Construir la consulta de actualización
        let updateFields = [];
        let updateValues = [];

        updateFields.push('name = ?');
        updateValues.push(name);

        updateFields.push('phone = ?');
        updateValues.push(phone || null);

        updateFields.push('tipo = ?');
        updateValues.push(tipo || 'user');

        // Si se proporciona nueva contraseña, hashearla
        if (newPassword && newPassword.trim() !== '') {
            if (newPassword.length < 6) {
                await connection.end();
                return res.json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(newPassword, saltRounds);
            updateFields.push('password_hash = ?');
            updateValues.push(password_hash);
        }

        updateValues.push(email);

        // Actualizar usuario
        await connection.execute(
            `UPDATE USERS SET ${updateFields.join(', ')} WHERE email = ?`,
            updateValues
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.json({
            success: false,
            message: `Error al actualizar usuario: ${error.message}`
        });
    }
});

// API para eliminar usuario
app.delete('/api/admin/usuarios/:email', async (req, res) => {
    try {
        // Verificar si el usuario es admin
        if (!req.session.user || req.session.user.tipo !== 'admin') {
            return res.json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { email } = req.params;

        // No permitir eliminar al propio usuario admin
        if (email === req.session.user.email) {
            return res.json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el usuario existe
        const [existingUsers] = await connection.execute(
            'SELECT email FROM USERS WHERE email = ?',
            [email]
        );

        if (existingUsers.length === 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar si hay pedidos asociados al usuario
        const [userOrders] = await connection.execute(
            'SELECT COUNT(*) as count FROM ORDERS WHERE email = ?',
            [email]
        );

        if (userOrders[0].count > 0) {
            await connection.end();
            return res.json({
                success: false,
                message: 'No se puede eliminar el usuario porque tiene pedidos asociados'
            });
        }

        // Eliminar direcciones del usuario
        await connection.execute(
            'DELETE FROM ADDRESSES WHERE email = ?',
            [email]
        );

        // Eliminar el usuario
        await connection.execute(
            'DELETE FROM USERS WHERE email = ?',
            [email]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.json({
            success: false,
            message: `Error al eliminar usuario: ${error.message}`
        });
    }
});

// Ruta para gestión de usuarios
app.get('/admin/usuarios', (req, res) => {
    // Verificar si el usuario está logueado y es admin
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.redirect('/login');
    }
    
    const htmlPath = path.join(__dirname, 'views/admin-usuarios.html');
    res.sendFile(htmlPath);
});







// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🥗 Catálogo disponible en http://localhost:${PORT}`);
    console.log(`⚙️  Panel Admin disponible en http://localhost:${PORT}/admin`);
    console.log(`📦 Agregar productos: http://localhost:${PORT}/admin/productos/nuevo`);
    console.log(`🏷️  Gestión categorías: http://localhost:${PORT}/admin/categorias`);
});