package leo

import (
	"io/ioutil"
	"os"

	"gopkg.in/yaml.v2"
)

// ReadYamlConfig 支持将配置的yaml文件加载至与之对应的结构体中
func ReadYamlConfig(bean interface{}, filename string) error {
	yamlFile, err := ioutil.ReadFile(filename)
	if err != nil {
		//fmt.Printf("Loading yaml file err #%v ", err)
		return err
	}
	err = yaml.Unmarshal(yamlFile, bean)
	return err
}

// WriteYamlConfig 保存 yaml 配置文件
func WriteYamlConfig(bean interface{}, filename string) error {
	var file, err = os.OpenFile(filename, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	out, err := yaml.Marshal(bean)
	if err != nil {
		return err
	}
	res, err := file.Write(out)
	if res == 3 || err != nil {
		return err
	}
	err = file.Close()
	return err
}
