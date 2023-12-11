package main

import (
	"io"
	"log"
	"net/http"
	"os"
)

func main() {
	fs := http.FileServer(http.Dir("./static"))

	http.Handle("/", addHeaders(fs))
	verificationHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			serverUrl := os.Getenv("SERVER_URL")
			request, err := http.NewRequest("POST", serverUrl, r.Body)
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("X-MCAPTCHA-TOKEN", r.Header.Get("X-MCAPTCHA-TOKEN"))
			if err != nil {
				io.Writer(w).Write([]byte(err.Error()))
			}
			client := &http.Client{}
			response, err := client.Do(request)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				io.Writer(w).Write([]byte(err.Error()))
			} else {
				w.WriteHeader(response.StatusCode)
				io.Copy(w, response.Body)
			}
		}
	})
	http.Handle("/verify", verificationHandler)
	log.Print("Listening on :8000...")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func addHeaders(fs http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Frame-Options", "DENY")
		w.Header().Add("X-Content-Type-Options", "nosniff")
		w.Header().Add("Cache-Control", "public, max-age=86400")
		fs.ServeHTTP(w, r)
	}
}
