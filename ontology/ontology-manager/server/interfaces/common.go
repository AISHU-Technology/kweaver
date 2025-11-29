package interfaces

import (
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
)

type contextKey string // 自定义专属的key类型

const (
	CONTENT_TYPE_NAME = "Content-Type"
	CONTENT_TYPE_JSON = "application/json"

	HTTP_HEADER_METHOD_OVERRIDE = "x-http-method-override"
	HTTP_HEADER_ACCOUNT_ID      = "x-account-id"
	HTTP_HEADER_ACCOUNT_TYPE    = "x-account-type"
	HTTP_HEADER_BUSINESS_DOMAIN = "x-business-domain"

	ACCOUNT_INFO_KEY contextKey = "x-account-info" // 避免直接使用string

	OBJECT_NAME_MAX_LENGTH = 40
	DEFAULT_NAME_PATTERN   = ""
	DEFAULT_OFFEST         = "0"
	DEFAULT_LIMIT          = "10" // LIMIT=-1, 不分页
	DEFAULT_SORT           = "update_time"
	DEFAULT_DIRECTION      = "desc"
	DESC_DIRECTION         = "desc"
	ASC_DIRECTION          = "asc"
	MIN_OFFSET             = 0
	MIN_LIMIT              = 1
	MAX_LIMIT              = 1000
	NO_LIMIT               = "-1"
	DEFAULT_SIMPLE_INFO    = "false"
	COMMENT_MAX_LENGTH     = 255
	NAME_INVALID_CHARACTER = "/:?\\\"<>|：？‘’“”！《》,#[]{}%&*$^!=.'"

	TAGS_MAX_NUMBER = 5

	DEFAULT_FORCE    = "false"
	DEFAULT_GROUP_ID = ""

	DEFAULT_INCLUDE_DETAIL = "false"

	QueryParam_ImportMode = "import_mode"
	QueryParam_Mode       = "mode"

	// 对象的导入模式
	ImportMode_Normal    = "normal"
	ImportMode_Ignore    = "ignore"
	ImportMode_Overwrite = "overwrite"

	Mode_Export = "export"

	// 对象id的校验
	RegexPattern_Builtin_ID    = "^[a-z0-9_][a-z0-9_-]{0,39}$"
	RegexPattern_NonBuiltin_ID = "^[a-z0-9][a-z0-9_-]{0,39}$"

	// 未分组中英文
	UNGROUPED_ZH_CN = "未分组"
	UNGROUPED_EN_US = "Ungrouped"

	// 参数来源
	VALUE_FROM_INPUT    = "input"
	VALUE_FROM_PROPERTY = "property"

	// 属性类型
	PROPERTY_TYPE_METRIC = "metric"

	// search after默认的limit大小
	SearchAfter_Limit = 10000

	// 按_score排序
	OPENSEARCH_SCORE_FIELD = "_score"

	// 对象索引构建时,存储的对象id
	OBJECT_ID = "__id"
)

const (
	MAIN_BRANCH = "main"

	//模块类型
	MODULE_TYPE_KN            = "knowledge_network"
	MODULE_TYPE_OBJECT_TYPE   = "object_type"
	MODULE_TYPE_RELATION_TYPE = "relation_type"
	MODULE_TYPE_ACTION_TYPE   = "action_type"
	MODULE_TYPE_JOB           = "job"
)

const (
	// 概念索引名称
	KN_CONCEPT_INDEX_NAME = "dip-kn_concept"

	// moduleType + id + branch
	KN_CONCEPT_DOCID_TEMPLATE = "%s-%s-%s-%s"
)

