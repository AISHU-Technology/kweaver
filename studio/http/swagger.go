package http

type Swagger interface {
	GetSwaggerDoc(url string) map[string]interface{}
}
