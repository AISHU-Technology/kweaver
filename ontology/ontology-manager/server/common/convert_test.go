package common

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func Test_Convert_StringToStringSlice(t *testing.T) {
	Convey("Test StringToStringSlice", t, func() {
		Convey("success 3->3", func() {
			result := StringToStringSlice("1, 2, 3")
			So(result, ShouldResemble, []string{"1", "2", "3"})
		})
		Convey("success 3->2", func() {
			result := StringToStringSlice("1, 2, ")
			So(result, ShouldResemble, []string{"1", "2"})
		})
		Convey("empty", func() {
			result := StringToStringSlice("")
			So(result, ShouldResemble, []string{})
		})
	})
}

func Test_Convert_BytesToGiB(t *testing.T) {
	Convey("Test BytesToGiB", t, func() {
		Convey("BytesToGiB", func() {
			actual := BytesToGiB(1024)
			So(actual, ShouldEqual, 0)
		})
		Convey("BytesToGiB2", func() {
			actual := BytesToGiB(1024 * 1024 * 1024)
			So(actual, ShouldEqual, 1)
		})
		Convey("BytesToGiB3", func() {
			actual := BytesToGiB(1024 * 1024 * 1024 * 10)
			So(actual, ShouldEqual, 10)
		})
	})
}

func Test_Convert_GiBToBytes(t *testing.T) {
	Convey("Test GiBToBytes", t, func() {
		Convey("GiBToBytes", func() {
			actual := GiBToBytes(1)
			So(actual, ShouldEqual, 1024*1024*1024)
		})
		Convey("GiBToBytes2", func() {
			actual := GiBToBytes(10)
			So(actual, ShouldEqual, 1024*1024*1024*10)
		})
		Convey("GiBToBytes3", func() {
			actual := GiBToBytes(0)
			So(actual, ShouldEqual, 0)
		})
	})
}
