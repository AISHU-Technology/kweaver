package leo

import (
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type TokenImpl struct {
	TokenUtil
}

func (t *TokenImpl) TokenVali() gin.HandlerFunc {
	return func(c *gin.Context) {

		if c.Request.Header.Get("Content-Type") != "application/json" {

			c.AbortWithStatusJSON(400, gin.H{"Code": "400001"})
			return
		}

		if _, ok := t.GetM()[c.Request.URL.Path]; !ok {

			author := c.Request.Header.Get("Authorization")
			if author == "" {
				c.AbortWithStatusJSON(401, gin.H{"Code": "400003"})
				return
			}
			_, err := jwt.Parse(author, func(*jwt.Token) (interface{}, error) {
				return []byte(t.GetSalt()), nil
			})
			if err != nil {
				//fmt.Println(err)
				b := err.Error()
				if b == "signature is invalid" {
					c.AbortWithStatusJSON(401, gin.H{"Code": "400005"})
					return
				} else if b == "Token is expired" {
					c.AbortWithStatusJSON(401, gin.H{"Code": "400006"})
					return
				}
			}
		}
		c.Next()
	}
}
func (t *TokenImpl) Builder(name string) (string, error) {
	fmt.Println(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
	token := jwt.New(jwt.SigningMethodHS256)
	claims := make(jwt.MapClaims)
	claims["domain"] = "aishu.cn"
	claims["iss"] = time.Now().Unix() //signal
	dur, _ := time.ParseDuration("30m")
	claims["exp"] = time.Now().Add(dur).Unix() //expire
	claims["user"] = name
	token.Claims = claims
	return token.SignedString([]byte(t.salt))
}

func TestTokenVali(t *testing.T) {
	resp := httptest.NewRecorder()
	c, r := gin.CreateTestContext(resp)
	timpl := new(TokenImpl)
	timpl.WriteSalt("ANDATA").WriteM(map[string]int{"/api/manager/v1/login": 0})
	token, _ := timpl.Build(timpl, "admin")
	fmt.Println(token)
	r.Use(timpl.Validator(timpl))

	r.GET("/login", func(c *gin.Context) {
		NewResponse(c, Info{})
	})

	c.Request, _ = http.NewRequest(http.MethodGet, "/api/manager/v1/login", nil)
	c.Request.Header.Add("Content-Type", "application/json")
	c.Request.Header.Add("Authorization", token)
	r.ServeHTTP(resp, c.Request)
	//fmt.Println(resp.Code)
	//fmt.Println(resp.Body)
	assert.Equal(t, resp.Code, 404)
}
