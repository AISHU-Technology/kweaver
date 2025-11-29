package version

import (
	"runtime"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
)

var (
	ServerName    string = "ontology-query"
	ServerVersion string = "6.0.0"
	LanguageGo    string = "go"
	GoVersion     string = runtime.Version()
	GoArch        string = runtime.GOARCH
)

func init() {
	audit.DEFAULT_AUDIT_LOG_FROM = audit.AuditLogFrom{
		Package: "OntologyEngine",
		Service: audit.AuditLogFromService{
			Name: "ontology-query",
		},
	}
}
