package config

type Redis struct {
	Mode             string                   `mapstructure:"mode" json:"mode" yaml:"mode"`             //stand-alone sentinel
	Host             string                   `mapstructure:"host" json:"host" yaml:"host"`             // 服务器ip
	Port             string                   `mapstructure:"port" json:"port" yaml:"port"`             //服务器port
	User             string                   `mapstructure:"user" json:"user" yaml:"user"`             //用户名
	Password         string                   `mapstructure:"password" json:"password" yaml:"password"` // 密码
	MasterName       string                   `mapstructure:"master_name" json:"master_name" yaml:"master_name"`
	Sentinel         []map[string]interface{} `mapstructure:"sentinel" json:"sentinel" yaml:"sentinel"`                            //sentinel地址
	SentinelUser     string                   `mapstructure:"sentinel_user" json:"sentinel_user" yaml:"sentinel_user"`             //sentinel用户名
	SentinelPassword string                   `mapstructure:"sentinel_password" json:"sentinel_password" yaml:"sentinel_password"` //sentinel密码
	DB               int                      `mapstructure:"db" json:"db" yaml:"db"`                                              // redis的哪个数据库
}
