let productos = [];
        let categorias = [];

        // Cargar productos al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarProductos();
            cargarCategoriasParaModal();
            
            // Configurar el formulario de edición
            document.getElementById('editForm').addEventListener('submit', function(e) {
                e.preventDefault();
                actualizarProducto();
            });
            
            // Configurar cambio de imagen en el modal
            document.getElementById('newProductImage').addEventListener('change', function(e) {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('newImagePreviewImg').src = e.target.result;
                        document.getElementById('newImagePreview').style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
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
            const productsList = document.getElementById('productsList');
            
            try {
                productsList.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                `;
                
                const response = await fetch('/api/admin/productos');
                const data = await response.json();
                
                if (data.success) {
                    productos = data.productos;
                    actualizarVistaProductos();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error cargando productos:', error);
                productsList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <h3>Error al cargar productos</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
        
        // Actualizar vista de productos
        function actualizarVistaProductos() {
            const productsList = document.getElementById('productsList');
            const totalProducts = document.getElementById('totalProducts');
            
            totalProducts.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;
            
            if (productos.length === 0) {
                productsList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📦</div>
                        <h3>No hay productos registrados</h3>
                        <p>Comienza agregando tu primer producto</p>
                        <a href="/admin/productos/nuevo" class="btn btn-success" style="margin-top: 20px;">
                            ➕ Agregar Primer Producto
                        </a>
                    </div>
                `;
                return;
            }
            
            let html = '';
            productos.forEach(producto => {
                const icono = getIconoProducto(producto.name);
                const tieneImagen = producto.imagen && producto.imagen !== '';
                
                html += `
                    <div class="product-card">
                        <div class="product-image">
                            ${tieneImagen ? 
                                `<img src="${producto.imagen}" alt="${producto.name}" onerror="this.style.display='none'; this.parentNode.innerHTML='${icono}'">` : 
                                icono
                            }
                        </div>
                        <div class="product-info">
                            <div class="product-header">
                                <div>
                                    <div class="product-name">${producto.name}</div>
                                    ${producto.category_name ? 
                                        `<div class="product-category">${producto.category_name}</div>` : 
                                        ''
                                    }
                                </div>
                            </div>
                            
                            <div class="product-description">
                                ${producto.description || 'Sin descripción'}
                            </div>
                            
                            <div class="product-details">
                                <div class="detail-item">
                                    <div class="detail-label">Precio</div>
                                    <div class="detail-value price">$${parseFloat(producto.price).toFixed(2)}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Stock</div>
                                    <div class="detail-value stock">${producto.stock} unidades</div>
                                </div>
                            </div>
                            
                            <div class="product-actions">
                                <button class="btn btn-warning btn-sm" onclick="abrirModalEdicion('${producto.name}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${producto.name}')">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            productsList.innerHTML = html;
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
        
        // Cargar categorías para el modal
        async function cargarCategoriasParaModal() {
            try {
                const response = await fetch('/api/admin/categorias-lista');
                const data = await response.json();
                
                if (data.success) {
                    categorias = data.categorias;
                }
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        }
        
        // Abrir modal de edición
        function abrirModalEdicion(nombreProducto) {
            const producto = productos.find(p => p.name === nombreProducto);
            if (!producto) return;
            
            // Llenar el formulario
            document.getElementById('editProductName').value = producto.name;
            document.getElementById('editProductNameDisplay').value = producto.name;
            document.getElementById('editProductDescription').value = producto.description || '';
            document.getElementById('editProductPrice').value = producto.price;
            document.getElementById('editProductStock').value = producto.stock;
            
            // Llenar categorías
            const categorySelect = document.getElementById('editProductCategory');
            let options = '<option value="">Sin categoría</option>';
            categorias.forEach(categoria => {
                const selected = producto.category_name === categoria.name ? 'selected' : '';
                options += `<option value="${categoria.name}" ${selected}>${categoria.name}</option>`;
            });
            categorySelect.innerHTML = options;
            
            // Mostrar imagen actual
            const currentImage = document.getElementById('currentProductImage');
            if (producto.imagen && producto.imagen !== '') {
                currentImage.src = producto.imagen;
                document.getElementById('currentImageContainer').style.display = 'block';
            } else {
                document.getElementById('currentImageContainer').style.display = 'none';
            }
            
            // Limpiar nueva imagen
            document.getElementById('newProductImage').value = '';
            document.getElementById('newImagePreview').style.display = 'none';
            
            // Mostrar modal
            document.getElementById('editModal').style.display = 'flex';
        }
        
        // Cerrar modal
        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }
        
        // Actualizar producto
        async function actualizarProducto() {
            const formData = new FormData(document.getElementById('editForm'));
            const submitBtn = document.querySelector('#editForm button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> Guardando...';
                
                const productName = document.getElementById('editProductName').value;
                const response = await fetch(`/api/admin/productos/${encodeURIComponent(productName)}`, {
                    method: 'PUT',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarAlerta('✅ Producto actualizado exitosamente');
                    closeModal();
                    cargarProductos(); // Recargar la lista
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error actualizando producto:', error);
                mostrarAlerta(`❌ ${error.message}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Guardar Cambios';
            }
        }
        
        // Eliminar producto
        async function eliminarProducto(nombre) {
            if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
                return;
            }
            
            try {
                const response = await fetch(`/api/admin/productos/${encodeURIComponent(nombre)}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarAlerta('✅ Producto eliminado exitosamente');
                    cargarProductos();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error eliminando producto:', error);
                mostrarAlerta(`❌ ${error.message}`, 'error');
            }
        }
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        });