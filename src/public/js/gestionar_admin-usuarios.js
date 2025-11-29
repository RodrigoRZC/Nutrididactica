let usuarios = [];
        let usuariosFiltrados = [];
        let filtroTipo = 'user'; // Por defecto mostrar solo usuarios regulares
        let terminoBusqueda = '';

        // Cargar usuarios al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarUsuarios();
            
            // Configurar búsqueda
            document.getElementById('searchInput').addEventListener('input', function(e) {
                terminoBusqueda = e.target.value;
                aplicarFiltros();
            });
            
            // Configurar filtro por tipo
            document.getElementById('filterType').addEventListener('change', function(e) {
                filtroTipo = e.target.value;
                aplicarFiltros();
            });
            
            // Configurar el formulario de edición
            document.getElementById('editForm').addEventListener('submit', function(e) {
                e.preventDefault();
                actualizarUsuario();
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
        
        // Cargar usuarios
        async function cargarUsuarios() {
            const tableBody = document.getElementById('usersTableBody');
            
            try {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="loading">
                            <div class="loading-spinner"></div>
                            <p>Cargando usuarios...</p>
                        </td>
                    </tr>
                `;
                
                const response = await fetch('/api/admin/usuarios');
                const data = await response.json();
                
                if (data.success) {
                    usuarios = data.usuarios;
                    aplicarFiltros(); // Aplicar filtros por defecto
                    actualizarEstadisticas();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error cargando usuarios:', error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="icon">❌</div>
                            <h3>Error al cargar usuarios</h3>
                            <p>${error.message}</p>
                        </td>
                    </tr>
                `;
            }
        }
        
        // Aplicar filtros
        function aplicarFiltros() {
            let resultados = [...usuarios];
            
            // Aplicar filtro por tipo
            if (filtroTipo !== 'all') {
                resultados = resultados.filter(usuario => usuario.tipo === filtroTipo);
            }
            
            // Aplicar búsqueda por texto
            if (terminoBusqueda.trim()) {
                const terminoLower = terminoBusqueda.toLowerCase();
                resultados = resultados.filter(usuario => 
                    usuario.name.toLowerCase().includes(terminoLower) ||
                    usuario.email.toLowerCase().includes(terminoLower)
                );
            }
            
            usuariosFiltrados = resultados;
            actualizarContadorFiltro();
            actualizarTablaUsuarios();
        }
        
        // Actualizar contador del filtro
        function actualizarContadorFiltro() {
            const filterCount = document.getElementById('filterCount');
            const totalFiltrados = usuariosFiltrados.length;
            const totalGeneral = usuarios.length;
            
            let texto = `${totalFiltrados} usuario${totalFiltrados !== 1 ? 's' : ''}`;
            
            // Si hay filtros activos, mostrar comparación
            if (filtroTipo !== 'all' || terminoBusqueda.trim()) {
                texto += ` de ${totalGeneral}`;
            }
            
            filterCount.textContent = texto;
        }
        
        // Actualizar estadísticas
        function actualizarEstadisticas() {
            const totalUsers = document.getElementById('totalUsers');
            const adminUsers = document.getElementById('adminUsers');
            const regularUsers = document.getElementById('regularUsers');
            
            const total = usuarios.length;
            const admins = usuarios.filter(u => u.tipo === 'admin').length;
            const regulars = usuarios.filter(u => u.tipo === 'user').length;
            
            totalUsers.textContent = total;
            adminUsers.textContent = admins;
            regularUsers.textContent = regulars;
        }
        
        // Actualizar tabla de usuarios
        function actualizarTablaUsuarios() {
            const tableBody = document.getElementById('usersTableBody');
            
            if (usuariosFiltrados.length === 0) {
                let mensaje = '';
                if (filtroTipo !== 'all' && terminoBusqueda.trim()) {
                    mensaje = 'No se encontraron usuarios que coincidan con la búsqueda y el filtro seleccionado';
                } else if (filtroTipo !== 'all') {
                    mensaje = `No hay usuarios del tipo "${filtroTipo === 'user' ? 'regular' : 'administrador'}"`;
                } else if (terminoBusqueda.trim()) {
                    mensaje = 'No se encontraron usuarios que coincidan con la búsqueda';
                } else {
                    mensaje = 'No hay usuarios registrados en el sistema';
                }
                
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="icon">🔍</div>
                            <h3>${mensaje}</h3>
                            <p>Intenta cambiar los filtros o términos de búsqueda</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            usuariosFiltrados.forEach(usuario => {
                const iniciales = getIniciales(usuario.name);
                const tipoClass = usuario.tipo === 'admin' ? 'type-admin' : 'type-user';
                const tipoText = usuario.tipo === 'admin' ? 'Admin' : 'Usuario';
                
                html += `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">${iniciales}</div>
                                <div class="user-info">
                                    <div class="user-name">${usuario.name}</div>
                                    <div class="user-email">${usuario.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="phone-cell">
                            ${usuario.phone || 'No proporcionado'}
                        </td>
                        <td>
                            <span class="type-badge ${tipoClass}">${tipoText}</span>
                        </td>
                        <td class="actions-cell">
                            <button class="btn btn-warning btn-sm" onclick="abrirModalEdicion('${usuario.email}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarUsuario('${usuario.email}', '${usuario.name}')">
                                🗑️ Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        }
        
        // Obtener iniciales para el avatar
        function getIniciales(nombre) {
            return nombre
                .split(' ')
                .map(palabra => palabra.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }
        
        // Abrir modal de edición
        function abrirModalEdicion(emailUsuario) {
            const usuario = usuarios.find(u => u.email === emailUsuario);
            if (!usuario) return;
            
            // Llenar el formulario
            document.getElementById('editUserEmail').value = usuario.email;
            document.getElementById('editUserName').value = usuario.name;
            document.getElementById('editUserEmailDisplay').value = usuario.email;
            document.getElementById('editUserPhone').value = usuario.phone || '';
            document.getElementById('editUserTipo').value = usuario.tipo;
            document.getElementById('editUserPassword').value = '';
            
            // Mostrar modal
            document.getElementById('editModal').style.display = 'flex';
        }
        
        // Cerrar modal
        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }
        
        // Alternar visibilidad de contraseña
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('editUserPassword');
            const toggleButton = document.querySelector('.toggle-password');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleButton.textContent = '🔒';
            } else {
                passwordInput.type = 'password';
                toggleButton.textContent = '👁️';
            }
        }
        
        // Actualizar usuario
        async function actualizarUsuario() {
            const formData = new FormData(document.getElementById('editForm'));
            const data = Object.fromEntries(formData);
            const submitBtn = document.querySelector('#editForm button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> Guardando...';
                
                const userEmail = document.getElementById('editUserEmail').value;
                const response = await fetch(`/api/admin/usuarios/${encodeURIComponent(userEmail)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    mostrarAlerta('✅ Usuario actualizado exitosamente');
                    closeModal();
                    cargarUsuarios(); // Recargar la lista
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error actualizando usuario:', error);
                mostrarAlerta(`❌ ${error.message}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Guardar Cambios';
            }
        }
        
        // Eliminar usuario
        async function eliminarUsuario(email, nombre) {
            if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}" (${email})?\n\nEsta acción no se puede deshacer y se eliminarán todas sus direcciones.`)) {
                return;
            }
            
            try {
                const response = await fetch(`/api/admin/usuarios/${encodeURIComponent(email)}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarAlerta('✅ Usuario eliminado exitosamente');
                    cargarUsuarios();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error eliminando usuario:', error);
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