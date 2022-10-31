package services

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"graph-engine/logger"
	"time"
)

type LogBody struct {
	Event       string `json:"type" binding:"required,oneof='click''empty''timeout'"`
	EventId     string `json:"event_id" binding:"required"`
	GNS         string `json:"gns" binding:"omitempty"`
	CurrentDate string `json:"current_date"`
	Host        string `json:"host"`
}

func AdvSearchFeedBackLog(c *gin.Context) {
	body := LogBody{}
	err := c.ShouldBindJSON(&body)
	if err != nil {
		c.JSON(400, nil)
		return
	}

	body.CurrentDate = time.Now().Format("2006-01-02 03:04:05 PM")
	body.Host = c.Request.RemoteAddr
	msg, _ := json.Marshal(body)
	logger.FeedbackLog.Info(string(msg))
}
