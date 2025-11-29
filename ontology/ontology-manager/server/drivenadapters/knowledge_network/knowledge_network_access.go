package knowledge_network

import (
	"context"
	"database/sql"
	"fmt"
	"sync"

	libCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/common"
	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	sq "github.com/Masterminds/squirrel"
	"github.com/bytedance/sonic"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"ontology-manager/common"
	"ontology-manager/drivenadapters/object_type"
	"ontology-manager/drivenadapters/relation_type"
	"ontology-manager/interfaces"
)

const (
	KN_TABLE_NAME = "t_knowledge_network"
)

var (
	knAccessOnce sync.Once
	knAccess     interfaces.KNAccess
)

type knowledgeNetworkAccess struct {
	appSetting *common.AppSetting
	db         *sql.DB
}

func NewKNAccess(appSetting *common.AppSetting) interfaces.KNAccess {
	knAccessOnce.Do(func() {
		knAccess = &knowledgeNetworkAccess{
			appSetting: appSetting,
			db:         libdb.NewDB(&appSetting.DBSetting),
		}
	})
	return knAccess
}

// 根据ID获取业务知识网络存在性
func (kna *knowledgeNetworkAccess) CheckKNExistByID(ctx context.Context, knID string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Query knowledge network", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_name").
		From(KN_TABLE_NAME).
		Where(sq.Eq{"f_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get id by f_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get id by f_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return "", false, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("获取业务知识网络信息的 sql 语句: %s", sqlStr))

	var name string
	err = kna.db.QueryRow(sqlStr, vals...).Scan(&name)
	if err == sql.ErrNoRows {
		span.SetAttributes(attr.Key("no_rows").Bool(true))
		span.SetStatus(codes.Ok, "")
		return "", false, nil
	} else if err != nil {
		logger.Errorf("row scan failed, err: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Row scan failed, err: %v", err))
		span.SetStatus(codes.Error, "Row scan failed ")
		return "", false, err
	}

	span.SetStatus(codes.Ok, "")
	return name, true, nil
}

// 根据名称获取业务知识网络存在性
func (oma *knowledgeNetworkAccess) CheckKNExistByName(ctx context.Context, knName string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Query knowledge network", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id").
		From(KN_TABLE_NAME).
		Where(sq.Eq{"f_name": knName}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get id by name, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get id by name, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return "", false, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("获取业务知识网络信息的 sql 语句: %s", sqlStr))

	var knID string
	err = oma.db.QueryRow(sqlStr, vals...).Scan(
		&knID,
	)
	if err == sql.ErrNoRows {
		span.SetAttributes(attr.Key("no_rows").Bool(true))
		span.SetStatus(codes.Ok, "")
		return "", false, nil
	} else if err != nil {
		logger.Errorf("row scan failed, err: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Row scan failed, err: %v", err))
		span.SetStatus(codes.Error, "Row scan failed ")
		return "", false, err
	}

	span.SetStatus(codes.Ok, "")
	return knID, true, nil
}

