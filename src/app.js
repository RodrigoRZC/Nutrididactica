const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'nutrididactica',
    password: '12345',
    database: 'nutrididacticaDB'
};

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

// Servir archivos estáticos
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

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
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
            tipo: user.tipo
        };

        await connection.end();
        
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: req.session.user
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🥗 Catálogo disponible en http://localhost:${PORT}`);
});