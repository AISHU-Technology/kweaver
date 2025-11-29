package object_type

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
	"ontology-manager/interfaces"
)

const (
	OT_TABLE_NAME = "t_object_type"
)

var (
	otAccessOnce sync.Once
	otAccess     interfaces.ObjectTypeAccess
)

type objectTypeAccess struct {
	appSetting *common.AppSetting
	db         *sql.DB
}

func NewObjectTypeAccess(appSetting *common.AppSetting) interfaces.ObjectTypeAccess {
	otAccessOnce.Do(func() {
		otAccess = &objectTypeAccess{
			appSetting: appSetting,
			db:         libdb.NewDB(&appSetting.DBSetting),
		}
	})
	return otAccess
}

// 根据ID获取对象类存在性
func (ota *objectTypeAccess) CheckObjectTypeExistByID(ctx context.Context, knID string, otID string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Query object type", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_name").
		From(OT_TABLE_NAME).
		Where(sq.Eq{"f_id": otID}).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get object type id by f_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get object type id by f_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return "", false, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("获取对象类信息的 sql 语句: %s", sqlStr))

	var name string
	err = ota.db.QueryRow(sqlStr, vals...).Scan(&name)
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

// 根据名称获取对象类存在性
func (ota *objectTypeAccess) CheckObjectTypeExistByName(ctx context.Context, knID string, name string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Query object type", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select("f_id").
		From(OT_TABLE_NAME).
		Where(sq.Eq{"f_name": name}).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get id by name, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get id by name, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return "", false, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("获取对象类信息的 sql 语句: %s", sqlStr))

	var otID string
	err = ota.db.QueryRow(sqlStr, vals...).Scan(
		&otID,
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
	return otID, true, nil
}

