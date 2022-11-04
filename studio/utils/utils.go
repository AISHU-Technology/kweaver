package utils

func isContains(i int, list []int) bool {
	for _, j := range list {
		if i == j {
			return true
		}
	}
	return false
}

// GetFullArrangementIndex 获取全排列索引
func GetFullArrangementIndex(n int, selectedIdxs []int) [][]int {
	var fullArrangementIdxs [][]int
	for i := 0; i < n; i++ {
		if !isContains(i, selectedIdxs) {
			var childSelectedIdxs []int
			if selectedIdxs == nil {
				childSelectedIdxs = []int{i}
			} else {
				childSelectedIdxs = append(selectedIdxs, i)
			}
			if fullArrangementIdxs == nil {
				if n == len(selectedIdxs)+1 {
					fullArrangementIdxs = [][]int{childSelectedIdxs}
				} else {
					fullArrangementIdxs = GetFullArrangementIndex(n, childSelectedIdxs)
				}
			} else {
				if n == len(selectedIdxs)+1 {
					fullArrangementIdxs = append(fullArrangementIdxs, childSelectedIdxs)
				} else {
					fullArrangementIdxs = append(fullArrangementIdxs, GetFullArrangementIndex(n, childSelectedIdxs)...)
				}
			}
		}
	}
	return fullArrangementIdxs
}
