package initialize

import (
	"fmt"
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"kw-studio/config"
	"log"
)

// Config 初始化配置
func Config(path string) *config.Config {
	log.Println("Start initializing the configuration")
	var config = &config.Config{}
	viper := viper.New()
	viper.SetConfigFile(path)
	viper.SetConfigType("yaml")
	if err := viper.ReadInConfig(); err != nil {
		log.Panic(fmt.Sprintf("Initial configuration failed: %v", err))
	}
	viper.OnConfigChange(func(e fsnotify.Event) {
		log.Println("config file has changed")
		if err := viper.Unmarshal(config); err != nil {
			log.Panic(err.Error())
		}
	})
	if err := viper.Unmarshal(config); err != nil {
		log.Panic(err.Error())
	}
	log.Println("Initial configuration complete")
	return config
}
