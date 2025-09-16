package main

import (
	"log"
	"net/http"
	"colorLex/internal/api"
)

func main() {
	srv := api.NewServer()
	srv.Routes()
	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
