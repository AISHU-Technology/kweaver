package controller

import (
	"github.com/gin-gonic/gin"
	"kw-studio/service"
	"kw-studio/utils/response"
)

type SwaggerController struct {
	SwaggerService *service.SwaggerService
}

// GetSwaggerDoc
// @Summary query api documentation
// @Description query api documentation
// @Tags Studio
// @Router /api/studio/v1/swaggerDoc [get]
// @Produce json
// @Success 200 {object} object "swagger api documentation"
func (controller *SwaggerController) GetSwaggerDoc(c *gin.Context) {
	response.Ok(c, controller.SwaggerService.GetSwaggerDoc())
}
