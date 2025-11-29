// Variable para almacenar el carrito
        let carrito = [];

        // Cargar el carrito cuando la página se carga
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🛒 Página del carrito cargada');
            cargarCarrito();
        });

        // Función para cargar el carrito desde el servidor
        async function cargarCarrito() {
            try {
                console.log('📡 Solicitando carrito al servidor...');
                const response = await fetch('/api/carrito');
                const data = await response.json();

                if (data.success) {
                    carrito = data.carrito;
                    console.log('✅ Carrito cargado:', carrito);
                    mostrarCarrito();
                } else {
                    console.error('❌ Error al cargar carrito:', data.message);
                    mostrarError('Error al cargar el carrito');
                }
            } catch (error) {
                console.error('❌ Error de conexión:', error);
                mostrarError('Error de conexión al cargar el carrito');
            }
        }

        // Función para mostrar el carrito en la página
        function mostrarCarrito() {
            const container = document.getElementById('carritoContainer');
            
            if (carrito.length === 0) {
                container.innerHTML = `
                    <div class="carrito-vacio">
                        <div class="icon">🛒</div>
                        <h3>Tu carrito está vacío</h3>
                        <p>No has agregado ningún producto todavía</p>
                        <a href="/" class="btn">🛍️ Ir a Comprar</a>
                    </div>
                `;
            } else {
                let html = '<div class="carrito-items">';
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
                
                html += `
                    </div>
                    
                    <div class="resumen-pedido">
                        <h3 class="resumen-title">📋 Resumen del Pedido</h3>
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
                        <a href="/" class="btn-seguir-comprando">🛍️ Seguir Comprando</a>
                        <button class="btn-pagar" onclick="procesarPago()">💳 Proceder al Pago</button>
                    </div>
                `;
                
                container.innerHTML = html;
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
                    mostrarCarrito();
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
                    mostrarCarrito();
                    mostrarMensaje('🗑️ Producto eliminado', 'success');
                }
            } catch (error) {
                console.error('Error eliminando producto:', error);
                mostrarMensaje('❌ Error al eliminar', 'error');
            }
        }

        // Función para procesar el pago
        function procesarPago() {
            if (carrito.length === 0) {
                mostrarMensaje('🛒 Tu carrito está vacío', 'error');
                return;
            }

            mostrarMensaje('💳 Procesando tu pago...', 'success');
            
            // Simular proceso de pago
            setTimeout(() => {
                mostrarMensaje('✅ ¡Pago exitoso! Gracias por tu compra', 'success');
                
                // Limpiar carrito después del pago
                fetch('/api/carrito/limpiar', { method: 'POST' })
                    .then(() => {
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    });
            }, 2000);
        }

        // Función para mostrar mensajes
        function mostrarMensaje(mensaje, tipo) {
            // Remover mensaje anterior si existe
            const mensajeAnterior = document.querySelector('.mensaje');
            if (mensajeAnterior) {
                mensajeAnterior.remove();
            }

            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = `mensaje ${tipo}`;
            mensajeDiv.textContent = mensaje;
            document.body.appendChild(mensajeDiv);

            setTimeout(() => {
                if (document.body.contains(mensajeDiv)) {
                    document.body.removeChild(mensajeDiv);
                }
            }, 3000);
        }

        // Función para mostrar error
        function mostrarError(mensaje) {
            const container = document.getElementById('carritoContainer');
            container.innerHTML = `
                <div class="carrito-vacio">
                    <div class="icon">⚠️</div>
                    <h3>Error</h3>
                    <p>${mensaje}</p>
                    <button class="btn" onclick="cargarCarrito()">🔄 Reintentar</button>
                </div>
            `;
        }

        // Función para obtener icono del producto
        function getIconoProducto(nombre, descripcion) {
            const texto = (nombre + ' ' + (descripcion || '')).toLowerCase();
            
            if (texto.includes('proteína') || texto.includes('proteina')) return '🥩';
            if (texto.includes('vitamina')) return '💊';
            if (texto.includes('mineral')) return '💎';
            if (texto.includes('suplemento')) return '🏋️';
            if (texto.includes('natural')) return '🌿';
            if (texto.includes('orgánico') || texto.includes('organico')) return '🍃';
            if (texto.includes('fruta')) return '🍎';
            if (texto.includes('verdura')) return '🥦';
            if (texto.includes('lácteo') || texto.includes('lacteo')) return '🥛';
            if (texto.includes('pescado')) return '🐟';
            if (texto.includes('huevo')) return '🥚';
            
            return '🌿'; // Icono por defecto
        }