// 创建业务知识网络
func (kna *knowledgeNetworkAccess) CreateKN(ctx context.Context, tx *sql.Tx, KN *interfaces.KN) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "Insert into knowledge network",
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// tags 转成 string 的格式
	tagsStr := libCommon.TagSlice2TagString(KN.Tags)

	sqlStr, vals, err := sq.Insert(KN_TABLE_NAME).
		Columns(
			"f_id",
			"f_name",
			"f_tags",
			"f_comment",
			"f_icon",
			"f_color",
			"f_detail",
			"f_branch",
			"f_base_branch",
			"f_business_domain",
			"f_creator",
			"f_creator_type",
			"f_create_time",
			"f_updater",
			"f_updater_type",
			"f_update_time",
		).
		Values(
			KN.KNID,
			KN.KNName,
			tagsStr,
			KN.Comment,
			KN.Icon,
			KN.Color,
			KN.Detail,
			KN.Branch,
			KN.BaseBranch,
			KN.BusinessDomain,
			KN.Creator.ID,
			KN.Creator.Type,
			KN.CreateTime,
			KN.Updater.ID,
			KN.Updater.Type,
			KN.UpdateTime).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of insert knowledge network, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of insert knowledge network, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("创建业务知识网络的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("insert data error: %v\n", err)
		span.SetStatus(codes.Error, "Insert data error")
		o11y.Error(ctx, fmt.Sprintf("Insert data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 查询业务知识网络列表。查主线的当前版本为true的业务知识网络
func (kna *knowledgeNetworkAccess) ListKNs(ctx context.Context, query interfaces.KNsQueryParams) ([]*interfaces.KN, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select knowledge networks", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	subBuilder := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_branch",
		"f_base_branch",
		"f_business_domain",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time").
		From(KN_TABLE_NAME)

	builder := processQueryCondition(query, subBuilder)

	//排序
	if query.Sort != "" {
		builder = builder.OrderBy(fmt.Sprintf("%s %s", query.Sort, query.Direction))
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select knowledge networks, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select knowledge networks, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return []*interfaces.KN{}, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询业务知识网络列表的 sql 语句: %s; queryParams: %v", sqlStr, query))

	rows, err := kna.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		span.SetStatus(codes.Error, "List data error")
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		return []*interfaces.KN{}, err
	}
	defer rows.Close()

	KNs := make([]*interfaces.KN, 0)
	for rows.Next() {
		KN := interfaces.KN{
			ModuleType: interfaces.MODULE_TYPE_KN,
		}
		tagsStr := ""
		err := rows.Scan(
			&KN.KNID,
			&KN.KNName,
			&tagsStr,
			&KN.Comment,
			&KN.Icon,
			&KN.Color,
			&KN.Detail,
			&KN.Branch,
			&KN.BaseBranch,
			&KN.BusinessDomain,
			&KN.Creator.ID,
			&KN.Creator.Type,
			&KN.CreateTime,
			&KN.Updater.ID,
			&KN.Updater.Type,
			&KN.UpdateTime,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			span.SetStatus(codes.Error, "Row scan error")
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			return []*interfaces.KN{}, err
		}

		// tags string 转成数组的格式
		KN.Tags = libCommon.TagString2TagSlice(tagsStr)
		KNs = append(KNs, &KN)
	}

	span.SetStatus(codes.Ok, "")
	return KNs, nil
}

func (kna *knowledgeNetworkAccess) GetKNsTotal(ctx context.Context, query interfaces.KNsQueryParams) (int, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select knowledge networks total number", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	subBuilder := sq.Select("COUNT(f_id)").From(KN_TABLE_NAME)
	builder := processQueryCondition(query, subBuilder)

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select knowledge networks total, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select knowledge networks total, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询业务知识网络总数的 sql 语句: %s; queryParams: %v", sqlStr, query))

	total := 0
	err = kna.db.QueryRow(sqlStr, vals...).Scan(&total)
	if err != nil {
		logger.Errorf("get knowledge network totals error: %v\n", err)
		span.SetStatus(codes.Error, "Get knowledge network totals error")
		o11y.Error(ctx, fmt.Sprintf("Get knowledge network totals error: %v", err))
		return 0, err
	}

	span.SetStatus(codes.Ok, "")
	return total, nil
}

func (kna *knowledgeNetworkAccess) GetKNByID(ctx context.Context, knID string) (*interfaces.KN, error) {
	ctx, span := ar_trace.Tracer.Start(ctx,
		fmt.Sprintf("Get knowledge network[%s]", knID),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_branch",
		"f_base_branch",
		"f_business_domain",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time",
	).From(KN_TABLE_NAME).
		Where(sq.Eq{"f_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select knowledge network by id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select knowledge network by id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询业务知识网络列表的 sql 语句: %s.", sqlStr))

	tagsStr := ""
	KN := interfaces.KN{
		ModuleType: interfaces.MODULE_TYPE_KN,
	}
	err = kna.db.QueryRow(sqlStr, vals...).Scan(
		&KN.KNID,
		&KN.KNName,
		&tagsStr,
		&KN.Comment,
		&KN.Icon,
		&KN.Color,
		&KN.Detail,
		&KN.Branch,
		&KN.BaseBranch,
		&KN.BusinessDomain,
		&KN.Creator.ID,
		&KN.Creator.Type,
		&KN.CreateTime,
		&KN.Updater.ID,
		&KN.Updater.Type,
		&KN.UpdateTime,
	)
	if err == sql.ErrNoRows {
		span.SetAttributes(attr.Key("no_rows").Bool(true))
		span.SetStatus(codes.Ok, "")
		return nil, nil
	} else if err != nil {
		logger.Errorf("Get knowledge network by id error: %v\n", err)
		span.SetStatus(codes.Error, "Get knowledge network by id error")
		o11y.Error(ctx, fmt.Sprintf("Get knowledge network by id error: %v", err))
		return nil, err
	}

	// tags string 转成数组的格式
	KN.Tags = libCommon.TagString2TagSlice(tagsStr)

	span.SetStatus(codes.Ok, "")
	return &KN, nil
}

func (kna *knowledgeNetworkAccess) UpdateKN(ctx context.Context, tx *sql.Tx, kn *interfaces.KN) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update knowledge network[%s]", kn.KNID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// tags 转成 string 的格式
	tagsStr := libCommon.TagSlice2TagString(kn.Tags)

	data := map[string]any{
		"f_name":         kn.KNName,
		"f_tags":         tagsStr,
		"f_comment":      kn.Comment,
		"f_icon":         kn.Icon,
		"f_color":        kn.Color,
		"f_updater":      kn.Updater.ID,
		"f_updater_type": kn.Updater.Type,
		"f_update_time":  kn.UpdateTime,
	}
	sqlStr, vals, err := sq.Update(KN_TABLE_NAME).
		SetMap(data).
		Where(sq.Eq{"f_id": kn.KNID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update knowledge network by knowledge network_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update knowledge network by knowledge network_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("修改业务知识网络的 sql 语句: %s", sqlStr))

	ret, err := tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("update knowledge network error: %v\n", err)
		span.SetStatus(codes.Error, "Update data error")
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		return err
	}

	//sql语句影响的行数
	RowsAffected, err := ret.RowsAffected()
	if err != nil {
		logger.Errorf("Get RowsAffected error: %v\n", err)
		o11y.Warn(ctx, fmt.Sprintf("Get RowsAffected error: %v ", err))
	}

	if RowsAffected != 1 {
		// 影响行数不等于1不报错，更新操作已经发生
		logger.Errorf("UPDATE %s RowsAffected not equal 1, RowsAffected is %d, KN is %v",
			kn.KNID, RowsAffected, kn)

		o11y.Warn(ctx, fmt.Sprintf("Update %s RowsAffected not equal 1, RowsAffected is %d, KN is %v",
			kn.KNID, RowsAffected, kn))
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (kna *knowledgeNetworkAccess) UpdateKNDetail(ctx context.Context, knID string, detail string) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update knowledge network detail[%s]", knID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()),
		attr.Key("kn_id").String(knID))

	data := map[string]any{
		"f_detail": detail,
	}
	sqlStr, vals, err := sq.Update(KN_TABLE_NAME).
		SetMap(data).
		Where(sq.Eq{"f_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update knowledge network detail by knowledge network_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update knowledge network detail by knowledge network_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}
	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("修改业务知识网络详情的 sql 语句: %s", sqlStr))

	ret, err := kna.db.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("update knowledge network detail error: %v\n", err)
		span.SetStatus(codes.Error, "Update data error")
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		return err
	}

	//sql语句影响的行数
	RowsAffected, err := ret.RowsAffected()
	if err != nil {
		logger.Errorf("Get RowsAffected error: %v\n", err)
		o11y.Warn(ctx, fmt.Sprintf("Get RowsAffected error: %v ", err))
	}

	if RowsAffected != 1 {
		logger.Errorf("UPDATE knowledge network detail %d RowsAffected not equal 1, RowsAffected is %d, KNID is %s",
			knID, RowsAffected, knID)
		o11y.Warn(ctx, fmt.Sprintf("Update knowledge network detail %s RowsAffected not equal 1, RowsAffected is %d",
			knID, RowsAffected))
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (kna *knowledgeNetworkAccess) DeleteKN(ctx context.Context, tx *sql.Tx, knID string) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Delete knowledge networks from db", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()),
		attr.Key("kn_id").String(knID))

	sqlStr, vals, err := sq.Delete(KN_TABLE_NAME).
		Where(sq.Eq{"f_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of delete knowledge network by knowledge network_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of delete knowledge network by knowledge network_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("删除业务知识网络的 sql 语句: %s; 删除的id: %s", sqlStr, knID))

	ret, err := tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("delete data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Delete data error: %v ", err))
		span.SetStatus(codes.Error, "Delete data error")
		return 0, err
	}

	//sql语句影响的行数
	RowsAffected, err := ret.RowsAffected()
	if err != nil {
		logger.Errorf("Get RowsAffected error: %v\n", err)
		span.SetStatus(codes.Error, "Get RowsAffected error")
		o11y.Warn(ctx, fmt.Sprintf("Get RowsAffected error: %v ", err))
		return 0, err
	}

	if RowsAffected != 1 {
		logger.Errorf("DELETE knowledge network %d RowsAffected not equal 1, RowsAffected is %d, KNID is %s",
			knID, RowsAffected, knID)
		o11y.Warn(ctx, fmt.Sprintf("Delete knowledge network %s RowsAffected not equal 1, RowsAffected is %d",
			knID, RowsAffected))
	}

	logger.Infof("RowsAffected: %d", RowsAffected)
	span.SetStatus(codes.Ok, "")
	return RowsAffected, nil
}

// 拼接 sql 过滤条件
func processQueryCondition(query interfaces.KNsQueryParams, subBuilder sq.SelectBuilder) sq.SelectBuilder {
	if query.NamePattern != "" {
		// 模糊查询
		subBuilder = subBuilder.Where(sq.Expr("instr(f_name, ?) > 0", query.NamePattern))
	}

	if query.Tag != "" {
		subBuilder = subBuilder.Where(sq.Expr("instr(f_tags, ?) > 0", `"`+query.Tag+`"`))
	}

	if query.Branch != "" {
		subBuilder = subBuilder.Where(sq.Eq{"f_branch": query.Branch})
	} else {
		// 查主线分支的业务知识网络
		subBuilder = subBuilder.Where(sq.Eq{"f_branch": interfaces.MAIN_BRANCH})
	}

	if query.BusinessDomain != "" {
		subBuilder = subBuilder.Where(sq.Eq{"f_business_domain": query.BusinessDomain})
	}

	return subBuilder
}

// 获取邻居对象类
func (kna *knowledgeNetworkAccess) GetNeighborPathsBatch(ctx context.Context, otIDs []string,
	direction string) (map[string][]interfaces.RelationTypePath, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select relation type paths", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	sqlStr := ""
	vals := []any{}
	var err error
	switch direction {
	case interfaces.DIRECTION_FORWARD:
		subBuilder := sq.Select(
			// 关系信息
			`"forward" as direction`,
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_id",
			"rt.f_name",
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_type",
			"rt.f_mapping_rules",
			// 正向的终点类信息，起点已经在上一轮的时候拿到了，每次再连带着把终点对象类的信息查出来
			"ot.f_id",
			"ot.f_name",
			"ot.f_data_source",
			"ot.f_data_properties",
			"ot.f_logic_properties",
			"ot.f_primary_keys",
			"ot.f_display_key",
		).
			From(relation_type.RT_TABLE_NAME + " " + "AS rt").
			Join(object_type.OT_TABLE_NAME + " " + "AS ot on rt.f_target_object_type_id = ot.f_id").
			Where(sq.Eq{"rt.f_source_object_type_id": otIDs})
		sqlStr, vals, err = subBuilder.ToSql()
		if err != nil {
			logger.Errorf("Failed to build the sql of select model by id, error: %s", err.Error())

			o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select model by id, error: %s", err.Error()))
			span.SetStatus(codes.Error, "Build sql failed ")

			return nil, err
		}
	case interfaces.DIRECTION_BACKWARD:
		subBuilder := sq.Select(
			// 关系信息
			`"backward" as direction`,
			"rt.f_target_object_type_id",
			"rt.f_source_object_type_id",
			"rt.f_id",
			"rt.f_name",
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_type",
			"rt.f_mapping_rules",
			// 反向查找，路径是从关系类的终点到起点，当前的点是关系的终点，要找关系的起点，当前点的信息已经在上一轮的时候拿到了，每次再连带着把路径终点对象类的信息查出来
			"ot.f_id",
			"ot.f_name",
			"ot.f_data_source",
			"ot.f_data_properties",
			"ot.f_logic_properties",
			"ot.f_primary_keys",
			"ot.f_display_key",
		).
			From(relation_type.RT_TABLE_NAME + " " + "AS rt").
			Join(object_type.OT_TABLE_NAME + " " + "AS ot on rt.f_source_object_type_id = ot.f_id").
			Where(sq.Eq{"rt.f_target_object_type_id": otIDs})
		sqlStr, vals, err = subBuilder.ToSql()
		if err != nil {
			logger.Errorf("Failed to build the sql of select model by id, error: %s", err.Error())

			o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select model by id, error: %s", err.Error()))
			span.SetStatus(codes.Error, "Build sql failed ")

			return nil, err
		}
	case interfaces.DIRECTION_BIDIRECTIONAL:
		subBuilder1 := sq.Select(
			// 关系信息
			`"forward" as direction`,
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_id",
			"rt.f_name",
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_type",
			"rt.f_mapping_rules",
			// 正向的终点类信息，起点已经在上一轮的时候拿到了，每次再连带着把终点对象类的信息查出来
			"ot.f_id",
			"ot.f_name",
			"ot.f_data_source",
			"ot.f_data_properties",
			"ot.f_logic_properties",
			"ot.f_primary_keys",
			"ot.f_display_key",
		).
			From(relation_type.RT_TABLE_NAME + " " + "AS rt").
			Join(object_type.OT_TABLE_NAME + " " + "AS ot on rt.f_target_object_type_id = ot.f_id").
			Where(sq.Eq{"rt.f_source_object_type_id": otIDs})
		subBuilder2 := sq.Select(
			// 关系信息
			`"backward" as direction`,
			"rt.f_target_object_type_id",
			"rt.f_source_object_type_id",
			"rt.f_id",
			"rt.f_name",
			"rt.f_source_object_type_id",
			"rt.f_target_object_type_id",
			"rt.f_type",
			"rt.f_mapping_rules",
			// 反向查找，路径是从关系类的终点到起点，当前的点是关系的终点，要找关系的起点，当前点的信息已经在上一轮的时候拿到了，每次再连带着把路径终点对象类的信息查出来
			"ot.f_id",
			"ot.f_name",
			"ot.f_data_source",
			"ot.f_data_properties",
			"ot.f_logic_properties",
			"ot.f_primary_keys",
			"ot.f_display_key",
		).
			From(relation_type.RT_TABLE_NAME + " " + "AS rt").
			Join(object_type.OT_TABLE_NAME + " " + "AS ot on rt.f_target_object_type_id = ot.f_id").
			Where(sq.Eq{"rt.f_source_object_type_id": otIDs})

		sqlStr1, vals1, err := subBuilder1.ToSql()
		if err != nil {
			logger.Errorf("Failed to build the sql of select model by id, error: %s", err.Error())

			o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select model by id, error: %s", err.Error()))
			span.SetStatus(codes.Error, "Build sql failed ")

			return nil, err
		}
		sqlStr2, vals2, err := subBuilder2.ToSql()
		if err != nil {
			logger.Errorf("Failed to build the sql of select model by id, error: %s", err.Error())

			o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select model by id, error: %s", err.Error()))
			span.SetStatus(codes.Error, "Build sql failed ")

			return nil, err
		}

		sqlStr = sqlStr1 + " UNION ALL " + sqlStr2
		vals = append(vals, vals1...)
		vals = append(vals, vals2...)
	}

	rows, err := kna.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		span.SetStatus(codes.Error, "List data error")
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		return nil, err
	}
	defer rows.Close()
	rtPathsMap := map[string][]interfaces.RelationTypePath{}
	for rows.Next() {
		var (
			direction            string
			sourceID, neighborID string
			mappingRulesBytes    []byte
			neighbor             interfaces.ObjectTypeWithKeyField
			relationType         interfaces.RelationTypeWithKeyField
			dataSourceBytes      []byte
			dataPropertiesBytes  []byte
			logicPropertiesBytes []byte
			primaryKeysBytes     []byte
		)

		err := rows.Scan(
			&direction,
			&sourceID,
			&neighborID,
			&relationType.RTID,
			&relationType.RTName,
			&relationType.SourceObjectTypeID,
			&relationType.TargetObjectTypeID,
			&relationType.Type,
			&mappingRulesBytes,
			&neighbor.OTID,
			&neighbor.OTName,
			&dataSourceBytes,
			&dataPropertiesBytes,
			&logicPropertiesBytes,
			&primaryKeysBytes,
			&neighbor.DisplayKey)
		if err != nil {
			return nil, err
		}

		// 2.0 反序列化dMappingRules
		err = sonic.Unmarshal(mappingRulesBytes, &relationType.MappingRules)
		if err != nil {
			logger.Errorf("Failed to unmarshal mappingRules after getting relation type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal mappingRules after getting relation type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal mappingRules error")
			return nil, err
		}
		// 2.0 反序列化datasource
		err = sonic.Unmarshal(dataSourceBytes, &neighbor.DataSource)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal dataSource after getting object type")
			return nil, err
		}

		// 2.1 反序列化DataProperties
		err = sonic.Unmarshal(dataPropertiesBytes, &neighbor.DataProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal dataProperties after getting object type")
			return nil, err
		}

		// 2.2 反序列化LogicProperties
		err = sonic.Unmarshal(logicPropertiesBytes, &neighbor.LogicProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal logicProperties after getting object type")
			return nil, err
		}

		// 2.3 反序列化主键
		err = sonic.Unmarshal(primaryKeysBytes, &neighbor.PrimaryKeys)
		if err != nil {
			logger.Errorf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal primaryKeys after getting object type")
			return nil, err
		}

		// 找相邻就是一度路径，所以在获取邻居的时候把一度路径组装。因为还需要关系上的一些字段
		ots := []interfaces.ObjectTypeWithKeyField{
			{
				OTID: sourceID,
			},
		}
		ots = append(ots, neighbor)
		rtPath := interfaces.RelationTypePath{
			ObjectTypes: ots,
			TypeEdges: []interfaces.TypeEdge{
				{
					RelationTypeId:      relationType.RTID,
					RelationType:        relationType,
					SourceObjectTypeId:  sourceID,
					Target_ObjectTypeId: neighborID,
					Direction:           direction,
				},
			},
			Length: 1,
		}
		rtPathsMap[sourceID] = append(rtPathsMap[sourceID], rtPath)
	}

	return rtPathsMap, nil
}

