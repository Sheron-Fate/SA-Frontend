package handler

import (
	"html/template"
	"net/http"
	"os"

	"colorLex/internal/app"
	"colorLex/internal/app/repository"
)

var (
	tmpl      = template.Must(template.ParseGlob("templates/*.html"))
	minioBase = os.Getenv("MINIO_BASE_URL")
)

func ListServices(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	services := repository.FilterServices(q)
	appCount := repository.ApplicationServiceCount("app1")

	data := struct {
		Services  []app.Service
		Q         string
		MinioBase string
		AppCount  int
	}{
		Services:  services,
		Q:         q,
		MinioBase: minioBase,
		AppCount:  appCount,
	}
	tmpl.ExecuteTemplate(w, "services.html", data)
}

func ShowService(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	s := repository.GetService(id)
	if s == nil {
		http.NotFound(w, r)
		return
	}
	data := struct {
		Service   app.Service
		MinioBase string
	}{
		Service:   *s,
		MinioBase: minioBase,
	}
	tmpl.ExecuteTemplate(w, "service.html", data)
}

func ShowApplication(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	a := repository.GetApplication(id)
	if a == nil {
		http.NotFound(w, r)
		return
	}
	services := repository.GetServicesByIDs(a.ServiceIDs)

	data := struct {
		App       app.Application
		Services  []app.Service
		MinioBase string
	}{
		App:       *a,
		Services:  services,
		MinioBase: minioBase,
	}
	tmpl.ExecuteTemplate(w, "application.html", data)
}
