package config

type Config struct {
	Server `mapstructure:"server"`
	DB     `mapstructure:"db"`
	Redis  `mapstructure:"redis"`
	Zap    `mapstructure:"zap"`
}
