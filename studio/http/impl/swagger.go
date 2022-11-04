package impl

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"kw-studio/global"
	"net/http"
)

type Swagger struct {
	Client *http.Client
}

func (swagger *Swagger) GetSwaggerDoc(url string) map[string]interface{} {
	if response, err := swagger.Client.Get(url); err != nil {
		global.LOG.Error(fmt.Sprintf("Failed to request swagger documentation：%v", err))
		return nil
	} else {
		defer response.Body.Close()
		var body []byte
		if body, err = ioutil.ReadAll(response.Body); err != nil {
			global.LOG.Error(fmt.Sprintf("Failed to request swagger documentation：%v", err))
		} else {
			if response.StatusCode != http.StatusOK {
				global.LOG.Error(string(body))
			}
			data := map[string]interface{}{}
			if err = json.Unmarshal(body, &data); err != nil {
				global.LOG.Error(fmt.Sprintf("Failed to request swagger documentation：%v", err))
			} else {
				return data
			}
		}
	}
	return nil
}
