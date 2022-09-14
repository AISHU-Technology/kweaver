package config

type Swagger struct {
	Title       string                   `mapstructure:"title" json:"title" yaml:"title"`
	Version     string                   `mapstructure:"version" json:"version" yaml:"version"`
	Description string                   `mapstructure:"description" json:"description" yaml:"description"`
	License     map[string]interface{}   `mapstructure:"license" json:"license" yaml:"license"`
	Tags        []map[string]interface{} `mapstructure:"tags" json:"tags" yaml:"tags"`
	DocUrls     []string                 `mapstructure:"doc_urls" json:"doc_urls" yaml:"doc_urls"`
}
