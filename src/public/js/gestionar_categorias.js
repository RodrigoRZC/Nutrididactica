document.addEventListener('DOMContentLoaded', function () {
    cargarCategorias();

    document.getElementById('categoryForm').addEventListener('submit', function (e) {
        e.preventDefault();
        crearCategoria();
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

// Cargar categorías
async function cargarCategorias() {
    const categoriesList = document.getElementById('categoriesList');

    try {
        const response = await fetch('/api/admin/categorias');
        const data = await response.json();

        if (data.success) {
            if (data.categorias.length === 0) {
                categoriesList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🏷️</div>
                        <h3>No hay categorías registradas</h3>
                        <p>Comienza agregando tu primera categoría usando el formulario superior</p>
                    </div>
                `;
            } else {
                let html = '';
                data.categorias.forEach(categoria => {
                    html += `
                        <div class="category-card">
                            <div class="category-header">
                                <div class="category-icon">📁</div>
                                <div class="category-info">
                                    <div class="category-name">${categoria.name}</div>
                                    <div class="category-description">${categoria.description}</div>
                                </div>
                            </div>
                            <div class="category-actions">
                                <button class="btn btn-danger btn-sm" onclick="eliminarCategoria('${categoria.name}')">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    `;
                });
                categoriesList.innerHTML = html;
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        categoriesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">❌</div>
                <h3>Error al cargar categorías</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Crear nueva categoría
async function crearCategoria() {
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    const submitBtn = document.querySelector('#categoryForm button[type="submit"]');

    if (!name || !description) {
        mostrarAlerta('❌ Por favor, completa todos los campos', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Guardando...';

        const response = await fetch('/api/admin/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();

        if (data.success) {
            mostrarAlerta('✅ Categoría creada exitosamente');
            document.getElementById('categoryForm').reset();
            cargarCategorias();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error creando categoría:', error);
        mostrarAlerta(`❌ ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Categoría';
    }
}

// Eliminar categoría
async function eliminarCategoria(nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${nombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/categorias/${encodeURIComponent(nombre)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            mostrarAlerta('✅ Categoría eliminada exitosamente');
            cargarCategorias();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        mostrarAlerta(`❌ ${error.message}`, 'error');
    }
}
