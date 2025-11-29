// Mostrar formulario de login
        function showLogin() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
            clearAlerts();
        }

        // Mostrar formulario de registro
        function showRegister() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
            clearAlerts();
        }

        // Limpiar alertas
        function clearAlerts() {
            document.getElementById('loginAlert').innerHTML = '';
            document.getElementById('registerAlert').innerHTML = '';
        }

        // Función de login
        async function login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const alertDiv = document.getElementById('loginAlert');
            if (!email || !password) {
                alertDiv.innerHTML = '<div class="alert alert-error">Por favor, completa todos los campos</div>';
                return;
            }
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success) {
                    alertDiv.innerHTML = '<div class="alert alert-success">¡Inicio de sesión exitoso! Redirigiendo...</div>';
                    
                    // Redirigir según el tipo de usuario
                    setTimeout(() => {
                        if (data.isAdmin) {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = '/';
                        }
                    }, 2000);
                } else {
                    alertDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
                }
            } catch (error) {
                alertDiv.innerHTML = '<div class="alert alert-error">Error de conexión. Intenta nuevamente.</div>';
            }
        }

        // Función de registro
        async function register() {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const phone = document.getElementById('registerPhone').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const alertDiv = document.getElementById('registerAlert');

            // Validaciones
            if (!name || !email || !password) {
                alertDiv.innerHTML = '<div class="alert alert-error">Nombre, email y contraseña son obligatorios</div>';
                return;
            }

            if (password !== confirmPassword) {
                alertDiv.innerHTML = '<div class="alert alert-error">Las contraseñas no coinciden</div>';
                return;
            }

            if (password.length < 6) {
                alertDiv.innerHTML = '<div class="alert alert-error">La contraseña debe tener al menos 6 caracteres</div>';
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        email, 
                        name, 
                        phone: phone || null, 
                        password 
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alertDiv.innerHTML = '<div class="alert alert-success">¡Registro exitoso! Ahora puedes iniciar sesión.</div>';
                    // Limpiar formulario
                    document.getElementById('registerName').value = '';
                    document.getElementById('registerEmail').value = '';
                    document.getElementById('registerPhone').value = '';
                    document.getElementById('registerPassword').value = '';
                    document.getElementById('registerConfirmPassword').value = '';
                    
                    // Mostrar formulario de login después de 2 segundos
                    setTimeout(() => {
                        showLogin();
                    }, 2000);
                } else {
                    alertDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
                }
            } catch (error) {
                alertDiv.innerHTML = '<div class="alert alert-error">Error de conexión. Intenta nuevamente.</div>';
            }
        }

        // Permitir enviar formularios con Enter
        document.addEventListener('DOMContentLoaded', function() {
            // Para login
            document.getElementById('loginPassword').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });

            // Para registro
            document.getElementById('registerConfirmPassword').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    register();
                }
            });
        });