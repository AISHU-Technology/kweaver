package po

import (
	"time"
)

var FulltextEngineModel = &FulltextEngine{}

type FulltextEngine struct {
	ID       int
	Ip       string
	Port     string
	User     string
	Password string
	Name     string
	Created  time.Time `json:"created" gorm:"autoCreateTime"`
	Updated  time.Time `json:"updated" gorm:"autoUpdateTime"`
}
