package config

type Redis struct {
	Mode             string   `mapstructure:"mode" json:"mode" yaml:"mode"`             //stand-alone sentinel
	DB               int      `mapstructure:"db" json:"db" yaml:"db"`                   // redis的哪个数据库
	Host             string   `mapstructure:"host" json:"host" yaml:"host"`             // 服务器ip
	Port             string   `mapstructure:"port" json:"port" yaml:"port"`             //服务器port
	Username         string   `mapstructure:"username" json:"username" yaml:"username"` //用户名
	Password         string   `mapstructure:"password" json:"password" yaml:"password"` // 密码
	MasterName       string   `mapstructure:"master-name" json:"master-name" yaml:"master-name"`
	SentinelAddrs    []string `mapstructure:"sentinel-addrs" json:"sentinel-addrs" yaml:"sentinel-addrs"`          //sentinel地址
	SentinelUsername string   `mapstructure:"sentinel-username" json:"sentinel-username" yaml:"sentinel-username"` //sentinel用户名
	SentinelPassword string   `mapstructure:"sentinel-password" json:"sentinel-password" yaml:"sentinel-password"` //sentinel密码
}
