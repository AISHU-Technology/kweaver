package config

type DB struct {
	Host            string `mapstructure:"host" json:"host" yaml:"host"`                                        // 服务器ip
	Port            string `mapstructure:"port" json:"port" yaml:"port"`                                        //服务器port
	Name            string `mapstructure:"name" json:"name" yaml:"name"`                                        // 数据库名
	Username        string `mapstructure:"username" json:"username" yaml:"username"`                            // 数据库用户名
	Password        string `mapstructure:"password" json:"password" yaml:"password"`                            // 数据库密码
	Type            string `mapstructure:"type" json:"type" yaml:"type"`                                        //数据库类型
	MaxIdleConns    int    `mapstructure:"max-idle-conns" json:"max-idle-conns" yaml:"max-idle-conns"`          // 空闲中的最大连接数
	MaxOpenConns    int    `mapstructure:"max-open-conns" json:"max-open-conns" yaml:"max-open-conns"`          // 打开到数据库的最大连接数
	ConnMaxLifetime int    `mapstructure:"conn-max-lifetime" json:"conn-max-lifetime" yaml:"conn-max-lifetime"` // 空闲数据库连接最大存活时间
	LogMode         string `mapstructure:"log-mode" json:"log-mode" yaml:"log-mode"`                            // 是否开启Gorm全局日志
	LogLevel        int    `mapstructure:"log-level" json:"log-level" yaml:"log-level"`                         // 日志级别 #info 4, warn 3, error 2, silent 1
}