// 创建对象类
func (ota *objectTypeAccess) CreateObjectType(ctx context.Context, tx *sql.Tx, objectType *interfaces.ObjectType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "Insert into object type", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// tags 转成 string 的格式
	tagsStr := libCommon.TagSlice2TagString(objectType.Tags)

	// 2.0 序列化数据来源
	dataSourceBytes, err := sonic.Marshal(objectType.DataSource)
	if err != nil {
		logger.Errorf("Failed to marshal DataSource, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to marshal DataSource, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Marshal DataSource failed ")
		return err
	}
	// 2.1 序列化数据属性
	dataPropertiesBytes, err := sonic.Marshal(objectType.DataProperties)
	if err != nil {
		logger.Errorf("Failed to marshal DataProperties, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to marshal DataProperties, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Marshal DataProperties failed ")
		return err
	}
	// 2.2 序列化逻辑属性
	logicPropertiesBytes, err := sonic.Marshal(objectType.LogicProperties)
	if err != nil {
		logger.Errorf("Failed to marshal LogicProperties, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to marshal LogicProperties, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Marshal LogicProperties failed ")
		return err
	}
	// 2.3 序列化主键数组
	primaryKeysBytes, err := sonic.Marshal(objectType.PrimaryKeys)
	if err != nil {
		logger.Errorf("Failed to marshal PrimaryKeys, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to marshal PrimaryKeys, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Marshal PrimaryKeys failed ")
		return err
	}

	sqlStr, vals, err := sq.Insert(OT_TABLE_NAME).
		Columns(
			"f_id",
			"f_name",
			"f_tags",
			"f_comment",
			"f_icon",
			"f_color",
			"f_detail",
			"f_kn_id",
			"f_branch",
			"f_data_source",
			"f_data_properties",
			"f_logic_properties",
			"f_primary_keys",
			"f_display_key",
			"f_index",
			"f_index_available",
			"f_creator",
			"f_creator_type",
			"f_create_time",
			"f_updater",
			"f_updater_type",
			"f_update_time",
		).
		Values(
			objectType.OTID,
			objectType.OTName,
			tagsStr,
			objectType.Comment,
			objectType.Icon,
			objectType.Color,
			objectType.Detail,
			objectType.KNID,
			objectType.Branch,
			dataSourceBytes,
			dataPropertiesBytes,
			logicPropertiesBytes,
			primaryKeysBytes,
			objectType.DisplayKey,
			objectType.Index,
			objectType.IndexAvailable,
			objectType.Creator.ID,
			objectType.Creator.Type,
			objectType.CreateTime,
			objectType.Updater.ID,
			objectType.Updater.Type,
			objectType.UpdateTime).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of insert object type, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of insert object type, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("创建对象类的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("insert data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Insert data error: %v ", err))
		span.SetStatus(codes.Error, "Insert data error")
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 查询对象类列表。查主线的当前版本为true的对象类
func (ota *objectTypeAccess) ListObjectTypes(ctx context.Context, query interfaces.ObjectTypesQueryParams) ([]*interfaces.ObjectType, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select object types", trace.WithSpanKind(trace.SpanKindClient))
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
		"f_kn_id",
		"f_branch",
		"f_data_source",
		"f_data_properties",
		"f_logic_properties",
		"f_primary_keys",
		"f_display_key",
		"f_index",
		"f_index_available",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time").
		From(OT_TABLE_NAME)

	builder := processQueryCondition(query, subBuilder)

	//排序
	if query.Sort != "" {
		builder = builder.OrderBy(fmt.Sprintf("%s %s", query.Sort, query.Direction))
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object types, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object types, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return []*interfaces.ObjectType{}, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类列表的 sql 语句: %s; queryParams: %v", sqlStr, query))

	rows, err := ota.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		span.SetStatus(codes.Error, "List data error")
		return []*interfaces.ObjectType{}, err
	}
	defer rows.Close()

	objectTypes := make([]*interfaces.ObjectType, 0)
	for rows.Next() {
		objectType := interfaces.ObjectType{
			ModuleType: interfaces.MODULE_TYPE_OBJECT_TYPE,
		}
		tagsStr := ""
		var (
			dataSourceBytes      []byte
			dataPropertiesBytes  []byte
			logicPropertiesBytes []byte
			primaryKeysBytes     []byte
		)
		err := rows.Scan(
			&objectType.OTID,
			&objectType.OTName,
			&tagsStr,
			&objectType.Comment,
			&objectType.Icon,
			&objectType.Color,
			&objectType.Detail,
			&objectType.KNID,
			&objectType.Branch,
			&dataSourceBytes,
			&dataPropertiesBytes,
			&logicPropertiesBytes,
			&primaryKeysBytes,
			&objectType.DisplayKey,
			&objectType.Index,
			&objectType.IndexAvailable,
			&objectType.Creator.ID,
			&objectType.Creator.Type,
			&objectType.CreateTime,
			&objectType.Updater.ID,
			&objectType.Updater.Type,
			&objectType.UpdateTime,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			span.SetStatus(codes.Error, "Row scan error")
			return []*interfaces.ObjectType{}, err
		}

		// tags string 转成数组的格式
		objectType.Tags = libCommon.TagString2TagSlice(tagsStr)

		// 2.0 反序列化datasource
		err = sonic.Unmarshal(dataSourceBytes, &objectType.DataSource)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal dataSource error")
			return []*interfaces.ObjectType{}, err
		}

		// 2.1 反序列化DataProperties
		err = sonic.Unmarshal(dataPropertiesBytes, &objectType.DataProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal dataProperties error")
			return []*interfaces.ObjectType{}, err
		}

		// 2.2 反序列化LogicProperties
		err = sonic.Unmarshal(logicPropertiesBytes, &objectType.LogicProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal logicProperties error")
			return []*interfaces.ObjectType{}, err
		}

		// 2.3 反序列化主键
		err = sonic.Unmarshal(primaryKeysBytes, &objectType.PrimaryKeys)
		if err != nil {
			logger.Errorf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal primaryKeys error")
			return []*interfaces.ObjectType{}, err
		}

		objectTypes = append(objectTypes, &objectType)
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, nil
}

func (ota *objectTypeAccess) GetObjectTypesTotal(ctx context.Context, query interfaces.ObjectTypesQueryParams) (int, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Select object types total number", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	subBuilder := sq.Select("COUNT(f_id)").
		From(OT_TABLE_NAME)
	builder := processQueryCondition(query, subBuilder)

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object types total, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object types total, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类总数的 sql 语句: %s; queryParams: %v", sqlStr, query))

	total := 0
	err = ota.db.QueryRow(sqlStr, vals...).Scan(&total)
	if err != nil {
		logger.Errorf("get object type totals error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Get object type totals error: %v", err))
		span.SetStatus(codes.Error, "Get object type totals error")
		return 0, err
	}

	span.SetStatus(codes.Ok, "")
	return total, nil
}

func (ota *objectTypeAccess) GetObjectTypeByID(ctx context.Context, knID string, otID string) (*interfaces.ObjectType, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get object type[%s]", otID),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_kn_id",
		"f_branch",
		"f_data_source",
		"f_data_properties",
		"f_logic_properties",
		"f_primary_keys",
		"f_display_key",
		"f_index",
		"f_index_available",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time",
	).From(OT_TABLE_NAME).
		Where(sq.Eq{"f_id": otID}).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object type by id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object type by id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类列表的 sql 语句: %s.", sqlStr))

	objectType := interfaces.ObjectType{
		ModuleType: interfaces.MODULE_TYPE_OBJECT_TYPE,
	}
	tagsStr := ""
	var (
		dataSourceBytes      []byte
		dataPropertiesBytes  []byte
		logicPropertiesBytes []byte
		primaryKeysBytes     []byte
	)

	row := ota.db.QueryRowContext(ctx, sqlStr, vals...)
	err = row.Scan(
		&objectType.OTID,
		&objectType.OTName,
		&tagsStr,
		&objectType.Comment,
		&objectType.Icon,
		&objectType.Color,
		&objectType.Detail,
		&objectType.KNID,
		&objectType.Branch,
		&dataSourceBytes,
		&dataPropertiesBytes,
		&logicPropertiesBytes,
		&primaryKeysBytes,
		&objectType.DisplayKey,
		&objectType.Index,
		&objectType.IndexAvailable,
		&objectType.Creator.ID,
		&objectType.Creator.Type,
		&objectType.CreateTime,
		&objectType.Updater.ID,
		&objectType.Updater.Type,
		&objectType.UpdateTime,
	)
	if err != nil {
		logger.Errorf("row scan failed, err: %v \n", err)
		o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
		span.SetStatus(codes.Error, "Row scan error")
		return nil, err
	}

	// tags string 转成数组的格式
	objectType.Tags = libCommon.TagString2TagSlice(tagsStr)

	// 2.0 反序列化datasource
	err = sonic.Unmarshal(dataSourceBytes, &objectType.DataSource)
	if err != nil {
		logger.Errorf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Failed to unmarshal dataSource after getting object type")
		return nil, err
	}

	// 2.1 反序列化DataProperties
	err = sonic.Unmarshal(dataPropertiesBytes, &objectType.DataProperties)
	if err != nil {
		logger.Errorf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Failed to unmarshal dataProperties after getting object type")
		return nil, err
	}

	// 2.2 反序列化LogicProperties
	err = sonic.Unmarshal(logicPropertiesBytes, &objectType.LogicProperties)
	if err != nil {
		logger.Errorf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Failed to unmarshal logicProperties after getting object type")
		return nil, err
	}

	// 2.3 反序列化主键
	err = sonic.Unmarshal(primaryKeysBytes, &objectType.PrimaryKeys)
	if err != nil {
		logger.Errorf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error()))
		span.SetStatus(codes.Error, "Failed to unmarshal primaryKeys after getting object type")
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return &objectType, nil
}