// 查询业务知识网络列表。查主线的当前版本为true的业务知识网络
func (kna *knowledgeNetworkAccess) GetAllKNs(ctx context.Context) (map[string]*interfaces.KN, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select knowledge networks", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_branch",
		"f_base_branch",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time").
		From(KN_TABLE_NAME).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select knowledge networks, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select knowledge networks, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return map[string]*interfaces.KN{}, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询业务知识网络列表的 sql 语句: %s; queryParams: %v", sqlStr, vals))

	rows, err := kna.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		span.SetStatus(codes.Error, "List data error")
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		return map[string]*interfaces.KN{}, err
	}
	defer rows.Close()

	KNs := make(map[string]*interfaces.KN)
	for rows.Next() {
		KN := interfaces.KN{
			ModuleType: interfaces.MODULE_TYPE_KN,
		}
		tagsStr := ""
		err := rows.Scan(
			&KN.KNID,
			&KN.KNName,
			&tagsStr,
			&KN.Comment,
			&KN.Icon,
			&KN.Color,
			&KN.Detail,
			&KN.Branch,
			&KN.BaseBranch,
			&KN.Creator.ID,
			&KN.Creator.Type,
			&KN.CreateTime,
			&KN.Updater.ID,
			&KN.Updater.Type,
			&KN.UpdateTime,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			span.SetStatus(codes.Error, "Row scan error")
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			return map[string]*interfaces.KN{}, err
		}

		// tags string 转成数组的格式
		KN.Tags = libCommon.TagString2TagSlice(tagsStr)
		KNs[KN.KNID] = &KN
	}

	span.SetStatus(codes.Ok, "")
	return KNs, nil
}
