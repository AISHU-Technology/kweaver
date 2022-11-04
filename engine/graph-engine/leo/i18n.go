// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供了 i18n 的工具包
// - 时间：2020-1-4
package leo

import (
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

// DefaultLang zh-Hans
var DefaultLang = language.AmericanEnglish

// 支持的语言，用于匹配语言
var supportedLang = []language.Tag{
	language.AmericanEnglish,
	language.SimplifiedChinese,
}

// 获取对应语言的 formatter
func getFormater() func(string) *message.Printer {
	var matcher = language.NewMatcher(supportedLang)
	var langPrinters = make(map[string]*message.Printer)

	// 采用闭包解决 map 的唯一性
	return func(lang string) *message.Printer {

		// 尝试获取 Language，失败则使用中文
		t, err := language.Parse(lang)

		if err != nil {
			t = DefaultLang
		}

		tag, _, _ := matcher.Match(t)
		printer, ok := langPrinters[tag.String()]

		if ok {
			return printer
		}

		p := message.NewPrinter(tag)
		langPrinters[tag.String()] = p
		return p
	}
}

// Formater 是一个获取 formater 的函数
var Formater = getFormater()
