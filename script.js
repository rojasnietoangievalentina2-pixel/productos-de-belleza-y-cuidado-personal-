// =====================
// CONFIGURACIÓN FIREBASE
// =====================
const firebaseConfig = {
    apiKey: "AIzaSyAnzWit1WuA1htwYGBu6-go0-KQUTB2BYs",
    authDomain: "tienda-de-belleza-6f202.firebaseapp.com",
    projectId: "tienda-de-belleza-6f202",
    storageBucket: "tienda-de-belleza-6f202.firebasestorage.app",
    messagingSenderId: "55926835372",
    appId: "1:55926835372:web:1c2f25b39ec10adad5b709"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =====================
// CONTROL DE SESIÓN
// =====================
let usuarioActual = null;

auth.onAuthStateChanged(usuario => {
    usuarioActual = usuario;
    if (usuario) {
        document.getElementById("pantalla-auth").style.display = "none";
        document.getElementById("pantalla-tienda").style.display = "block";
        const nombre = usuario.displayName || usuario.email.split("@")[0];
        document.getElementById("usuario-nombre").textContent = `👤 ${nombre}`;
    } else {
        document.getElementById("pantalla-auth").style.display = "flex";
        document.getElementById("pantalla-tienda").style.display = "none";
    }
});

// =====================
// AUTH — LOGIN Y REGISTRO
// =====================
function cambiarTab(tab) {
    document.getElementById("tab-login").style.display = tab === "login" ? "block" : "none";
    document.getElementById("tab-registro").style.display = tab === "registro" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
        btn.classList.toggle("activo", (tab === "login" && i === 0) || (tab === "registro" && i === 1));
    });
}

function iniciarSesion() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";

    if (!email || !password) {
        errorEl.textContent = "Por favor completa todos los campos.";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .catch(err => {
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                errorEl.textContent = "Correo o contraseña incorrectos.";
            } else {
                errorEl.textContent = "Error al iniciar sesión. Intenta de nuevo.";
            }
        });
}

function registrarUsuario() {
    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const errorEl = document.getElementById("reg-error");
    errorEl.textContent = "";

    if (!nombre || !email || !password) {
        errorEl.textContent = "Por favor completa todos los campos.";
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = "La contraseña debe tener mínimo 6 caracteres.";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(resultado => {
            return resultado.user.updateProfile({ displayName: nombre });
        })
        .catch(err => {
            if (err.code === "auth/email-already-in-use") {
                errorEl.textContent = "Este correo ya está registrado.";
            } else {
                errorEl.textContent = "Error al crear la cuenta. Intenta de nuevo.";
            }
        });
}

function cerrarSesion() {
    if (confirm("¿Deseas cerrar sesión?")) {
        carrito = [];
        auth.signOut();
    }
}

// =====================
// CARRITO
// =====================
let carrito = [];

function cambiarCantidad(boton, cambio) {
    const contenedor = boton.parentElement;
    const valorSpan = contenedor.querySelector(".valor");
    let cantidad = parseInt(valorSpan.textContent);
    cantidad += cambio;
    if (cantidad < 1) cantidad = 1;
    valorSpan.textContent = cantidad;
}

function agregarAlCarrito(nombre, precio, boton) {
    const productoDiv = boton.parentElement;
    const valorSpan = productoDiv.querySelector(".valor");
    const cantidad = parseInt(valorSpan.textContent);

    const itemExistente = carrito.find(item => item.nombre === nombre);
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({ nombre, precio, cantidad });
    }

    actualizarCarrito();
    valorSpan.textContent = 1;

    boton.textContent = "✓ Agregado";
    boton.style.backgroundColor = "#28a745";
    setTimeout(() => {
        boton.textContent = "Agregar al carrito";
        boton.style.backgroundColor = "";
    }, 1500);
}

function actualizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    const contador = document.getElementById("contador-carrito");
    const carritoVacio = document.getElementById("carrito-vacio");

    lista.innerHTML = "";
    let suma = 0;
    let totalItems = 0;

    if (carrito.length === 0) {
        carritoVacio.style.display = "flex";
        lista.style.display = "none";
    } else {
        carritoVacio.style.display = "none";
        lista.style.display = "block";

        carrito.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-nombre">${item.nombre}</span>
                    <span class="item-cantidad">Cantidad: ${item.cantidad}</span>
                </div>
                <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">✕</button>
            `;
            lista.appendChild(li);
            suma += item.precio * item.cantidad;
            totalItems += item.cantidad;
        });
    }

    subtotalEl.textContent = `$${suma.toFixed(2)}`;
    totalEl.textContent = `$${suma.toFixed(2)}`;
    contador.textContent = totalItems;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length === 0) return;
    if (confirm("¿Deseas vaciar el carrito?")) {
        carrito = [];
        actualizarCarrito();
    }
}

function mostrarCarrito() {
    document.getElementById("carrito").style.right = "0";
}

function cerrarCarrito() {
    document.getElementById("carrito").style.right = "-420px";
}

// =====================
// MODAL DE PAGO
// =====================
function procederPago() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    cerrarCarrito();
    abrirModalPago();
}

function abrirModalPago() {
    const resumenLista = document.getElementById("resumen-lista");
    const resumenTotal = document.getElementById("resumen-total-valor");

    resumenLista.innerHTML = "";
    let suma = 0;

    carrito.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${item.nombre} x${item.cantidad}</span>
            <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
        `;
        resumenLista.appendChild(li);
        suma += item.precio * item.cantidad;
    });

    resumenTotal.textContent = `$${suma.toFixed(2)}`;
    document.getElementById("overlay-pago").style.display = "block";
    document.getElementById("modal-pago").style.display = "flex";
}

function cerrarModalPago() {
    document.getElementById("overlay-pago").style.display = "none";
    document.getElementById("modal-pago").style.display = "none";
}

function toggleDireccion() {
    const tipo = document.querySelector('input[name="entrega"]:checked').value;
    const seccion = document.getElementById("seccion-direccion");
    seccion.style.display = tipo === "domicilio" ? "block" : "none";
}

// =====================
// CONFIRMAR PEDIDO + GUARDAR EN FIRESTORE
// =====================
function confirmarPedido() {
    const nombre = document.getElementById("campo-nombre").value.trim();
    const telefono = document.getElementById("campo-telefono").value.trim();
    const tipo = document.querySelector('input[name="entrega"]:checked').value;
    const direccion = document.getElementById("campo-direccion").value.trim();
    const ciudad = document.getElementById("campo-ciudad").value.trim();
    const barrio = document.getElementById("campo-barrio").value.trim();
    const nota = document.getElementById("campo-nota").value.trim();

    if (!nombre || !telefono) {
        alert("Por favor completa tu nombre y teléfono.");
        return;
    }

    if (tipo === "domicilio" && (!direccion || !ciudad)) {
        alert("Por favor completa la dirección y ciudad para el envío.");
        return;
    }

    // Estado del pago según el tipo de entrega
    const estadoPago = tipo === "contraentrega"
        ? "Pendiente de pago contraentrega"
        : "Pendiente de pago en línea";

    const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

    const pedido = {
        usuarioId: usuarioActual ? usuarioActual.uid : null,
        usuarioEmail: usuarioActual ? usuarioActual.email : null,
        cliente: {
            nombre,
            telefono
        },
        tipoEntrega: tipo,
        direccion: tipo === "domicilio" ? { direccion, ciudad, barrio } : null,
        nota: nota || null,
        productos: carrito.map(item => ({
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: parseFloat((item.precio * item.cantidad).toFixed(2))
        })),
        total: parseFloat(total.toFixed(2)),
        estadoPago: estadoPago,
        estadoPedido: "Recibido",
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Deshabilitar botón para evitar doble envío mientras se guarda
    const btnConfirmar = document.querySelector(".btn-confirmar");
    const textoOriginal = btnConfirmar.textContent;
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Guardando pedido...";

    db.collection("pedidos").add(pedido)
        .then(() => {
            alert(`✅ ¡Pedido confirmado, ${nombre}!\n\nEstado: ${estadoPago}\n\nTe contactaremos al ${telefono} para coordinar tu ${tipo === "domicilio" ? "envío" : "pago contraentrega"}.`);
            carrito = [];
            actualizarCarrito();
            cerrarModalPago();
        })
        .catch(err => {
            console.error("Error al guardar el pedido:", err);
            alert("Hubo un problema al guardar tu pedido. Por favor intenta de nuevo.");
        })
        .finally(() => {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = textoOriginal;
        });
}
