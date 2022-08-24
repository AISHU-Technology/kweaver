package config

type Config struct {
	Server  `mapstructure:"server"`
	Mariadb `mapstructure:"mariadb"`
	Redis   `mapstructure:"redis"`
	Zap     `mapstructure:"zap"`
}
