package po

var GraphConfigTableModel = &GraphConfigTable{}

type GraphConfigTable struct {
	ID            int
	CreateUser    string
	CreateTime    string
	UpdateUser    string
	UpdateTime    string
	GraphName     string
	GraphStatus   string
	GraphBaseinfo string
	GraphDs       string
	GraphOtl      string
	GraphOtlTemp  string
	GraphInfoext  string
	GraphKmap     string
	GraphKmerge   string
	RabbitmqDs    string
	GraphDbId     int
}
