// Package canvas 画布数据库层实现
package canvas

import (
	"context"
	"database/sql"
	"fmt"
	"gorm.io/gorm"
	"strconv"
	"strings"

	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
	"kw-graph/internal/logic/repo"
)

// 编译器检查是否异常
var _ repo.CanvasesRepo = (*CanvasesRepo)(nil)

// CanvasesRepo 画布对象
type CanvasesRepo struct {
	dbEngine *gorm.DB
}

// NewCanvasesRepo 画布对象实例化
func NewCanvasesRepo(dbEngine *gorm.DB) repo.CanvasesRepo {
	return &CanvasesRepo{
		dbEngine: dbEngine,
	}
}

// CreateCanvas 创建画布
func (c *CanvasesRepo) CreateCanvas(ctx context.Context, info *repo.Canvas) (int64, error) {

	if err := c.dbEngine.Model(&repo.Canvas{}).Create(info).Error; err != nil {
		return -1, err
	}

	return info.ID, nil
}

// UpdateCanvas 更新画布
func (c *CanvasesRepo) UpdateCanvas(ctx context.Context, info *repo.Canvas) error {
	sqlStr := "update `canvas` set `canvas_name` = ?,`canvas_info` = ?, `canvas_body` = ?, `update_user` = ?, `update_time` = ? where `id` = ?"
	if err := c.dbEngine.Exec(sqlStr,
		info.CanvasName,
		info.CanvasInfo,
		info.CanvasBody,
		info.UpdateUser,
		info.UpdateTime,
		info.ID,
	).Error; err != nil {
		return err
	}

	return nil
}

// DeleteCanvas 批量删除画布
func (c *CanvasesRepo) DeleteCanvas(ctx context.Context, ids []int64) ([]int64, error) {
	// 获取实际的画布列表
	var realIds []int64

	var groupsStr []string
	configs := make([]interface{}, 0, len(ids))
	for _, id := range ids {
		configs = append(configs, strconv.Itoa(int(id)))
		groupsStr = append(groupsStr, "?")
	}

	// 判断画布名称是否已存在
	querySql := fmt.Sprintf("select id from `canvas` where `id` in (%s)", strings.Join(groupsStr, ","))
	var rows *sql.Rows
	rows, err := c.dbEngine.Raw(querySql, configs...).Rows()

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	if err != nil {

		return nil, err
	}

	for rows.Next() {
		var cID int64
		if err := rows.Scan(
			&cID,
		); err != nil {

			return nil, err
		}
		realIds = append(realIds, cID)
	}

	if len(realIds) == 0 {
		return realIds, nil
	}

	groupsStr = []string{}
	configs = make([]interface{}, 0, len(realIds))
	for _, id := range realIds {
		configs = append(configs, strconv.Itoa(int(id)))
		groupsStr = append(groupsStr, "?")
	}

	sqlStr := fmt.Sprintf("delete from `canvas` where `id` in (%s)", strings.Join(groupsStr, ","))
	if err = c.dbEngine.Exec(sqlStr, configs...).Error; err != nil {
		return nil, err
	}

	return realIds, nil
}

// DeleteCanvasByKgIDs 根据kgIDs删除画布
func (c *CanvasesRepo) DeleteCanvasByKgIDs(ctx context.Context, kgIDs []int64) ([]int64, error) {
	// 获取实际的画布列表
	var realIds []int64

	var groupsStr []string
	configs := make([]interface{}, 0, len(kgIDs))
	for _, id := range kgIDs {
		configs = append(configs, strconv.Itoa(int(id)))
		groupsStr = append(groupsStr, "?")
	}

	// 判断画布名称是否已存在
	querySql := fmt.Sprintf("select id from `canvas` where `kg_id` in (%s)", strings.Join(groupsStr, ","))
	var rows *sql.Rows
	rows, err := c.dbEngine.Raw(querySql, configs...).Rows()

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	if err != nil {

		return nil, err
	}

	for rows.Next() {
		var cID int64
		if err := rows.Scan(
			&cID,
		); err != nil {

			return nil, err
		}
		realIds = append(realIds, cID)
	}

	if len(realIds) == 0 {
		return realIds, nil
	}

	groupsStr = []string{}
	configs = make([]interface{}, 0, len(realIds))
	for _, id := range realIds {
		configs = append(configs, strconv.Itoa(int(id)))
		groupsStr = append(groupsStr, "?")
	}

	sqlStr := fmt.Sprintf("delete from `canvas` where `id` in (%s)", strings.Join(groupsStr, ","))
	if err = c.dbEngine.Exec(sqlStr, configs...).Error; err != nil {
		return nil, err
	}

	return realIds, nil
}

// GetKgIDsByCID 根据画布ID获取图谱ID
func (c *CanvasesRepo) GetKgIDsByCID(ctx context.Context, cIDs []int64) ([]int64, error) {
	var kgIDs []int64

	var groupsStr []string
	configs := make([]interface{}, 0, len(cIDs))
	for _, id := range cIDs {
		configs = append(configs, strconv.Itoa(int(id)))
		groupsStr = append(groupsStr, "?")
	}
	querySql := fmt.Sprintf("select kg_id from `canvas` where `id` in (%s)", strings.Join(groupsStr, ","))
	var rows *sql.Rows
	rows, err := c.dbEngine.Raw(querySql, configs...).Rows()

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	if err != nil {

		return nil, err
	}

	isExisted := false
	for rows.Next() {
		isExisted = true
		var kgID int64
		if err := rows.Scan(
			&kgID,
		); err != nil {

			return nil, err
		}
		kgIDs = append(kgIDs, kgID)
	}
	if !isExisted {
		return nil, nil
	}

	return kgIDs, nil
}

