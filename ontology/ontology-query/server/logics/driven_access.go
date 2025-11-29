package logics

import (
	"ontology-query/interfaces"
)

var (
	AOA interfaces.AgentOperatorAccess
	MFA interfaces.ModelFactoryAccess
	OMA interfaces.OntologyManagerAccess
	OSA interfaces.OpenSearchAccess
	UA  interfaces.UniqueryAccess
)

func SetAgentOperatorAccess(aoa interfaces.AgentOperatorAccess) {
	AOA = aoa
}

func SetModelFactoryAccess(mfa interfaces.ModelFactoryAccess) {
	MFA = mfa
}

func SetOntologyManagerAccess(ota interfaces.OntologyManagerAccess) {
	OMA = ota
}

func SetOpenSearchAccess(osa interfaces.OpenSearchAccess) {
	OSA = osa
}

func SetUniqueryAccess(ua interfaces.UniqueryAccess) {
	UA = ua
}
