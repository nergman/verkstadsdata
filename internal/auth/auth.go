package auth

import (
    "database/sql"
    "errors"
    "net/http"
    "verktygsdata/internal/models"

    "github.com/gorilla/sessions"
    "golang.org/x/crypto/bcrypt"
)

var Store = sessions.NewCookieStore([]byte("your-secret-key-here"))

func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

func CreateUser(db *sql.DB, username, email, password string) error {
    hashedPassword, err := HashPassword(password)
    if err != nil {
        return err
    }

    _, err = db.Exec("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        username, email, hashedPassword)
    return err
}

func AuthenticateUser(db *sql.DB, username, password string) (*models.User, error) {
    var user models.User
    err := db.QueryRow("SELECT id, username, email, password_hash, is_premium, created_at FROM users WHERE username = ?",
        username).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.IsPremium, &user.CreatedAt)
    
    if err != nil {
        return nil, err
    }

    if !CheckPasswordHash(password, user.PasswordHash) {
        return nil, errors.New("invalid password")
    }

    return &user, nil
}

func GetUserByID(db *sql.DB, userID int) (*models.User, error) {
    var user models.User
    err := db.QueryRow("SELECT id, username, email, is_premium, created_at FROM users WHERE id = ?",
        userID).Scan(&user.ID, &user.Username, &user.Email, &user.IsPremium, &user.CreatedAt)
    
    if err != nil {
        return nil, err
    }

    return &user, nil
}

func GetCurrentUser(r *http.Request, db *sql.DB) (*models.User, error) {
    session, _ := Store.Get(r, "session")
    userID, ok := session.Values["user_id"].(int)
    if !ok {
        return nil, errors.New("not authenticated")
    }

    return GetUserByID(db, userID)
}

func LoginUser(w http.ResponseWriter, r *http.Request, userID int) error {
    session, _ := Store.Get(r, "session")
    session.Values["user_id"] = userID
    return session.Save(r, w)
}

func LogoutUser(w http.ResponseWriter, r *http.Request) error {
    session, _ := Store.Get(r, "session")
    session.Values["user_id"] = nil
    session.Options.MaxAge = -1
    return session.Save(r, w)
}
