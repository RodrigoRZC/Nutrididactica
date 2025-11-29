// Cargar información del admin al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarInfoAdmin();
            cargarEstadisticas();
            cargarActividadReciente();
        });
        
        // Cargar información del usuario admin
        async function cargarInfoAdmin() {
            try {
                const response = await fetch('/api/user');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('userWelcome').textContent = 
                        `¡Bienvenido, ${data.user.name}!`;
                    document.getElementById('userDetails').textContent = 
                        `Administrador del Sistema | ${data.user.email}`;
                } else {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error cargando info admin:', error);
            }
        }
        
        // Cargar estadísticas
        async function cargarEstadisticas() {
            try {
                const response = await fetch('/api/admin/estadisticas');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('totalProducts').textContent = data.estadisticas.totalProductos;
                    document.getElementById('todayOrders').textContent = data.estadisticas.pedidosHoy;
                    document.getElementById('totalUsers').textContent = data.estadisticas.totalUsuarios;
                    document.getElementById('monthlyRevenue').textContent = `$${data.estadisticas.ingresosMes.toFixed(2)}`;
                } else {
                    // Usar valores por defecto si hay error
                    document.getElementById('totalProducts').textContent = '25';
                    document.getElementById('todayOrders').textContent = '8';
                    document.getElementById('totalUsers').textContent = '156';
                    document.getElementById('monthlyRevenue').textContent = '$2,845.00';
                }
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                // Valores por defecto
                document.getElementById('totalProducts').textContent = '25';
                document.getElementById('todayOrders').textContent = '8';
                document.getElementById('totalUsers').textContent = '156';
                document.getElementById('monthlyRevenue').textContent = '$2,845.00';
            }
        }
        
        // Cargar actividad reciente
        async function cargarActividadReciente() {
            const activityList = document.getElementById('recentActivity');
            
            // Simular datos de actividad
            const actividades = [
                {
                    icon: '🔐',
                    title: 'Inicio de sesión exitoso',
                    desc: 'Acceso al panel de administración',
                    time: 'Hace 2 minutos'
                },
                {
                    icon: '📦',
                    title: 'Nuevo pedido recibido',
                    desc: 'Pedido #00125 de María González',
                    time: 'Hace 15 minutos'
                },
                {
                    icon: '👥',
                    title: 'Nuevo usuario registrado',
                    desc: 'Carlos Rodríguez se unió a Nutrididactica',
                    time: 'Hace 1 hora'
                },
                {
                    icon: '💰',
                    title: 'Pago procesado',
                    desc: 'Pedido #00124 marcado como completado',
                    time: 'Hace 2 horas'
                },
                {
                    icon: '📊',
                    title: 'Stock actualizado',
                    desc: 'Proteína Vegana - Stock ajustado a 45 unidades',
                    time: 'Hace 3 horas'
                }
            ];
            
            let html = '';
            actividades.forEach(actividad => {
                html += `
                    <li class="activity-item">
                        <div class="activity-icon">${actividad.icon}</div>
                        <div class="activity-content">
                            <div class="activity-title">${actividad.title}</div>
                            <div class="activity-desc">${actividad.desc}</div>
                            <div class="activity-time">${actividad.time}</div>
                        </div>
                    </li>
                `;
            });
            
            activityList.innerHTML = html;
        }
        
        // Funciones para las acciones
        function manageProducts() {
            window.location.href = '/admin/productos/nuevo';
        }
        
        function viewProducts() {
            window.location.href = '/admin/productos';
        }
        
        function manageCategories() {
            window.location.href = '/admin/categorias';
        }
        
        function updateStock() {
            window.location.href = '/admin/stock';
        }
        
        function viewOrders() {
            alert('🛒 Funcionalidad de visualización de pedidos - Próximamente');
        }
        
        function pendingOrders() {
            alert('⏳ Funcionalidad de pedidos pendientes - Próximamente');
        }
        
        function orderReports() {
            alert('📈 Funcionalidad de reportes de pedidos - Próximamente');
        }
        
        function shippingManagement() {
            alert('🚚 Funcionalidad de gestión de envíos - Próximamente');
        }
        
        function viewUsers() {
            window.location.href = '/admin/usuarios';
        }
        
        function userStats() {
            alert('📊 Funcionalidad de estadísticas de usuarios - Próximamente');
        }
        
        function createAdmin() {
            alert('⚡ Funcionalidad de creación de administradores - Próximamente');
        }
        
        function userSupport() {
            alert('💬 Funcionalidad de soporte al usuario - Próximamente');
        }
        
        // Actualizar estadísticas cada 30 segundos
        setInterval(cargarEstadisticas, 30000);