CREATE DATABASE IF NOT EXISTS nutrididacticaDB;
USE nutrididacticaDB;

CREATE USER 'nutrididactica'@'localhost' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON nutrididacticaDB.* TO 'nutrididactica'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE USERS (
    email           VARCHAR(255) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(10),
    password_hash   VARCHAR(60) NOT NULL,
    tipo            VARCHAR(50) NOT NULL DEFAULT 'user'
);

CREATE TABLE CATEGORIES (
    name            VARCHAR(255) PRIMARY KEY,
    description     TEXT
);

CREATE TABLE PRODUCTS (
    name            VARCHAR(255) PRIMARY KEY,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    stock           INT NOT NULL,
    imagen          VARCHAR(500),
    category_name   VARCHAR(255),

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_name) REFERENCES CATEGORIES(name)
        ON DELETE SET NULL
);

CREATE TABLE ORDERS (
    order_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    total       DECIMAL(10,2) NOT NULL,
    status      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (email) REFERENCES USERS(email)
        ON DELETE CASCADE
);

CREATE TABLE ORDER_ITEMS (
    order_item_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    product_name    VARCHAR(255) NOT NULL,
    quantity        INT NOT NULL,
    price           DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_oi_order
        FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_oi_product
        FOREIGN KEY (product_name) REFERENCES PRODUCTS(name)
        ON DELETE RESTRICT
);


CREATE TABLE PAYMENTS (
    payment_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    method          VARCHAR(100) NOT NULL,          -- Método de pago
    amount          DECIMAL(10,2) NOT NULL,         -- Monto pagado
    status          VARCHAR(50) NOT NULL DEFAULT 'Pendiente', 
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha automática

    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
        ON DELETE CASCADE
);

CREATE TABLE ADDRESSES (
    address_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,        -- Usuario dueño de la dirección
    order_id        BIGINT UNSIGNED,              -- Dirección asociada a un pedido
    recipient_name  VARCHAR(255) NOT NULL,        -- Nombre de quien recibe
    phone           VARCHAR(20),                  -- Teléfono del destinatario
    street          VARCHAR(255) NOT NULL,        -- Calle y número
    city            VARCHAR(255) NOT NULL,        -- Ciudad
    state           VARCHAR(255) NOT NULL,        -- Estado/Provincia
    country         VARCHAR(255) NOT NULL,        -- País
    postal_code     VARCHAR(20) NOT NULL,         -- Código postal

    CONSTRAINT fk_address_user
        FOREIGN KEY (email) REFERENCES USERS(email)
        ON DELETE CASCADE,

    CONSTRAINT fk_address_order
        FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
        ON DELETE SET NULL
);





