let selectedFile = null;

        // Cargar categorías al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarCategorias();
            setupFileUpload();
            
            // Configurar el formulario
            document.getElementById('productForm').addEventListener('submit', function(e) {
                e.preventDefault();
                crearProducto();
            });
            
            // Validación en tiempo real para precio
            document.getElementById('productPrice').addEventListener('input', function(e) {
                if (this.value <= 0) {
                    this.setCustomValidity('El precio debe ser mayor a 0');
                } else {
                    this.setCustomValidity('');
                }
            });
            
            // Validación en tiempo real para stock
            document.getElementById('productStock').addEventListener('input', function(e) {
                if (this.value < 0) {
                    this.setCustomValidity('El stock no puede ser negativo');
                } else {
                    this.setCustomValidity('');
                }
            });
        });
        
        // Configurar la subida de archivos
        function setupFileUpload() {
            const fileInput = document.getElementById('productImage');
            const fileUploadArea = document.getElementById('fileUploadArea');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            const imagePreview = document.getElementById('imagePreview');
            
            // Click en el área de subida
            fileUploadArea.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Cambio de archivo
            fileInput.addEventListener('change', function(e) {
                if (this.files.length > 0) {
                    handleFileSelect(this.files[0]);
                }
            });
            
            // Drag and drop
            fileUploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            
            fileUploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            
            fileUploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });
            
            function handleFileSelect(file) {
                // Validar tipo de archivo
                if (!file.type.startsWith('image/')) {
                    mostrarAlerta('❌ Solo se permiten archivos de imagen', 'error');
                    return;
                }
                
                // Validar tamaño (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    mostrarAlerta('❌ El archivo es demasiado grande (máximo 5MB)', 'error');
                    return;
                }
                
                selectedFile = file;
                
                // Mostrar información del archivo
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.style.display = 'block';
                
                // Mostrar vista previa
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Ocultar área de subida
                fileUploadArea.style.display = 'none';
            }
        }
        
        // Formatear tamaño de archivo
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Eliminar imagen seleccionada
        function removeImage() {
            selectedFile = null;
            document.getElementById('productImage').value = '';
            document.getElementById('fileInfo').style.display = 'none';
            document.getElementById('fileUploadArea').style.display = 'block';
        }
        
        // Resetear formulario
        function resetForm() {
            removeImage();
        }
        
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
        
        // Cargar categorías para el dropdown
        async function cargarCategorias() {
            const categorySelect = document.getElementById('productCategory');
            
            try {
                // Mostrar loading
                categorySelect.innerHTML = '<option value="">Cargando categorías...</option>';
                
                const response = await fetch('/api/admin/categorias-lista');
                const data = await response.json();
                
                if (data.success) {
                    let options = '<option value="">Selecciona una categoría...</option>';
                    
                    data.categorias.forEach(categoria => {
                        options += `<option value="${categoria.name}">${categoria.name}</option>`;
                    });
                    
                    categorySelect.innerHTML = options;
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error cargando categorías:', error);
                categorySelect.innerHTML = '<option value="">Error al cargar categorías</option>';
            }
        }
        
        // Crear nuevo producto
        async function crearProducto() {
            const name = document.getElementById('productName').value;
            const description = document.getElementById('productDescription').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const stock = parseInt(document.getElementById('productStock').value);
            const category_name = document.getElementById('productCategory').value;
            const submitBtn = document.querySelector('#productForm button[type="submit"]');
            
            // Validaciones básicas
            if (!name || !price || stock === undefined) {
                mostrarAlerta('❌ Por favor, completa todos los campos obligatorios', 'error');
                return;
            }
            
            if (price <= 0) {
                mostrarAlerta('❌ El precio debe ser mayor a 0', 'error');
                return;
            }
            
            if (stock < 0) {
                mostrarAlerta('❌ El stock no puede ser negativo', 'error');
                return;
            }
            
            try {
                // Deshabilitar botón
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="loading-spinner"></div> Guardando...';
                
                // Crear FormData para enviar archivo
                const formData = new FormData();
                formData.append('name', name.trim());
                formData.append('description', description.trim());
                formData.append('price', price);
                formData.append('stock', stock);
                formData.append('category_name', category_name || '');
                
                if (selectedFile) {
                    formData.append('imagen', selectedFile);
                }
                
                const response = await fetch('/api/admin/productos', {
                    method: 'POST',
                    body: formData
                    // No incluir Content-Type header, el navegador lo establecerá automáticamente con el boundary
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarAlerta('✅ Producto creado exitosamente');
                    // Limpiar formulario
                    document.getElementById('productForm').reset();
                    removeImage();
                    
                    // Opcional: Redirigir después de éxito
                    setTimeout(() => {
                        window.location.href = '/admin';
                    }, 2000);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error creando producto:', error);
                mostrarAlerta(`❌ ${error.message}`, 'error');
            } finally {
                // Rehabilitar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Guardar Producto';
            }
        }