func (ota *objectTypeAccess) GetObjectTypesByIDs(ctx context.Context, knID string, otIDs []string) ([]*interfaces.ObjectType, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get object type[%s]", otIDs), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_kn_id",
		"f_branch",
		"f_data_source",
		"f_data_properties",
		"f_logic_properties",
		"f_primary_keys",
		"f_display_key",
		"f_index",
		"f_index_available",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time",
	).From(OT_TABLE_NAME).
		Where(sq.Eq{"f_id": otIDs}).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object type by id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object type by id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return []*interfaces.ObjectType{}, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类列表的 sql 语句: %s.", sqlStr))

	rows, err := ota.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		span.SetStatus(codes.Error, "List data error")
		return []*interfaces.ObjectType{}, err
	}
	defer rows.Close()

	objectTypes := make([]*interfaces.ObjectType, 0)
	for rows.Next() {
		objectType := interfaces.ObjectType{
			ModuleType: interfaces.MODULE_TYPE_OBJECT_TYPE,
		}
		tagsStr := ""
		var (
			dataSourceBytes      []byte
			dataPropertiesBytes  []byte
			logicPropertiesBytes []byte
			primaryKeysBytes     []byte
		)

		err := rows.Scan(
			&objectType.OTID,
			&objectType.OTName,
			&tagsStr,
			&objectType.Comment,
			&objectType.Icon,
			&objectType.Color,
			&objectType.Detail,
			&objectType.KNID,
			&objectType.Branch,
			&dataSourceBytes,
			&dataPropertiesBytes,
			&logicPropertiesBytes,
			&primaryKeysBytes,
			&objectType.DisplayKey,
			&objectType.Index,
			&objectType.IndexAvailable,
			&objectType.Creator.ID,
			&objectType.Creator.Type,
			&objectType.CreateTime,
			&objectType.Updater.ID,
			&objectType.Updater.Type,
			&objectType.UpdateTime,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			span.SetStatus(codes.Error, "Row scan error")
			return []*interfaces.ObjectType{}, err
		}

		// tags string 转成数组的格式
		objectType.Tags = libCommon.TagString2TagSlice(tagsStr)

		// 2.0 反序列化datasource
		err = sonic.Unmarshal(dataSourceBytes, &objectType.DataSource)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal dataSource after getting object type")
			return []*interfaces.ObjectType{}, err
		}

		// 2.1 反序列化DataProperties
		err = sonic.Unmarshal(dataPropertiesBytes, &objectType.DataProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal dataProperties after getting object type")
			return []*interfaces.ObjectType{}, err
		}

		// 2.2 反序列化LogicProperties
		err = sonic.Unmarshal(logicPropertiesBytes, &objectType.LogicProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal logicProperties after getting object type")
			return []*interfaces.ObjectType{}, err
		}

		// 2.3 反序列化主键
		err = sonic.Unmarshal(primaryKeysBytes, &objectType.PrimaryKeys)
		if err != nil {
			logger.Errorf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Failed to unmarshal primaryKeys after getting object type")
			return []*interfaces.ObjectType{}, err
		}

		objectTypes = append(objectTypes, &objectType)
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, nil
}

