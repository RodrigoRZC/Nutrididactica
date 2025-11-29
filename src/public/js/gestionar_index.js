// Variables globales
        let todosLosProductos = [];
        let usuarioLogueado = null;
        let carrito = [];

        // Inicializar cuando carga la página
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Página cargada - inicializando...');
            cargarUsuario();
            cargarProductos();
            cargarCarrito();
            
            // Configurar eventos del carrito
            document.getElementById('closeCarrito').addEventListener('click', cerrarCarrito);
            document.getElementById('overlay').addEventListener('click', cerrarCarrito);
        });

        // Funciones para abrir y cerrar el carrito
        function abrirCarrito() {
            document.getElementById('carritoSidebar').classList.add('open');
            document.getElementById('overlay').classList.add('active');
        }

        function cerrarCarrito() {
            document.getElementById('carritoSidebar').classList.remove('open');
            document.getElementById('overlay').classList.remove('active');
        }

        // Cargar información del usuario
        async function cargarUsuario() {
            try {
                const response = await fetch('/api/user');
                const data = await response.json();

                if (data.success) {
                    usuarioLogueado = data.user;
                    mostrarUsuarioLogueado();
                } else {
                    mostrarBotonLogin();
                }
            } catch (error) {
                console.error('Error cargando usuario:', error);
                mostrarBotonLogin();
            }
        }

        // Cargar carrito desde el servidor
        async function cargarCarrito() {
            try {
                console.log('Cargando carrito...');
                const response = await fetch('/api/carrito');
                const data = await response.json();

                if (data.success) {
                    carrito = data.carrito;
                    console.log('Carrito cargado:', carrito);
                    actualizarContadorCarrito();
                    actualizarVistaCarrito();
                    
                    // También actualizar la interfaz de usuario
                    if (usuarioLogueado) {
                        mostrarUsuarioLogueado();
                    } else {
                        mostrarBotonLogin();
                    }
                }
            } catch (error) {
                console.error('Error cargando carrito:', error);
            }
        }

        // Actualizar contador del carrito
        function actualizarContadorCarrito() {
            const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
            console.log('Total items en carrito:', totalItems);
            
            // Actualizar el contador en el botón del carrito
            const cartButtons = document.querySelectorAll('.cart-btn');
            
            cartButtons.forEach(button => {
                let existingCount = button.querySelector('.cart-count');
                
                if (totalItems > 0) {
                    if (existingCount) {
                        existingCount.textContent = totalItems;
                    } else {
                        const newCount = document.createElement('span');
                        newCount.className = 'cart-count';
                        newCount.textContent = totalItems;
                        button.appendChild(newCount);
                    }
                } else if (existingCount) {
                    existingCount.remove();
                }
            });
        }

        // Función para actualizar la vista del carrito - CON VALIDACIÓN DE SESIÓN
        function actualizarVistaCarrito() {
            const carritoContent = document.getElementById('carritoContent');
            const carritoFooter = document.getElementById('carritoFooter');
            
            if (carrito.length === 0) {
                carritoContent.innerHTML = `
                    <div class="carrito-vacio">
                        <div class="icon">🛒</div>
                        <h3>Tu carrito está vacío</h3>
                        <p>Agrega productos desde el catálogo</p>
                    </div>
                `;
                carritoFooter.innerHTML = '';
                return;
            }

            let html = '';
            let subtotal = 0;
            let totalItems = 0;
            
            // Mostrar cada producto del carrito
            carrito.forEach(item => {
                const itemSubtotal = item.precio * item.cantidad;
                subtotal += itemSubtotal;
                totalItems += item.cantidad;
                
                html += `
                    <div class="carrito-item">
                        <div class="carrito-item-imagen">
                            ${getIconoProducto(item.nombre, item.descripcion)}
                        </div>
                        <div class="carrito-item-info">
                            <div class="carrito-item-nombre">${item.nombre}</div>
                            <div class="carrito-item-precio">$${item.precio.toFixed(2)} c/u</div>
                        </div>
                        <div class="carrito-item-controls">
                            <div class="cantidad-control">
                                <button class="btn-cantidad restar" onclick="cambiarCantidad('${item.nombre}', ${item.cantidad - 1})">-</button>
                                <span class="cantidad-number">${item.cantidad}</span>
                                <button class="btn-cantidad" onclick="cambiarCantidad('${item.nombre}', ${item.cantidad + 1})">+</button>
                            </div>
                            <div class="carrito-item-subtotal">
                                $${itemSubtotal.toFixed(2)}
                            </div>
                            <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.nombre}')">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
            
            carritoContent.innerHTML = html;
            
            // Mostrar mensaje de login requerido si el usuario no está logueado
            const accionesPago = usuarioLogueado ? `
                <button class="btn-pagar" onclick="procesarPago()">💳 Proceder al Pago</button>
            ` : `
                <div class="login-required">
                    <p>🔐 Inicia sesión para completar tu compra</p>
                    <a href="/login" class="btn-login-required">🔐 Iniciar Sesión</a>
                </div>
            `;
            
            carritoFooter.innerHTML = `
                <div class="resumen-pedido">
                    <div class="resumen-item">
                        <span>Productos:</span>
                        <span>${totalItems}</span>
                    </div>
                    <div class="resumen-item">
                        <span>Subtotal:</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item">
                        <span>Envío:</span>
                        <span>Gratis</span>
                    </div>
                    <div class="resumen-total">
                        <span>Total:</span>
                        <span class="total-monto">$${subtotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="acciones-carrito">
                    ${accionesPago}
                    <button class="btn-limpiar" onclick="limpiarCarrito()">🗑️ Vaciar Carrito</button>
                </div>
            `;
        }

        // Mostrar información del usuario logueado
        function mostrarUsuarioLogueado() {
            const userSection = document.getElementById('userSection');
            const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
            
            userSection.innerHTML = `
                <button class="cart-btn" onclick="abrirCarrito()">
                    🛒 Carrito
                    ${totalItems > 0 ? `<span class="cart-count">${totalItems}</span>` : ''}
                </button>
                <div class="user-info">
                    <div class="user-welcome">¡Hola!</div>
                    <div class="user-name">${usuarioLogueado.name}</div>
                </div>
                <a href="/logout" class="logout-btn">
                    🚪 Cerrar Sesión
                </a>
            `;
            
            // Actualizar también la vista del carrito para reflejar el estado de login
            actualizarVistaCarrito();
        }

        // Mostrar botón de login cuando no hay usuario
        function mostrarBotonLogin() {
            const userSection = document.getElementById('userSection');
            const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
            
            userSection.innerHTML = `
                <button class="cart-btn" onclick="abrirCarrito()">
                    🛒 Carrito
                    ${totalItems > 0 ? `<span class="cart-count">${totalItems}</span>` : ''}
                </button>
                <a href="/login" class="login-btn">
                    🔐 Iniciar Sesión
                </a>
            `;
            
            // Actualizar también la vista del carrito para reflejar el estado de login
            actualizarVistaCarrito();
        }

        // FUNCIÓN TEMPORAL: Agregar producto al carrito (modo offline)
        async function agregarAlCarrito(producto) {
            try {
                console.log('🔍 DEBUG: Iniciando agregarAlCarrito...');
                console.log('🔍 DEBUG: Producto recibido:', producto);
                
                // Verificar que el producto tenga los campos necesarios
                if (!producto.nombre || !producto.precio) {
                    console.error('❌ Producto incompleto:', producto);
                    mostrarMensaje('❌ Error: Producto incompleto', 'error');
                    return;
                }

                // Preparar el producto para enviar
                const productoParaEnviar = {
                    nombre: String(producto.nombre),
                    descripcion: String(producto.descripcion || 'Sin descripción'),
                    precio: parseFloat(producto.precio),
                    stock: parseInt(producto.stock) || 0,
                    imagen: String(producto.imagen || '')
                };

                console.log('🔍 DEBUG: Producto preparado:', productoParaEnviar);
                console.log('🔍 DEBUG: URL destino: /api/carrito/agregar');

                // Intentar la petición con timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

                const response = await fetch('/api/carrito/agregar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        producto: productoParaEnviar,
                        cantidad: 1 
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                console.log('🔍 DEBUG: Response status:', response.status);
                console.log('🔍 DEBUG: Response ok:', response.ok);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('🔍 DEBUG: Response data:', data);

                if (data.success) {
                    carrito = data.carrito;
                    console.log('✅ Producto agregado. Carrito actual:', carrito);
                    
                    actualizarContadorCarrito();
                    actualizarVistaCarrito();
                    
                    if (usuarioLogueado) {
                        mostrarUsuarioLogueado();
                    } else {
                        mostrarBotonLogin();
                    }
                    
                    mostrarMensaje('✅ Producto agregado al carrito');
                    abrirCarrito();
                } else {
                    throw new Error(data.message || 'Error del servidor');
                }
                
            } catch (error) {
                console.error('❌ Error completo en agregarAlCarrito:', error);
                
                if (error.name === 'AbortError') {
                    console.error('❌ Timeout: La petición tardó demasiado');
                    mostrarMensaje('❌ Error de timeout - Servidor no responde', 'error');
                } else if (error.name === 'TypeError') {
                    console.error('❌ Error de red:', error.message);
                    mostrarMensaje('❌ Error de red - Verifica tu conexión', 'error');
                } else {
                    console.error('❌ Error específico:', error.message);
                    mostrarMensaje(`❌ Error: ${error.message}`, 'error');
                }
            }
        }

        // Función para cambiar la cantidad de un producto
        async function cambiarCantidad(nombre, nuevaCantidad) {
            try {
                const response = await fetch('/api/carrito/actualizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, cantidad: nuevaCantidad })
                });

                const data = await response.json();

                if (data.success) {
                    carrito = data.carrito;
                    actualizarContadorCarrito();
                    actualizarVistaCarrito();
                    mostrarMensaje('✅ Cantidad actualizada', 'success');
                }
            } catch (error) {
                console.error('Error actualizando cantidad:', error);
                mostrarMensaje('❌ Error al actualizar', 'error');
            }
        }

        // Función para eliminar un producto del carrito
        async function eliminarDelCarrito(nombre) {
            try {
                const response = await fetch('/api/carrito/eliminar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre })
                });

                const data = await response.json();

                if (data.success) {
                    carrito = data.carrito;
                    actualizarContadorCarrito();
                    actualizarVistaCarrito();
                    mostrarMensaje('🗑️ Producto eliminado', 'success');
                }
            } catch (error) {
                console.error('Error eliminando producto:', error);
                mostrarMensaje('❌ Error al eliminar', 'error');
            }
        }

        // Función para limpiar el carrito
        async function limpiarCarrito() {
            try {
                const response = await fetch('/api/carrito/limpiar', {
                    method: 'POST'
                });

                const data = await response.json();

                if (data.success) {
                    carrito = [];
                    actualizarContadorCarrito();
                    actualizarVistaCarrito();
                    mostrarMensaje('🗑️ Carrito vaciado', 'success');
                }
            } catch (error) {
                console.error('Error limpiando carrito:', error);
                mostrarMensaje('❌ Error al vaciar carrito', 'error');
            }
        }

        // Función para procesar el pago - CON ACTUALIZACIÓN DE STOCK
        async function procesarPago() {
            // Verificar si el usuario está logueado
            if (!usuarioLogueado) {
                mostrarMensaje('🔐 Debes iniciar sesión para realizar el pago', 'error');
                
                setTimeout(() => {
                    if (confirm('¿Deseas ir a la página de inicio de sesión?')) {
                        window.location.href = '/login';
                    }
                }, 1000);
                return;
            }

            if (carrito.length === 0) {
                mostrarMensaje('🛒 Tu carrito está vacío', 'error');
                return;
            }

            // Calcular el total y preparar datos
            const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const totalProductos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
            
            // Mostrar confirmación antes de proceder
            const confirmarPago = confirm(
                `¿Confirmas tu pedido?\n\n` +
                `📦 Productos: ${totalProductos} items\n` +
                `🛍️ Artículos diferentes: ${carrito.length}\n` +
                `💰 Total: $${total.toFixed(2)}\n\n` +
                `⚠️ Esta acción disminuirá el stock disponible de los productos\n` +
                `Se creará un pedido a nombre de: ${usuarioLogueado.name}`
            );

            if (!confirmarPago) {
                mostrarMensaje('❌ Pedido cancelado', 'error');
                return;
            }

            mostrarMensaje('💳 Procesando tu pago y actualizando stock...', 'success');

            try {
                // Deshabilitar el botón de pago temporalmente
                const btnPagar = document.querySelector('.btn-pagar');
                if (btnPagar) {
                    btnPagar.disabled = true;
                    btnPagar.textContent = '⏳ Procesando...';
                }

                // Preparar los productos para enviar
                const productosParaEnviar = carrito.map(item => ({
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    precio: item.precio
                }));

                console.log('📤 Enviando pedido al servidor:', {
                    total: total,
                    productos: productosParaEnviar
                });

                // Enviar el pedido al servidor
                const response = await fetch('/api/pedidos/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        total: total,
                        productos: productosParaEnviar
                    })
                });

                const data = await response.json();
                console.log('📥 Respuesta del servidor:', data);

                if (data.success) {
                    // Mostrar resumen completo del pedido con información de stock actualizado
                    setTimeout(() => {
                        const resumenProductos = carrito.map(item => {
                            const productoActualizado = data.productos_actualizados?.find(p => p.nombre === item.nombre);
                            const nuevoStock = productoActualizado?.nuevo_stock || 'N/A';
                            
                            return `   • ${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)} - Stock restante: ${nuevoStock}`;
                        }).join('\n');
                        
                        alert(
                            `🎉 ¡Pedido Confirmado y Stock Actualizado!\n\n` +
                            `📦 Número de pedido: #${data.order_id}\n` +
                            `👤 Cliente: ${usuarioLogueado.name}\n` +
                            `📧 Email: ${usuarioLogueado.email}\n` +
                            `💰 Total pagado: $${total.toFixed(2)}\n` +
                            `📋 Productos (${data.total_items}):\n${resumenProductos}\n` +
                            `🕒 Fecha: ${new Date().toLocaleString()}\n\n` +
                            `✅ Stock actualizado correctamente\n` +
                            `¡Gracias por tu compra en Nutrididactica!`
                        );
                    }, 1000);

                    mostrarMensaje(`✅ ¡Pedido #${data.order_id} creado y stock actualizado!`, 'success');
                    
                    // Recargar los productos para mostrar el stock actualizado
                    await cargarProductos();
                    
                    // Limpiar carrito después del pago exitoso
                    await limpiarCarrito();
                    cerrarCarrito();

                } else {
                    throw new Error(data.message || 'Error al procesar el pago');
                }
                
            } catch (error) {
                console.error('❌ Error en el proceso de pago:', error);
                mostrarMensaje(`❌ Error: ${error.message}`, 'error');
                
                // Rehabilitar el botón de pago en caso de error
                const btnPagar = document.querySelector('.btn-pagar');
                if (btnPagar) {
                    btnPagar.disabled = false;
                    btnPagar.textContent = '💳 Proceder al Pago';
                }
            }
        }

        // Mostrar mensajes temporales
        function mostrarMensaje(mensaje, tipo = 'success') {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 1001;
                font-weight: 600;
                max-width: 300px;
            `;
            mensajeDiv.textContent = mensaje;
            document.body.appendChild(mensajeDiv);

            setTimeout(() => {
                if (document.body.contains(mensajeDiv)) {
                    document.body.removeChild(mensajeDiv);
                }
            }, 3000);
        }

        // Obtener icono para producto
        function getIconoProducto(nombre, descripcion) {
            const iconosNutricionales = {
                'proteína': '🥩', 'proteina': '🥩', 'vitamina': '💊', 'mineral': '💎',
                'suplemento': '🏋️', 'natural': '🌿', 'orgánico': '🍃', 'organico': '🍃',
                'energía': '⚡', 'energia': '⚡', 'salud': '❤️', 'deporte': '🏃',
                'dieta': '🥗', 'fruta': '🍎', 'verdura': '🥦', 'semilla': '🌰',
                'grano': '🌾', 'lácteo': '🥛', 'lacteo': '🥛', 'pescado': '🐟', 'huevo': '🥚'
            };
            
            const textoBusqueda = (nombre + ' ' + (descripcion || '')).toLowerCase();
            let icono = '🌿';
            
            for (const [keyword, emoji] of Object.entries(iconosNutricionales)) {
                if (textoBusqueda.includes(keyword)) {
                    icono = emoji;
                    break;
                }
            }
            
            return icono;
        }

        // Cargar todos los productos
        async function cargarProductos() {
            const container = document.getElementById('productosContainer');
            const countElement = document.getElementById('productCount');
            
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <h3>Buscando los mejores productos para ti...</h3>
                    <p>Cargando nuestro catálogo de nutrición y bienestar</p>
                </div>
            `;

            try {
                const response = await fetch('/api/productos');
                const data = await response.json();

                if (data.success) {
                    todosLosProductos = data.productos;
                    mostrarProductos(todosLosProductos);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                container.innerHTML = `
                    <div class="error">
                        <h3>❌ Error al cargar productos</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }

        // Mostrar productos en el grid
        function mostrarProductos(productos) {
            const container = document.getElementById('productosContainer');
            const countElement = document.getElementById('productCount');

            countElement.textContent = `🌿 ${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;

            if (productos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🥬</div>
                        <h3>No se encontraron productos</h3>
                        <p>Intenta con otros términos de búsqueda</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="productos-grid">';
            
            productos.forEach(producto => {
                const precio = producto.precio ? `$${parseFloat(producto.precio).toFixed(2)}` : 'Consultar precio';
                const stock = producto.stock > 0;
                let icono = getIconoProducto(producto.nombre, producto.descripcion);

                // Escapar el producto para JSON correctamente
                const productoJson = JSON.stringify(producto)
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, "\\'");
                
                html += `
                    <div class="producto-card">
                        <div class="card-container">
                            ${producto.stock > 0 && producto.stock < 5 ? '<div class="producto-badge">🔥 Últimas unidades</div>' : ''}
                            <div class="producto-imagen">
                                ${producto.imagen ? 
                                    `<img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.style.display='none'; this.parentNode.innerHTML='${icono}'">` : 
                                    icono
                                }
                            </div>
                        </div>
                        <div class="producto-info">
                            <h3 class="producto-nombre">${producto.nombre}</h3>
                            <p class="producto-descripcion">${producto.descripcion || 'Producto de alta calidad para tu bienestar.'}</p>
                            <div class="producto-precio">${precio}</div>
                            <div class="producto-detalles">
                                <div class="producto-stock">
                                    ${stock ? 
                                        `<span class="stock-disponible">${producto.stock} disponibles</span>` : 
                                        '<span class="stock-agotado">Agotado</span>'
                                    }
                                </div>
                                <button class="btn-agregar" onclick="agregarAlCarrito(${productoJson})" ${!stock ? 'disabled' : ''}>
                                    🛒 Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        // Búsqueda en tiempo real
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                buscarProductos(e.target.value);
            }, 500);
        });

        async function buscarProductos(termino) {
            if (termino.trim() === '') {
                cargarProductos();
                return;
            }

            const container = document.getElementById('productosContainer');
            
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <h3>Buscando productos...</h3>
                    <p>"${termino}"</p>
                </div>
            `;

            try {
                const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(termino)}`);
                const data = await response.json();

                if (data.success) {
                    mostrarProductos(data.productos);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                container.innerHTML = `
                    <div class="error">
                        <h3>❌ Error en la búsqueda</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }