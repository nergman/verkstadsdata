package database

import (
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func Initialize() (*sql.DB, error) {
    db, err := sql.Open("sqlite3", "./verktygsdata.db")
    if err != nil {
        return nil, err
    }

    if err := createTables(db); err != nil {
        return nil, err
    }

    return db, nil
}

func createTables(db *sql.DB) error {
    userTable := `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`

    toolsTable := `
    CREATE TABLE IF NOT EXISTS saved_tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tool_name VARCHAR(100) NOT NULL,
        tool_data TEXT NOT NULL,
        calculator_type VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );`

    if _, err := db.Exec(userTable); err != nil {
        return err
    }

    if _, err := db.Exec(toolsTable); err != nil {
        return err
    }

    return nil
}
