package main

import (
    "log"
    "net/http"
    "verktygsdata/internal/database"
    "verktygsdata/internal/handlers"
)

func main() {
    db, err := database.Initialize()
    if err != nil {
        log.Fatal("Failed to initialize database:", err)
    }
    defer db.Close()

    handlerService := handlers.NewHandlerService(db)
    router := handlerService.SetupRoutes()

    log.Println("Server starting on :6969")
    log.Fatal(http.ListenAndServe(":6969", router))
}