func (ota *objectTypeAccess) UpdateObjectType(ctx context.Context, tx *sql.Tx, objectType *interfaces.ObjectType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update object type[%s]", objectType.OTID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// tags 转成 string 的格式
	tagsStr := libCommon.TagSlice2TagString(objectType.Tags)
	// 2.0 序列化数据来源
	dataSourceBytes, err := sonic.Marshal(objectType.DataSource)
	if err != nil {
		logger.Errorf("Failed to marshal DataSource, err: %v", err.Error())
		return err
	}
	// 2.1 序列化数据属性
	dataPropertiesBytes, err := sonic.Marshal(objectType.DataProperties)
	if err != nil {
		logger.Errorf("Failed to marshal DataProperties, err: %v", err.Error())
		return err
	}
	// 2.2 序列化逻辑属性
	logicPropertiesBytes, err := sonic.Marshal(objectType.LogicProperties)
	if err != nil {
		logger.Errorf("Failed to marshal LogicProperties, err: %v", err.Error())
		return err
	}
	// 2.3 序列化主键数组
	primaryKeysBytes, err := sonic.Marshal(objectType.PrimaryKeys)
	if err != nil {
		logger.Errorf("Failed to marshal PrimaryKeys, err: %v", err.Error())
		return err
	}

	data := map[string]any{
		"f_name":             objectType.OTName,
		"f_tags":             tagsStr,
		"f_comment":          objectType.Comment,
		"f_icon":             objectType.Icon,
		"f_color":            objectType.Color,
		"f_data_source":      dataSourceBytes,
		"f_data_properties":  dataPropertiesBytes,
		"f_logic_properties": logicPropertiesBytes,
		"f_primary_keys":     primaryKeysBytes,
		"f_display_key":      objectType.DisplayKey,
		"f_updater":          objectType.Updater.ID,
		"f_updater_type":     objectType.Updater.Type,
		"f_update_time":      objectType.UpdateTime,
	}
	sqlStr, vals, err := sq.Update(OT_TABLE_NAME).
		SetMap(data).
		Where(sq.Eq{"f_id": objectType.OTID}).
		Where(sq.Eq{"f_kn_id": objectType.KNID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update object type by object type id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update object type by object type id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("修改对象类的 sql 语句: %s", sqlStr))

	ret, err := tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("update object type error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		span.SetStatus(codes.Error, "Update data error")
		return err
	}

	//sql语句影响的行数
	RowsAffected, err := ret.RowsAffected()
	if err != nil {
		logger.Errorf("Get RowsAffected error: %v\n", err)
		o11y.Warn(ctx, fmt.Sprintf("Get RowsAffected error: %v ", err))
		span.SetStatus(codes.Error, "Get RowsAffected error")
		return err
	}

	if RowsAffected != 1 {
		// 影响行数不等于1不报错，更新操作已经发生
		logger.Errorf("UPDATE %d RowsAffected not equal 1, RowsAffected is %d, ObjectType is %v",
			objectType.OTID, RowsAffected, objectType)
		o11y.Warn(ctx, fmt.Sprintf("Update %s RowsAffected not equal 1, RowsAffected is %d, ObjectType is %v",
			objectType.OTID, RowsAffected, objectType))
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (ota *objectTypeAccess) UpdateDataProperties(ctx context.Context, objectType *interfaces.ObjectType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update object type[%s]", objectType.OTID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// 2.1 序列化数据属性
	dataPropertiesBytes, err := sonic.Marshal(objectType.DataProperties)
	if err != nil {
		logger.Errorf("Failed to marshal DataProperties, err: %v", err.Error())
		return err
	}

	data := map[string]any{
		"f_data_properties": dataPropertiesBytes,
		"f_updater":         objectType.Updater.ID,
		"f_updater_type":    objectType.Updater.Type,
		"f_update_time":     objectType.UpdateTime,
	}
	sqlStr, vals, err := sq.Update(OT_TABLE_NAME).
		SetMap(data).
		Where(sq.Eq{"f_id": objectType.OTID}).
		Where(sq.Eq{"f_kn_id": objectType.KNID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update object type by object type id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update object type by object type id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("修改对象类的 sql 语句: %s", sqlStr))

	ret, err := ota.db.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("update object type error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		span.SetStatus(codes.Error, "Update data error")
		return err
	}

	//sql语句影响的行数
	RowsAffected, err := ret.RowsAffected()
	if err != nil {
		logger.Errorf("Get RowsAffected error: %v\n", err)
		o11y.Warn(ctx, fmt.Sprintf("Get RowsAffected error: %v ", err))
		span.SetStatus(codes.Error, "Get RowsAffected error")
		return err
	}

	if RowsAffected != 1 {
		// 影响行数不等于1不报错，更新操作已经发生
		logger.Errorf("UPDATE %d RowsAffected not equal 1, RowsAffected is %d, ObjectType is %v",
			objectType.OTID, RowsAffected, objectType)
		o11y.Warn(ctx, fmt.Sprintf("Update %s RowsAffected not equal 1, RowsAffected is %d, ObjectType is %v",
			objectType.OTID, RowsAffected, objectType))
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (ota *objectTypeAccess) DeleteObjectTypes(ctx context.Context, tx *sql.Tx, knID string, otIDs []string) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Delete object types from db", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()),
		attr.Key("kn_id").String(knID),
		attr.Key("ot_ids").String(fmt.Sprintf("%v", otIDs)))

	if len(otIDs) == 0 {
		return 0, nil
	}

	sqlStr, vals, err := sq.Delete(OT_TABLE_NAME).
		Where(sq.Eq{"f_id": otIDs}).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of delete object type by object type id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of delete object type by object type id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("删除对象类的 sql 语句: %s; 删除的对象类ids: %v", sqlStr, otIDs))

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
	}

	if RowsAffected != int64(len(otIDs)) {
		// 影响行数不等于删除的对象类数量不报错，删除操作已经发生
		logger.Errorf("DELETE %d RowsAffected not equal %d, ObjectType ids is %v",
			len(otIDs), RowsAffected, otIDs)
		o11y.Warn(ctx, fmt.Sprintf("Delete %d RowsAffected not equal %d, ObjectType ids is %v",
			len(otIDs), RowsAffected, otIDs))
	}

	logger.Infof("RowsAffected: %d", RowsAffected)
	span.SetStatus(codes.Ok, "")
	return RowsAffected, nil
}

func (ota *objectTypeAccess) GetObjectTypeIDsByKnID(ctx context.Context, knID string) ([]string, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get object type ids by kn_id[%s]", knID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id",
	).From(OT_TABLE_NAME).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object type ids by kn_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object type ids by kn_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类的 sql 语句: %s.", sqlStr))

	rows, err := ota.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		span.SetStatus(codes.Error, "List data error")
		return nil, err
	}
	defer rows.Close()

	otIDs := []string{}
	for rows.Next() {
		var otID string
		err := rows.Scan(
			&otID,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			span.SetStatus(codes.Error, "Row scan error")
			return nil, err
		}

		otIDs = append(otIDs, otID)
	}

	span.SetStatus(codes.Ok, "")
	return otIDs, nil
}

