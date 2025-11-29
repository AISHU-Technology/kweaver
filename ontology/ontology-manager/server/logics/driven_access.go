package logics

import (
	"database/sql"

	"ontology-manager/interfaces"
)

var (
	DB  *sql.DB
	ATA interfaces.ActionTypeAccess
	BSA interfaces.BusinessSystemAccess
	KNA interfaces.KNAccess
	DDA interfaces.DataModelAccess
	DVA interfaces.DataViewAccess
	JA  interfaces.JobAccess
	MFA interfaces.ModelFactoryAccess
	OTA interfaces.ObjectTypeAccess
	OSA interfaces.OpenSearchAccess
	PA  interfaces.PermissionAccess
	RTA interfaces.RelationTypeAccess
	UMA interfaces.UserMgmtAccess
)

func SetDB(db *sql.DB) {
	DB = db
}

func SetJobAccess(ja interfaces.JobAccess) {
	JA = ja
}

func SetKNAccess(kna interfaces.KNAccess) {
	KNA = kna
}

func SetModelFactoryAccess(mfa interfaces.ModelFactoryAccess) {
	MFA = mfa
}

func SetDataModelAccess(dda interfaces.DataModelAccess) {
	DDA = dda
}

func SetDataViewAccess(dda interfaces.DataViewAccess) {
	DVA = dda
}

func SetObjectTypeAccess(ota interfaces.ObjectTypeAccess) {
	OTA = ota
}

func SetOpenSearchAccess(i interfaces.OpenSearchAccess) {
	OSA = i
}

func SetPermissionAccess(pa interfaces.PermissionAccess) {
	PA = pa
}

func SetRelationTypeAccess(rta interfaces.RelationTypeAccess) {
	RTA = rta
}

func SetActionTypeAccess(ata interfaces.ActionTypeAccess) {
	ATA = ata
}

func SetUserMgmtAccess(uma interfaces.UserMgmtAccess) {
	UMA = uma
}

func SetBusinessSystemAccess(bsa interfaces.BusinessSystemAccess) {
	BSA = bsa
}
