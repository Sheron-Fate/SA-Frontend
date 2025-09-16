package api

import (
	"net/http"

	"colorLex/internal/app/handler"
)

type Server struct{}

func NewServer() *Server { return &Server{} }

func (s *Server) Routes() {
	// статика
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// роуты
	http.HandleFunc("/services", handler.ListServices)
	http.HandleFunc("/service", handler.ShowService)
	http.HandleFunc("/application", handler.ShowApplication)

	// alias для главной
	http.HandleFunc("/", handler.ListServices)
}