func (ota *objectTypeAccess) GetSimpleObjectTypeByKnID(ctx context.Context, knID string) ([]*interfaces.SimpleObjectType, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get object type ids by kn_id[%s]", knID),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_icon",
		"f_color",
		"f_branch",
	).From(OT_TABLE_NAME).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object type ids by kn_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object type ids by kn_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类的 sql 语句: %s.", sqlStr))

	rows, err := ota.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		span.SetStatus(codes.Error, "List data error")
		return nil, err
	}
	defer rows.Close()

	ots := []*interfaces.SimpleObjectType{}
	for rows.Next() {
		ot := &interfaces.SimpleObjectType{}
		err := rows.Scan(
			&ot.OTID,
			&ot.OTName,
			&ot.Icon,
			&ot.Color,
			&ot.Branch,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			span.SetStatus(codes.Error, "Row scan error")
			return nil, err
		}

		ots = append(ots, ot)
	}

	span.SetStatus(codes.Ok, "")
	return ots, nil
}

func (ota *objectTypeAccess) UpdateObjectTypeIndex(ctx context.Context,
	tx *sql.Tx, knID string, otID string, index string) error {
	ctx, span := ar_trace.Tracer.Start(ctx,
		fmt.Sprintf("Update object type index[%s] by ot_id[%s]", index, otID),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//更新
	sqlStr, vals, err := sq.Update(OT_TABLE_NAME).
		Set("f_index", index).
		Set("f_index_available", true).
		Where(sq.Eq{"f_kn_id": knID}).
		Where(sq.Eq{"f_id": otID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update object type index, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update object type index, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 执行更新
	RowsAffected, err := tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("Failed to exec the sql of update object type index, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to exec the sql of update object type index, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Exec sql failed ")
		return err
	}

	logger.Infof("RowsAffected: %d", RowsAffected)
	span.SetStatus(codes.Ok, "")
	return nil
}

// 拼接 sql 过滤条件
func processQueryCondition(query interfaces.ObjectTypesQueryParams, subBuilder sq.SelectBuilder) sq.SelectBuilder {
	if query.NamePattern != "" {
		// 模糊查询
		subBuilder = subBuilder.Where(sq.Expr("instr(f_name, ?) > 0", query.NamePattern))
	}

	if query.Tag != "" {
		subBuilder = subBuilder.Where(sq.Expr("instr(f_tags, ?) > 0", `"`+query.Tag+`"`))
	}

	if query.KNID != "" {
		subBuilder = subBuilder.Where(sq.Eq{"f_kn_id": query.KNID})
	}

	if query.Branch != "" {
		subBuilder = subBuilder.Where(sq.Eq{"f_branch": query.Branch})
	} else {
		// 查主线分支的业务知识网络
		subBuilder = subBuilder.Where(sq.Eq{"f_branch": interfaces.MAIN_BRANCH})
	}

	// todo: 补充分组id的过滤

	return subBuilder
}

func (ota *objectTypeAccess) GetAllObjectTypesByKnID(ctx context.Context, knID string) (map[string]*interfaces.ObjectType, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get all object types by kn_id[%s]", knID),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	//查询
	sqlStr, vals, err := sq.Select(
		"f_id",
		"f_name",
		"f_tags",
		"f_comment",
		"f_icon",
		"f_color",
		"f_detail",
		"f_kn_id",
		"f_branch",
		"f_data_source",
		"f_data_properties",
		"f_logic_properties",
		"f_primary_keys",
		"f_display_key",
		"f_index",
		"f_index_available",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_updater",
		"f_updater_type",
		"f_update_time").
		From(OT_TABLE_NAME).
		Where(sq.Eq{"f_kn_id": knID}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of select object types by kn_id, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of select object types by kn_id, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询对象类列表的 sql 语句: %s; knID: %s", sqlStr, knID))

	rows, err := ota.db.Query(sqlStr, vals...)
	if err != nil {
		logger.Errorf("list data error: %v\n", err)
		o11y.Error(ctx, fmt.Sprintf("List data error: %v", err))
		span.SetStatus(codes.Error, "List data error")
		return map[string]*interfaces.ObjectType{}, err
	}
	defer rows.Close()

	objectTypes := make(map[string]*interfaces.ObjectType)
	for rows.Next() {
		objectType := interfaces.ObjectType{
			ModuleType: interfaces.MODULE_TYPE_OBJECT_TYPE,
		}
		tagsStr := ""
		var (
			dataSourceBytes      []byte
			dataPropertiesBytes  []byte
			logicPropertiesBytes []byte
			primaryKeysBytes     []byte
		)
		err := rows.Scan(
			&objectType.OTID,
			&objectType.OTName,
			&tagsStr,
			&objectType.Comment,
			&objectType.Icon,
			&objectType.Color,
			&objectType.Detail,
			&objectType.KNID,
			&objectType.Branch,
			&dataSourceBytes,
			&dataPropertiesBytes,
			&logicPropertiesBytes,
			&primaryKeysBytes,
			&objectType.DisplayKey,
			&objectType.Index,
			&objectType.IndexAvailable,
			&objectType.Creator.ID,
			&objectType.Creator.Type,
			&objectType.CreateTime,
			&objectType.Updater.ID,
			&objectType.Updater.Type,
			&objectType.UpdateTime,
		)
		if err != nil {
			logger.Errorf("row scan failed, err: %v \n", err)
			o11y.Error(ctx, fmt.Sprintf("Row scan error: %v", err))
			span.SetStatus(codes.Error, "Row scan error")
			return map[string]*interfaces.ObjectType{}, err
		}

		// tags string 转成数组的格式
		objectType.Tags = libCommon.TagString2TagSlice(tagsStr)

		// 2.0 反序列化datasource
		err = sonic.Unmarshal(dataSourceBytes, &objectType.DataSource)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataSource after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal dataSource error")
			return map[string]*interfaces.ObjectType{}, err
		}

		// 2.1 反序列化DataProperties
		err = sonic.Unmarshal(dataPropertiesBytes, &objectType.DataProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal dataProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal dataProperties error")
			return map[string]*interfaces.ObjectType{}, err
		}

		// 2.2 反序列化LogicProperties
		err = sonic.Unmarshal(logicPropertiesBytes, &objectType.LogicProperties)
		if err != nil {
			logger.Errorf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal logicProperties after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal logicProperties error")
			return map[string]*interfaces.ObjectType{}, err
		}

		// 2.3 反序列化主键
		err = sonic.Unmarshal(primaryKeysBytes, &objectType.PrimaryKeys)
		if err != nil {
			logger.Errorf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error())
			o11y.Error(ctx, fmt.Sprintf("Failed to unmarshal primaryKeys after getting object type, err: %v", err.Error()))
			span.SetStatus(codes.Error, "Unmarshal primaryKeys error")
			return map[string]*interfaces.ObjectType{}, err
		}

		objectTypes[objectType.OTID] = &objectType
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, nil
}
