package leo

// - 描述：token类
// - 作者：alex
// - 时间：2020-5-30

import (
	"github.com/gin-gonic/gin"
)

//token验证接口 请将逻辑相关的实现填入 TokenVali 方法
type TokenValidator interface {
	TokenVali() gin.HandlerFunc
}

//创建token 请将逻辑相关的实现填入 Builder 方法
type TokenBuilder interface {
	Builder(name string) (string, error)
}

//token结构体，是父类，具体token的子类需要继承此父类
type TokenUtil struct {
	salt string
	m    map[string]int
}

//填入盐
func (t *TokenUtil) WriteSalt(salt string) (util *TokenUtil) {
	t.salt = salt
	return t
}

//填入过滤的url
func (t *TokenUtil) WriteM(m map[string]int) (util *TokenUtil) {
	t.m = m
	return t
}

//返回过滤url的字典
func (t *TokenUtil) GetM() (m map[string]int) {
	return t.m
}

//返回盐值
func (t *TokenUtil) GetSalt() string {
	return t.salt
}

//创建token的调用方法
func (t *TokenUtil) Build(tI TokenBuilder, name string) (string, error) {
	return tI.Builder(name)

}

//验证token的调用方法
func (t *TokenUtil) Validator(tI TokenValidator) gin.HandlerFunc {
	return tI.TokenVali()
}
