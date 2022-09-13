package initialize

import (
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"kw-studio/config"
	"log"
	"sync"
)

var mux = &sync.Mutex{}

// Config 初始化配置
func Config(paths ...string) *config.Config {
	log.Println("Start initializing the configuration")
	var config = &config.Config{}
	for _, path := range paths {
		if ok, _ := PathExists(path); !ok {
			log.Printf("path '%s' not exist", path)
			continue
		}
		v := viper.New()
		v.SetConfigFile(path)
		v.SetConfigType("yaml")
		if err := v.ReadInConfig(); err != nil {
			log.Printf("Failed to initialize the configuration file under the '%s' path: %v", path, err)
		}
		v.OnConfigChange(func(e fsnotify.Event) {
			mux.Lock()
			defer mux.Unlock()
			log.Printf("The configuration file under the '%s' path has been changed", path)
			if err := v.Unmarshal(config); err != nil {
				log.Panic(err.Error())
			}
		})
		if err := v.Unmarshal(config); err != nil {
			log.Printf("Failed to initialize the configuration file under the '%s' path: %v", path, err)
		}
		log.Printf("The configuration file under the '%s' path was initialized successfully", path)
	}
	log.Println("Initial configuration complete")
	return config
}
