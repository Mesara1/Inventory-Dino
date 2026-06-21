-- Migration: Finance feature (income/expense ledger + recipe cost/profit)
-- Run once against an already-initialized DB (schema.sql only applies on fresh container init)

ALTER TABLE items
    ADD COLUMN package_price DECIMAL(10,2) NULL,
    ADD COLUMN package_size_g DECIMAL(10,2) NULL;

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    txn_date DATE NOT NULL,
    type ENUM('income','expense') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','transfer') NOT NULL,
    description VARCHAR(255) NOT NULL,
    handled_by VARCHAR(100) NULL,
    note TEXT NULL,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_txn_amount CHECK (amount >= 0),
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    bags_per_batch DECIMAL(10,2) NOT NULL,
    sale_price_per_bag DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_bags_per_batch CHECK (bags_per_batch > 0),
    CONSTRAINT chk_sale_price CHECK (sale_price_per_bag >= 0)
);

CREATE TABLE recipe_ingredients (
    recipe_ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity_g DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_quantity_g CHECK (quantity_g > 0),
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

ALTER TABLE activity_logs
    MODIFY COLUMN action ENUM(
        'CREATE_ITEM',
        'UPDATE_ITEM',
        'DELETE_ITEM',
        'RESTORE_ITEM',
        'CREATE_USER',
        'UPDATE_USER',
        'DEACTIVATE_USER',
        'LOGIN',
        'LOGOUT',
        'CREATE_TRANSACTION',
        'UPDATE_TRANSACTION',
        'DELETE_TRANSACTION',
        'CREATE_RECIPE',
        'UPDATE_RECIPE',
        'DELETE_RECIPE'
    ) NOT NULL;