var (
	KN_INDEX_PROP_TYPE_MAPPING = map[string]any{
		"boolean": map[string]any{
			"type": "boolean",
		},
		"short": map[string]any{
			"type": "short",
		},
		"int": map[string]any{
			"type": "long",
		},
		"integer": map[string]any{
			"type": "long",
		},
		"bigint": map[string]any{
			"type": "long",
		},
		"long": map[string]any{
			"type": "long",
		},
		"float": map[string]any{
			"type": "float",
		},
		"double": map[string]any{
			"type": "double",
		},
		"decimal": map[string]any{
			"type": "double",
		},
		"timestamp": map[string]any{
			"type":   "date",
			"format": "yyyy-MM-dd HH:mm:ss.SSS||epoch_millis||epoch_second",
		},
		"datetime": map[string]any{
			"type":   "date",
			"format": "yyyy-MM-dd HH:mm:ss.SSS||strict_date_time_no_millis||strict_date_optional_time",
		},
		"date": map[string]any{
			"type":   "date",
			"format": "strict_date",
		},
		"string": map[string]any{
			"type":         "keyword",
			"ignore_above": 1024,
		},
		"varchar": map[string]any{
			"type":         "keyword",
			"ignore_above": 1024,
		},
		"keyword": map[string]any{
			"type":         "keyword",
			"ignore_above": 1024,
		},
		"text": map[string]any{
			"type":     "text",
			"analyzer": "standard",
		},
		"vector": map[string]any{
			"type":      "knn_vector",
			"dimension": 768,
			"method": map[string]any{
				"name":       "hnsw",
				"space_type": "cosinesimil",
				"engine":     "lucene",
				"parameters": map[string]any{
					"ef_construction": 256,
					"m":               48,
				},
			},
		},
	}
)
var (
	KN_INDEX_SETTINGS = map[string]any{
		"index": map[string]any{
			"number_of_shards":    1,
			"number_of_replicas":  0, // 与实际创建索引时保持一致
			"refresh_interval":    "120s",
			"translog.durability": "request",
			"priority":            200,
			// 当前版本OpenSearch KNN 不允许设置codec
			// "codec":                                "zstd_no_dict",
			"replication.type":                     "DOCUMENT",
			"mapping.total_fields.limit":           2000,
			"translog.sync_interval":               "120s",
			"translog.flush_threshold_size":        "1024mb",
			"merge.policy.max_merged_segment":      "2gb",
			"merge.policy.segments_per_tier":       24,
			"unassigned.node_left.delayed_timeout": "24h",
			"highlight.max_analyzed_offset":        1200000,
			"knn":                                  true,
		},
	}

	KN_INDEX_DYNAMIC_TEMPLATES = []any{
		map[string]any{
			"string_fields": map[string]any{
				"match":              "*",
				"match_mapping_type": "string",
				"mapping": map[string]any{
					"type":     "text",
					"analyzer": "standard",
					"fields": map[string]any{
						"keyword": map[string]any{
							"type":         "keyword",
							"ignore_above": 1024,
						},
					},
				},
			},
		},
	}

	// 概念索引内容，字段名与interfaces中结构体的JSON字段名保持一致，字段类型与interfaces中结构体的字段类型保持一致
	KN_CONCEPT_INDEX_BODY = map[string]any{
		"settings": KN_INDEX_SETTINGS,
		"mappings": map[string]any{
			"dynamic_templates": KN_INDEX_DYNAMIC_TEMPLATES,
			"properties": map[string]any{
				// 通用字段
				"module_type": map[string]any{
					"type": "keyword",
				},
				"_vector": map[string]any{
					"type":      "knn_vector",
					"dimension": 768,
					"method": map[string]any{
						"name":       "hnsw",
						"space_type": "cosinesimil",
						"engine":     "lucene",
						"parameters": map[string]any{
							"ef_construction": 256,
							"m":               48,
						},
					},
				},
				"id": map[string]any{
					"type": "keyword",
				},
				"name": map[string]any{
					"type":     "text",
					"analyzer": "standard",
					"fields": map[string]any{
						"keyword": map[string]any{
							"type": "keyword",
						},
					},
				},
				"tags": map[string]any{
					"type": "keyword",
				},
				"comment": map[string]any{
					"type":     "text",
					"analyzer": "standard",
				},
				"detail": map[string]any{
					"type":     "text",
					"analyzer": "standard",
				},
				"kn_id": map[string]any{
					"type": "keyword",
				},
				"branch": map[string]any{
					"type": "keyword",
				},
				"base_branch": map[string]any{
					"type": "keyword",
				},
				"creator": map[string]any{
					"type": "object",
				},
				"create_time": map[string]any{
					"type":   "date",
					"format": "epoch_millis",
				},
				"updater": map[string]any{
					"type": "object",
				},
				"update_time": map[string]any{
					"type":   "date",
					"format": "epoch_millis",
				},

				// 对象类特有字段
				"data_source": map[string]any{
					"type": "object",
				},
				"data_properties": map[string]any{
					"type": "object",
				},
				"logic_properties": map[string]any{
					"type": "object",
				},
				"primary_keys": map[string]any{
					"type": "keyword",
				},
				"display_key": map[string]any{
					"type": "keyword",
				},

				// 关系类特有字段
				"source_object_type_id": map[string]any{
					"type": "keyword",
				},
				"target_object_type_id": map[string]any{
					"type": "keyword",
				},
				"type": map[string]any{
					"type": "keyword",
				},
				"mapping_rules": map[string]any{
					"type": "object",
				},

				// 行动类特有字段
				"action_type": map[string]any{
					"type": "keyword",
				},
				"object_type_id": map[string]any{
					"type": "keyword",
				},
				"condition": map[string]any{
					"type": "object",
				},
				"affect": map[string]any{
					"type": "object",
				},
				"action_source": map[string]any{
					"type": "object",
				},
				"parameters": map[string]any{
					"type": "object",
				},
				"schedule": map[string]any{
					"type": "object",
				},
			},
		},
	}
)

