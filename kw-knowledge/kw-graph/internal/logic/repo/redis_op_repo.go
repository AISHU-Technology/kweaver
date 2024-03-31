package repo

import "context"

// GraphInfo 图谱信息
type GraphInfo struct {
	ID           int64
	DBName       string
	OntologyInfo *OntologyInfo
}

// RedisOpRepo redis 操作接口
type RedisOpRepo interface {
	// GetGraphInfoByKgID 通过kgID获取图谱信息
	GetGraphInfoByKgID(ctx context.Context, kgID string) (*GraphInfo, error)
}
