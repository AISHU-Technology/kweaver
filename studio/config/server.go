package config

type Server struct {
	Host string `mapstructure:"host" json:"host" yaml:"host"` //服务主机名
	Port string `mapstructure:"port" json:"port" yaml:"port"` //服务端口号
	Mode string `mapstructure:"mode" json:"mode" yaml:"mode"` //gin运行模式 debug/release/test
}
