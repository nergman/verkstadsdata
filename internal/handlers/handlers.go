package handlers

import (
    "database/sql"
    "encoding/json"
    "html/template"
    "net/http"
    "strconv"
    "verktygsdata/internal/auth"
    "verktygsdata/internal/models"

    "github.com/gorilla/mux"
)

type HandlerService struct {
    db        *sql.DB
    templates *template.Template
}

func NewHandlerService(db *sql.DB) *HandlerService {
    templates := template.Must(template.ParseGlob("templates/*.html"))
    return &HandlerService{
        db:        db,
        templates: templates,
    }
}

func (h *HandlerService) SetupRoutes() *mux.Router {
    r := mux.NewRouter()

    // Static files
    r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static/"))))

    // Public routes
    r.HandleFunc("/", h.HomeHandler).Methods("GET")
    r.HandleFunc("/login", h.LoginPageHandler).Methods("GET")
    r.HandleFunc("/login", h.LoginHandler).Methods("POST")
    r.HandleFunc("/register", h.RegisterPageHandler).Methods("GET")
    r.HandleFunc("/register", h.RegisterHandler).Methods("POST")
    r.HandleFunc("/logout", h.LogoutHandler).Methods("POST")

    // Calculator routes (some require premium)
    r.HandleFunc("/svarvtid", h.TurningTimeHandler).Methods("GET")
    r.HandleFunc("/millspeed", h.MillSpeedHandler).Methods("GET")
    r.HandleFunc("/rodcalc", h.RodCalcHandler).Methods("GET") // Premium only

    // API routes
    r.HandleFunc("/api/tools", h.SaveToolHandler).Methods("POST")
    r.HandleFunc("/api/tools", h.GetToolsHandler).Methods("GET")
    r.HandleFunc("/api/tools/{id}", h.DeleteToolHandler).Methods("DELETE")

    return r
}

func (h *HandlerService) HomeHandler(w http.ResponseWriter, r *http.Request) {
    user, _ := auth.GetCurrentUser(r, h.db)
    data := struct {
        User *models.User
    }{
        User: user,
    }
    h.templates.ExecuteTemplate(w, "index.html", data)
}

func (h *HandlerService) LoginPageHandler(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "login.html", nil)
}

func (h *HandlerService) LoginHandler(w http.ResponseWriter, r *http.Request) {
    username := r.FormValue("username")
    password := r.FormValue("password")

    user, err := auth.AuthenticateUser(h.db, username, password)
    if err != nil {
        http.Error(w, "Invalid credentials", http.StatusUnauthorized)
        return
    }

    auth.LoginUser(w, r, user.ID)
    http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (h *HandlerService) RegisterPageHandler(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "register.html", nil)
}

func (h *HandlerService) RegisterHandler(w http.ResponseWriter, r *http.Request) {
    username := r.FormValue("username")
    email := r.FormValue("email")
    password := r.FormValue("password")

    err := auth.CreateUser(h.db, username, email, password)
    if err != nil {
        http.Error(w, "Failed to create user", http.StatusBadRequest)
        return
    }

    http.Redirect(w, r, "/login", http.StatusSeeOther)
}

func (h *HandlerService) LogoutHandler(w http.ResponseWriter, r *http.Request) {
    auth.LogoutUser(w, r)
    http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (h *HandlerService) TurningTimeHandler(w http.ResponseWriter, r *http.Request) {
    user, _ := auth.GetCurrentUser(r, h.db)
    data := struct {
        User *models.User
    }{
        User: user,
    }
    h.templates.ExecuteTemplate(w, "svarvtid.html", data)
}

func (h *HandlerService) MillSpeedHandler(w http.ResponseWriter, r *http.Request) {
    user, _ := auth.GetCurrentUser(r, h.db)
    data := struct {
        User *models.User
    }{
        User: user,
    }
    h.templates.ExecuteTemplate(w, "millspeed.html", data)
}

func (h *HandlerService) RodCalcHandler(w http.ResponseWriter, r *http.Request) {
    user, err := auth.GetCurrentUser(r, h.db)
    if err != nil {
        http.Redirect(w, r, "/login", http.StatusSeeOther)
        return
    }

    if !user.IsPremium {
        http.Error(w, "Premium subscription required", http.StatusForbidden)
        return
    }

    data := struct {
        User *models.User
    }{
        User: user,
    }
    h.templates.ExecuteTemplate(w, "rodcalc.html", data)
}

func (h *HandlerService) SaveToolHandler(w http.ResponseWriter, r *http.Request) {
    user, err := auth.GetCurrentUser(r, h.db)
    if err != nil {
        http.Error(w, "Authentication required", http.StatusUnauthorized)
        return
    }

    var tool models.SavedTool
    if err := json.NewDecoder(r.Body).Decode(&tool); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    tool.UserID = user.ID
    _, err = h.db.Exec("INSERT INTO saved_tools (user_id, tool_name, tool_data, calculator_type) VALUES (?, ?, ?, ?)",
        tool.UserID, tool.ToolName, tool.ToolData, tool.CalculatorType)
    
    if err != nil {
        http.Error(w, "Failed to save tool", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
}

func (h *HandlerService) GetToolsHandler(w http.ResponseWriter, r *http.Request) {
    user, err := auth.GetCurrentUser(r, h.db)
    if err != nil {
        http.Error(w, "Authentication required", http.StatusUnauthorized)
        return
    }

    rows, err := h.db.Query("SELECT id, tool_name, tool_data, calculator_type, created_at FROM saved_tools WHERE user_id = ?", user.ID)
    if err != nil {
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var tools []models.SavedTool
    for rows.Next() {
        var tool models.SavedTool
        tool.UserID = user.ID
        rows.Scan(&tool.ID, &tool.ToolName, &tool.ToolData, &tool.CalculatorType, &tool.CreatedAt)
        tools = append(tools, tool)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tools)
}

func (h *HandlerService) DeleteToolHandler(w http.ResponseWriter, r *http.Request) {
    user, err := auth.GetCurrentUser(r, h.db)
    if err != nil {
        http.Error(w, "Authentication required", http.StatusUnauthorized)
        return
    }

    vars := mux.Vars(r)
    toolID, err := strconv.Atoi(vars["id"])
    if err != nil {
        http.Error(w, "Invalid tool ID", http.StatusBadRequest)
        return
    }

    _, err = h.db.Exec("DELETE FROM saved_tools WHERE id = ? AND user_id = ?", toolID, user.ID)
    if err != nil {
        http.Error(w, "Failed to delete tool", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}
