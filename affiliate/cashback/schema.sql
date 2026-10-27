-- Einmalig in phpMyAdmin (All-Inkl KAS → Datenbanken) ausführen.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  pass_hash VARCHAR(255) NOT NULL,
  ref CHAR(12) NOT NULL UNIQUE,
  verified TINYINT NOT NULL DEFAULT 0,
  verify_hash CHAR(64) NULL,
  reset_hash CHAR(64) NULL,
  reset_expires INT NULL,
  created INT NOT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  shop_id VARCHAR(60) NOT NULL,
  created INT NOT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  network VARCHAR(20) NOT NULL,
  network_id VARCHAR(60) NOT NULL,
  user_id INT NOT NULL,
  advertiser VARCHAR(120) NOT NULL,
  sale_cents INT NOT NULL,
  commission_cents INT NOT NULL,
  cashback_cents INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  tx_date INT NOT NULL,
  updated INT NOT NULL,
  UNIQUE KEY net_tx (network, network_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount_cents INT NOT NULL,
  methode VARCHAR(20) NOT NULL,
  ziel VARCHAR(190) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'offen',
  created INT NOT NULL,
  done INT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  art VARCHAR(20) NOT NULL,
  created INT NOT NULL
) DEFAULT CHARSET=utf8mb4;
