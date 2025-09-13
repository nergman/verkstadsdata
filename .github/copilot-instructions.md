# Verkstadsdata Go Web App - AI Agent Instructions

## Project Overview
Verkstadsdata is a Swedish machining calculator web application built with Go. It provides specialized calculators for turning time, milling speeds, and rod calculations with user authentication and premium features.

## Architecture & Service Boundaries

### Core Components
- **Main Entry**: `main.go` initializes database and HTTP server on `:6969`
- **Database Layer**: `internal/database/` handles SQLite with auto-migration
- **Authentication**: `internal/auth/` manages session-based auth with Gorilla Sessions
- **HTTP Handlers**: `internal/handlers/` contains all route handling and HTML rendering
- **Models**: `internal/models/` defines User and SavedTool structs

### Data Flow Pattern
1. Request → Router (Gorilla Mux) → Handler
2. Handler → Auth check → Database operation
3. Template rendering with Go's `html/template`
4. Static files served from `/static/` prefix

## Authentication System
- Session-based auth using Gorilla Sessions with cookie store
- Premium user model: `User.IsPremium` controls access to `/rodcalc`
- Session key `user_id` stores authenticated user ID
- Auth helpers: `GetCurrentUser()`, `LoginUser()`, `LogoutUser()`

## Database Schema
```sql
users: id, username, email, password_hash, is_premium, created_at
saved_tools: id, user_id, tool_name, tool_data, calculator_type, created_at
```

## Calculator Integration
- **Turning Time**: Complex coordinate-based path calculation with canvas visualization
- **Mill Speed**: Bidirectional RPM/feed calculations with tool persistence
- **Rod Calc**: Premium-only feature (placeholder implementation)

## Template Architecture
Templates use Go's `{{if .User}}` patterns for auth-aware rendering:
- Landing page shows premium badges and login state
- Calculator pages include user context in navigation
- Premium features are template-gated with `{{if .User.IsPremium}}`

## CSS Architecture
- Shared variables in `:root` for consistent theming (`--primary-color: #ff9500`)
- Calculator-specific stylesheets (e.g., `svarvtid.css`)
- Responsive grid layouts with CSS Grid and media queries
- Dark theme with orange accent color (`#ff9500`)

## Development Workflows

### Build & Run
```bash
go mod tidy                    # Update dependencies
go run main.go                 # Start dev server on :6969
```

### Database Operations
- SQLite file: `verktygsdata.db` (git-ignored)
- Auto-migration on startup via `database.Initialize()`
- Direct SQL queries in handlers (no ORM)

### Adding New Calculator
1. Create route in `handlers.SetupRoutes()`
2. Add handler method with user context
3. Create HTML template in `templates/`
4. Add CSS file to `static/`
5. Update main landing page grid

## Project-Specific Patterns

### Error Handling
```go
if err != nil {
    http.Error(w, "User-friendly message", http.StatusCode)
    return
}
```

### Template Data Pattern
```go
data := struct {
    User *models.User
}{
    User: user,
}
h.templates.ExecuteTemplate(w, "template.html", data)
```

### Premium Access Control
```go
if !user.IsPremium {
    http.Error(w, "Premium subscription required", http.StatusForbidden)
    return
}
```

## Critical Dependencies
- `github.com/gorilla/mux`: HTTP routing
- `github.com/gorilla/sessions`: Session management  
- `github.com/mattn/go-sqlite3`: SQLite driver
- `golang.org/x/crypto/bcrypt`: Password hashing

## Security Notes
- Cookie session store uses hardcoded key (needs production secret)
- Bcrypt cost factor: 14
- CSRF protection not implemented
- SQL injection prevention via parameterized queries
