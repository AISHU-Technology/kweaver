package validators

import (
	"github.com/go-playground/validator/v10"
	"regexp"
	"strconv"
)

const (
	domainExp      = "^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\\.?$" //域名
	graphdbnameExp = "^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#\\${<0>}%^&*()_+`'\"{}[\\];:,.?<>|/~！@#￥%…&*·（）—+-。={}|【】：；‘’“”、《》？，。/\n\\\\]+$"
)

var domaincompile = regexp.MustCompile(domainExp)
var graphdbnameCompile = regexp.MustCompile(graphdbnameExp)

var CheckIp validator.Func = func(fl validator.FieldLevel) bool {
	if fl.Field().Interface() == nil {
		return false
	}
	if ip, ok := fl.Field().Interface().(string); ok {
		return domaincompile.Match([]byte(ip))
	} else {
		return false
	}
}

var CheckIpList validator.Func = func(fl validator.FieldLevel) bool {
	if fl.Field().Interface() == nil {
		return false
	}
	if ips, ok := fl.Field().Interface().([]string); ok {
		if len(ips) <= 0 {
			return false
		}
		for _, ip := range ips {
			if !domaincompile.Match([]byte(ip)) {
				return false
			}
		}
		return true
	} else {
		return false
	}
}

var CheckPortList validator.Func = func(fl validator.FieldLevel) bool {
	if fl.Field().Interface() == nil {
		return false
	}
	if ports, ok := fl.Field().Interface().([]string); ok {
		if len(ports) <= 0 {
			return false
		}
		for _, port := range ports {
			intPort, err := strconv.ParseInt(port, 10, 64)
			if err != nil {
				return false
			}
			if intPort <= 0 || intPort > 65535 {
				return false
			}
		}
		return true
	} else {
		return false
	}
}

var CheckGraphDBName validator.Func = func(fl validator.FieldLevel) bool {
	if name, ok := fl.Field().Interface().(string); ok && len([]rune(name)) <= 50 && len([]rune(name)) > 0 && graphdbnameCompile.Match([]byte(name)) {
		return true
	}
	return false
}