// GetCanvasByCID 根据画布id获取画布
func (c *CanvasesRepo) GetCanvasByCID(ctx context.Context, cID int64) (*repo.Canvas, error) {
	canvas := &repo.Canvas{}

	// 判断画布名称是否已存在
	sqlStr := "select `id`, `knw_id`, `kg_id`, `canvas_name`, `canvas_info`, `canvas_body`, " +
		"`create_user`, `create_time`, `update_user`, `update_time` " +
		"from `canvas` where `id` = ? "
	var rows *sql.Rows
	rows, err := c.dbEngine.Raw(sqlStr, cID).Rows()

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	if err != nil {

		return nil, err
	}

	isExisted := false
	for rows.Next() {
		isExisted = true
		if err := rows.Scan(
			&canvas.ID,
			&canvas.KnwID,
			&canvas.KgID,
			&canvas.CanvasName,
			&canvas.CanvasInfo,
			&canvas.CanvasBody,
			&canvas.CreateUser,
			&canvas.CreateTime,
			&canvas.UpdateUser,
			&canvas.UpdateTime,
		); err != nil {

			return nil, err
		}
	}
	if !isExisted {
		return nil, nil
	}

	return canvas, nil
}

// GetCanvasList 获取画布列表
func (c *CanvasesRepo) GetCanvasList(ctx context.Context, req *types.GetCanvasesListRequest) ([]*repo.Canvas, int64, error) {
	var canvases []*repo.Canvas
	// 获取画布数量
	count, err := c.GetCanvasListCount(ctx, req.KgID, req.Query)
	if err != nil {
		return nil, -1, err
	}

	qeurySql := ""
	var rows *sql.Rows
	if req.Query == "" {
		order := "`" + req.OrderField + "`" + " " + req.OrderType
		qeurySql = "select `id`, `knw_id`, `kg_id`, `canvas_name`, `canvas_info`, " +
			"`canvas_body`, `create_user`, `create_time`, `update_user`, `update_time` " +
			"from `canvas` where `kg_id` = ? order by ? limit ? offset ?"

		rows, err = c.dbEngine.Raw(qeurySql, req.KgID, order, req.Size, (req.Page-1)*req.Size).Rows()
		if err != nil {
			return nil, -1, err
		}
	} else {
		req.Query = "%" + req.Query + "%"
		order := "`" + req.OrderField + "`" + " " + req.OrderType
		qeurySql = "select `id`, `knw_id`, `kg_id`, `canvas_name`, `canvas_info`, " +
			"`canvas_body`, `create_user`, `create_time`, `update_user`, `update_time` " +
			"from `canvas` where `kg_id` = ? and canvas_name like ? order by ? limit ? offset ?"

		rows, err = c.dbEngine.Raw(qeurySql, req.KgID, req.Query, order, req.Size, (req.Page-1)*req.Size).Rows()
		if err != nil {
			return nil, -1, err
		}
	}

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	for rows.Next() {
		canvas := &repo.Canvas{}
		if err := rows.Scan(
			&canvas.ID,
			&canvas.KnwID,
			&canvas.KgID,
			&canvas.CanvasName,
			&canvas.CanvasInfo,
			&canvas.CanvasBody,
			&canvas.CreateUser,
			&canvas.CreateTime,
			&canvas.UpdateUser,
			&canvas.UpdateTime,
		); err != nil {

			return nil, -1, err
		}
		canvases = append(canvases, canvas)
	}

	return canvases, count, nil
}

// GetCanvasListCount 获取画布数量
func (c *CanvasesRepo) GetCanvasListCount(ctx context.Context, kgID int64, query string) (int64, error) {
	var count int64 = 0
	countSql := ""

	var rows *sql.Rows
	var err error
	if query == "" {
		countSql = "select count(*) from `canvas` where `kg_id` = ?"
		rows, err = c.dbEngine.Raw(countSql, kgID).Rows()
	} else {
		query = "%" + query + "%"
		countSql = "select count(*) from `canvas` where `kg_id` = ? and `canvas_name` like ?"
		rows, err = c.dbEngine.Raw(countSql, kgID, query).Rows()
	}

	if err != nil {

		return -1, err
	}

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	for rows.Next() {
		if err := rows.Scan(
			&count,
		); err != nil {

			return -1, err
		}
	}

	return count, nil
}

// GetCanvasIDByName 根据画布名称获取画布id
func (c *CanvasesRepo) GetCanvasIDByName(ctx context.Context, name string) (id int64, err error) {
	// 判断画布名称是否已存在
	qeurySql := "select id from `canvas` where `canvas_name` = ?"
	var rows *sql.Rows
	rows, err = c.dbEngine.Raw(qeurySql, name).Rows()

	defer func() {
		if rows != nil {
			if rowsErr := rows.Err(); rowsErr != nil {
				logx.Error(rowsErr.Error())
			}

			// 1、判断是否为空再关闭，2、如果不关闭而数据行并没有被scan的话，连接一直会被占用直到超时断开
			if closeErr := rows.Close(); closeErr != nil {
				logx.Error(closeErr.Error())
			}
		}
	}()

	if err != nil {

		return -1, err
	}

	isExisted := false
	for rows.Next() {
		isExisted = true
		if err := rows.Scan(
			&id,
		); err != nil {

			return -1, err
		}
	}
	if !isExisted {
		return -1, nil
	}

	return id, nil
}
