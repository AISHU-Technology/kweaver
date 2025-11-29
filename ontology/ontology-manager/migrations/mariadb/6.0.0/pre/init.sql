USE dip;

-- 业务知识网络
CREATE TABLE IF NOT EXISTS t_knowledge_network (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络名称',
  f_tags VARCHAR(255) DEFAULT NULL COMMENT '标签',
  f_comment VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注',
  f_icon VARCHAR(255) NOT NULL DEFAULT '' COMMENT '图标',
  f_color VARCHAR(40) NOT NULL DEFAULT '' COMMENT '颜色',
  f_detail MEDIUMTEXT DEFAULT NULL COMMENT '概览',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_base_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '来源分支',
  f_creator VARCHAR(40) NOT NULL DEFAULT '' COMMENT '创建者id',
  f_create_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '创建时间',
  f_updater VARCHAR(40) NOT NULL DEFAULT '' COMMENT '更新者id',
  f_update_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (f_id,f_branch),
  UNIQUE KEY uk_kn_name (f_name,f_branch)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '业务知识网络';

-- 对象类
CREATE TABLE IF NOT EXISTS t_object_type (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '对象类id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '对象类名称',
  f_tags VARCHAR(255) DEFAULT NULL COMMENT '标签',
  f_comment VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注', 
  f_icon VARCHAR(255) NOT NULL DEFAULT '' COMMENT '图标',
  f_color VARCHAR(40) NOT NULL DEFAULT '' COMMENT '颜色',
  f_detail MEDIUMTEXT DEFAULT NULL COMMENT '概览',
  f_kn_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络id',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_data_source VARCHAR(255) NOT NULL COMMENT '数据来源，当前只有视图',
  f_data_properties LONGTEXT DEFAULT NULL COMMENT '数据属性',
  f_logic_properties MEDIUMTEXT DEFAULT NULL COMMENT '逻辑属性',
  f_primary_keys VARCHAR(8192) DEFAULT NULL COMMENT '对象类主键',
  f_display_key VARCHAR(40) NOT NULL DEFAULT '' COMMENT '对象实例的显示属性',
  f_creator VARCHAR(40) NOT NULL DEFAULT '' COMMENT '创建者id',
  f_create_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '创建时间',
  f_updater VARCHAR(40) NOT NULL DEFAULT '' COMMENT '更新者id',
  f_update_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (f_kn_id,f_branch,f_id),
  UNIQUE KEY uk_object_type_name (f_kn_id,f_branch,f_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '对象类';

-- 关系类
CREATE TABLE IF NOT EXISTS t_relation_type (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '关系类id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '关系类名称',
  f_tags VARCHAR(255) DEFAULT NULL COMMENT '标签',
  f_comment VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注', 
  f_icon VARCHAR(255) NOT NULL DEFAULT '' COMMENT '图标',
  f_color VARCHAR(40) NOT NULL DEFAULT '' COMMENT '颜色',
  f_detail MEDIUMTEXT DEFAULT NULL COMMENT '概览',
  f_kn_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络id',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_source_object_type_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '起点对象类',
  f_target_object_type_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '终点对象类',
  f_type VARCHAR(40) NOT NULL DEFAULT '' COMMENT '关联类型',
  f_mapping_rules TEXT DEFAULT NULL COMMENT '关联规则',
  f_creator VARCHAR(40) NOT NULL DEFAULT '' COMMENT '创建者id',
  f_create_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '创建时间',
  f_updater VARCHAR(40) NOT NULL DEFAULT '' COMMENT '更新者id',
  f_update_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (f_kn_id,f_branch,f_id),
  UNIQUE KEY uk_relation_type_name (f_kn_id,f_branch,f_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '关系类';

-- 行动类
CREATE TABLE IF NOT EXISTS t_action_type (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '行动类id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '行动类名称',
  f_tags VARCHAR(255) DEFAULT NULL COMMENT '标签',
  f_comment VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注', 
  f_icon VARCHAR(255) NOT NULL DEFAULT '' COMMENT '图标',
  f_color VARCHAR(40) NOT NULL DEFAULT '' COMMENT '颜色',
  f_detail MEDIUMTEXT DEFAULT NULL COMMENT '概览',
  f_kn_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络id',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_action_type VARCHAR(40) NOT NULL DEFAULT '' COMMENT '行动类型',
  f_object_type_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '对象类',
  f_condition TEXT DEFAULT NULL COMMENT '行动条件',
  f_affect TEXT DEFAULT NULL COMMENT '行动影响',
  f_action_source VARCHAR(255) NOT NULL COMMENT '行动资源',
  f_parameters TEXT DEFAULT NULL COMMENT '行动参数',
  f_schedule VARCHAR(255) DEFAULT NULL COMMENT '行动监听',
  f_creator VARCHAR(40) NOT NULL DEFAULT '' COMMENT '创建者id',
  f_create_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '创建时间',
  f_updater VARCHAR(40) NOT NULL DEFAULT '' COMMENT '更新者id',
  f_update_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (f_kn_id,f_branch,f_id),
  UNIQUE KEY uk_action_type_name (f_kn_id,f_branch,f_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '行动类';