// 分页查询参数
type PaginationQueryParameters struct {
	Offset    int
	Limit     int
	Sort      string
	Direction string
}

func GenerateKNAuditObject(id string, name string) audit.AuditObject {
	return audit.AuditObject{
		Type: MODULE_TYPE_KN,
		ID:   id,
		Name: name,
	}
}

func GenerateObjectTypeAuditObject(id string, name string) audit.AuditObject {
	return audit.AuditObject{
		Type: MODULE_TYPE_OBJECT_TYPE,
		ID:   id,
		Name: name,
	}
}

func GenerateRelationTypeAuditObject(id string, name string) audit.AuditObject {
	return audit.AuditObject{
		Type: MODULE_TYPE_RELATION_TYPE,
		ID:   id,
		Name: name,
	}
}

func GenerateActionTypeAuditObject(id string, name string) audit.AuditObject {
	return audit.AuditObject{
		Type: MODULE_TYPE_ACTION_TYPE,
		ID:   id,
		Name: name,
	}
}

func GenerateJobAuditObject(id string, name string) audit.AuditObject {
	return audit.AuditObject{
		Type: MODULE_TYPE_JOB,
		ID:   id,
		Name: name,
	}
}

type ResourceInfo struct {
	Type string `json:"type" mapstructure:"type"`
	ID   string `json:"id" mapstructure:"id"`
	Name string `json:"name" mapstructure:"name"`
}

// 概念索引的id生成规则， kn_id + module_type + id + branch
func GenerateConceptDocuemtnID(knID string, moduleType string, id string, branch string) string {
	return fmt.Sprintf(KN_CONCEPT_DOCID_TEMPLATE, knID, moduleType, id, branch)
}

type CommonInfo struct {
	Tags    []string `json:"tags" mapstructure:"tags"`
	Comment string   `json:"comment" mapstructure:"comment"`
	Icon    string   `json:"icon" mapstructure:"icon"`
	Color   string   `json:"color" mapstructure:"color"`
	Detail  string   `json:"detail" mapstructure:"detail"`
}

type AccountInfo struct {
	ID   string `json:"id" mapstructure:"id"`
	Type string `json:"type" mapstructure:"type"`
	Name string `json:"name" mapstructure:"name"`
}
