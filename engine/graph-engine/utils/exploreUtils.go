package utils

type SearchFilterArgs struct {
	Selected     *string
	SelectedRids *[]string
	Filter       *[]SearchFilter
}

type SearchFilter struct {
	Property  string
	Pt        string
	Condition string
	Range     *[]string
}
