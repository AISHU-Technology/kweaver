package po

import "time"

var GraphDBModel = &GraphDB{}

type GraphDB struct {
	ID         int
	Ip         string
	Port       string
	User       string
	Password   string
	Version    int
	Type       string
	DbUser     string
	DbPs       string
	Name       string
	DbPort     int
	FulltextId int
	Created    time.Time `json:"created" gorm:"autoCreateTime"`
	Updated    time.Time `json:"updated" gorm:"autoUpdateTime"`
}
