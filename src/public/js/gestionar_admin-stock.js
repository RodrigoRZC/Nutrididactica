let productos = [];
        let productosFiltrados = [];

        // Cargar productos al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarProductos();
            
            // Configurar búsqueda
            document.getElementById('searchInput').addEventListener('input', function(e) {
                filtrarProductos(e.target.value);
            });
        });
        
        // Mostrar alerta
        function mostrarAlerta(mensaje, tipo = 'success') {
            const alertContainer = document.getElementById('alertContainer');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${tipo}`;
            alertDiv.textContent = mensaje;
            alertContainer.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertContainer.contains(alertDiv)) {
                    alertContainer.removeChild(alertDiv);
                }
            }, 5000);
        }
        
        // Cargar productos
        async function cargarProductos() {
            const tableBody = document.getElementById('productsTableBody');
            
            try {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="loading">
                            <div class="loading-spinner"></div>
                            <p>Cargando productos...</p>
                        </td>
                    </tr>
                `;
                
                const response = await fetch('/api/admin/productos');
                const data = await response.json();
                
                if (data.success) {
                    productos = data.productos;
                    productosFiltrados = [...productos];
                    actualizarEstadisticas();
                    actualizarTablaProductos();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error cargando productos:', error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="icon">❌</div>
                            <h3>Error al cargar productos</h3>
                            <p>${error.message}</p>
                        </td>
                    </tr>
                `;
            }
        }
        
        // Actualizar estadísticas
        function actualizarEstadisticas() {
            const totalProducts = document.getElementById('totalProducts');
            const inStockProducts = document.getElementById('inStockProducts');
            const lowStockProducts = document.getElementById('lowStockProducts');
            const outOfStockProducts = document.getElementById('outOfStockProducts');
            
            const total = productos.length;
            const inStock = productos.filter(p => p.stock > 10).length;
            const lowStock = productos.filter(p => p.stock > 0 && p.stock <= 10).length;
            const outOfStock = productos.filter(p => p.stock === 0).length;
            
            totalProducts.textContent = total;
            inStockProducts.textContent = inStock;
            lowStockProducts.textContent = lowStock;
            outOfStockProducts.textContent = outOfStock;
        }
        
        // Filtrar productos
        function filtrarProductos(termino) {
            if (!termino.trim()) {
                productosFiltrados = [...productos];
            } else {
                const terminoLower = termino.toLowerCase();
                productosFiltrados = productos.filter(producto => 
                    producto.name.toLowerCase().includes(terminoLower) ||
                    (producto.category_name && producto.category_name.toLowerCase().includes(terminoLower)) ||
                    (producto.description && producto.description.toLowerCase().includes(terminoLower))
                );
            }
            actualizarTablaProductos();
        }
        
        // Actualizar tabla de productos
        function actualizarTablaProductos() {
            const tableBody = document.getElementById('productsTableBody');
            
            if (productosFiltrados.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="icon">🔍</div>
                            <h3>No se encontraron productos</h3>
                            <p>Intenta con otros términos de búsqueda</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            productosFiltrados.forEach(producto => {
                const icono = getIconoProducto(producto.name);
                const tieneImagen = producto.imagen && producto.imagen !== '';
                const stockClass = getStockClass(producto.stock);
                const stockText = getStockText(producto.stock);
                
                html += `
                    <tr>
                        <td>
                            <div class="product-cell">
                                <div class="product-image">
                                    ${tieneImagen ? 
                                        `<img src="${producto.imagen}" alt="${producto.name}" onerror="this.style.display='none'; this.parentNode.innerHTML='${icono}'">` : 
                                        icono
                                    }
                                </div>
                                <div class="product-info">
                                    <div class="product-name">${producto.name}</div>
                                    <div class="product-category">
                                        ${producto.category_name || 'Sin categoría'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="price-cell">
                            $${parseFloat(producto.price).toFixed(2)}
                        </td>
                        <td class="stock-cell">
                            <span class="stock-badge ${stockClass}">
                                ${stockText}
                            </span>
                        </td>
                        <td>
                            <div class="stock-controls">
                                <input 
                                    type="number" 
                                    class="stock-input" 
                                    id="stockInput_${producto.name.replace(/[^a-zA-Z0-9]/g, '_')}"
                                    value="${producto.stock}"
                                    min="0"
                                >
                                <button class="btn btn-success btn-sm" onclick="actualizarStock('${producto.name}')">
                                    💾 Guardar
                                </button>
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-warning btn-icon" onclick="ajustarStock('${producto.name}', -1)" title="Reducir 1">
                                        -
                                    </button>
                                    <button class="btn btn-success btn-icon" onclick="ajustarStock('${producto.name}', 1)" title="Aumentar 1">
                                        +
                                    </button>
                                    <button class="btn btn-primary btn-icon" onclick="ajustarStock('${producto.name}', 10)" title="Aumentar 10">
                                        +10
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        }
        
        // Obtener clase CSS para el stock
        function getStockClass(stock) {
            if (stock === 0) return 'stock-out';
            if (stock <= 5) return 'stock-low';
            if (stock <= 10) return 'stock-medium';
            return 'stock-high';
        }
        
        // Obtener texto para el stock
        function getStockText(stock) {
            if (stock === 0) return 'Sin stock';
            if (stock <= 5) return 'Muy bajo';
            if (stock <= 10) return 'Bajo';
            return 'En stock';
        }
        
        // Obtener icono para producto
        function getIconoProducto(nombre) {
            const iconosNutricionales = {
                'proteína': '🥩', 'proteina': '🥩', 'vitamina': '💊', 'mineral': '💎',
                'suplemento': '🏋️', 'natural': '🌿', 'orgánico': '🍃', 'organico': '🍃',
                'energía': '⚡', 'energia': '⚡', 'salud': '❤️', 'deporte': '🏃',
                'dieta': '🥗', 'fruta': '🍎', 'verdura': '🥦', 'semilla': '🌰',
                'grano': '🌾', 'lácteo': '🥛', 'lacteo': '🥛', 'pescado': '🐟', 'huevo': '🥚'
            };
           
            const textoBusqueda = nombre.toLowerCase();
            let icono = '📦';
           
            for (const [keyword, emoji] of Object.entries(iconosNutricionales)) {
                if (textoBusqueda.includes(keyword)) {
                    icono = emoji;
                    break;
                }
            }
           
            return icono;
        }
        
        // Ajustar stock (incrementar/decrementar)
        function ajustarStock(nombreProducto, cantidad) {
            const inputId = `stockInput_${nombreProducto.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const input = document.getElementById(inputId);
            let nuevoStock = parseInt(input.value) + cantidad;
            
            if (nuevoStock < 0) {
                nuevoStock = 0;
            }
            
            input.value = nuevoStock;
        }
        
        // Actualizar stock en el servidor
        async function actualizarStock(nombreProducto) {
            const inputId = `stockInput_${nombreProducto.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const input = document.getElementById(inputId);
            const nuevoStock = parseInt(input.value);
            const boton = input.nextElementSibling;
            
            if (isNaN(nuevoStock) || nuevoStock < 0) {
                mostrarAlerta('❌ El stock debe ser un número válido mayor o igual a 0', 'error');
                return;
            }
            
            try {
                // Cambiar texto del botón
                const textoOriginal = boton.innerHTML;
                boton.disabled = true;
                boton.innerHTML = '⏳...';
                
                const response = await fetch(`/api/admin/productos/${encodeURIComponent(nombreProducto)}/stock`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ stock: nuevoStock })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarAlerta(`✅ Stock de "${nombreProducto}" actualizado a ${nuevoStock} unidades`);
                    
                    // Actualizar el producto en la lista local
                    const productoIndex = productos.findIndex(p => p.name === nombreProducto);
                    if (productoIndex !== -1) {
                        productos[productoIndex].stock = nuevoStock;
                    }
                    
                    // Actualizar estadísticas y tabla
                    actualizarEstadisticas();
                    actualizarTablaProductos();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error actualizando stock:', error);
                mostrarAlerta(`❌ ${error.message}`, 'error');
                
                // Restaurar valor original
                const producto = productos.find(p => p.name === nombreProducto);
                if (producto) {
                    input.value = producto.stock;
                }
            } finally {
                // Restaurar botón
                boton.disabled = false;
                boton.innerHTML = '💾 Guardar';
            }
        }
        
        // Permitir Enter para guardar
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('stock-input')) {
                    const productName = activeElement.id.replace('stockInput_', '').replace(/_/g, ' ');
                    actualizarStock(productName);
                }
            }
        });