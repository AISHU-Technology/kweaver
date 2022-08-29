// Package controllers 为接口的控制逻辑
// - 描述：搜索页面随机词条
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-3-27
package controllers

import (
	"bufio"
	"graph-engine/utils"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// readLines 读取文本内容，返回列表切片
func readLines(path string) ([]vertex, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []vertex
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		s := strings.Split(scanner.Text(), ",")
		lines = append(lines, vertex{Name: s[0], Num: s[1]})
	}
	return lines, scanner.Err()
}

// generateRandIntn 在[0,n)内生成num个随机数
func generateRandIntn(n int, num int) []int {
	rand.Seed(time.Now().UnixNano())
	return rand.Perm(n)[:num]
}

// vertex是节点数据类型
type vertex struct {
	Name string
	Num  string
}

// ClickHandler -> 搜索页面中"试一试"
func ClickHandler(c *gin.Context) {
	var num = 3
	lines, err := readLines("./resources/vertex.csv")

	if err != nil {
		utils.ReturnError(c, 500, utils.ErrResourceErr, utils.ErrMsgMap[utils.ErrResourceErr], "read vertex file err", gin.H{"err": err.Error()})
	}

	res := make([]string, num)
	for i, e := range generateRandIntn(len(lines), num) {
		res[i] = lines[e].Name
	}

	c.JSON(http.StatusOK, gin.H{
		"res": res,
	})
}
