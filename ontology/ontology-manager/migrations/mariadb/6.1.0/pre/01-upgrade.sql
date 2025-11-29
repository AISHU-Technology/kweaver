USE dip;


-- 任务管理
CREATE TABLE IF NOT EXISTS t_kn_job (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '任务id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '任务名称',
  f_kn_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '业务知识网络id',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_job_type VARCHAR(40) NOT NULL DEFAULT '' COMMENT '任务类型',
  f_job_concept_config MEDIUMTEXT DEFAULT NULL COMMENT '任务概念配置',
  f_state VARCHAR(40) NOT NULL DEFAULT '' COMMENT '状态',
  f_state_detail TEXT DEFAULT NULL COMMENT '状态详情',
  f_creator VARCHAR(40) NOT NULL DEFAULT '' COMMENT '创建者id',
  f_creator_type VARCHAR(20) NOT NULL DEFAULT '' COMMENT '创建者类型',
  f_create_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '创建时间',
  f_finish_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '完成时间',
  f_time_cost BIGINT(20) NOT NULL DEFAULT 0 COMMENT '耗时',
  PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '任务';


-- 子任务管理
CREATE TABLE IF NOT EXISTS t_kn_task (
  f_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '子任务id',
  f_name VARCHAR(40) NOT NULL DEFAULT '' COMMENT '子任务名称',
  f_job_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '任务id',
  f_concept_type VARCHAR(40) NOT NULL DEFAULT '' COMMENT '概念类型',
  f_concept_id VARCHAR(40) NOT NULL DEFAULT '' COMMENT '概念id',
  f_branch VARCHAR(40) NOT NULL DEFAULT '' COMMENT '分支',
  f_index VARCHAR(255) NOT NULL DEFAULT '' COMMENT '索引名称',
  f_state VARCHAR(40) NOT NULL DEFAULT '' COMMENT '状态',
  f_state_detail TEXT DEFAULT NULL COMMENT '状态详情',
  f_start_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '开始时间',
  f_finish_time BIGINT(20) NOT NULL DEFAULT 0 COMMENT '完成时间',
  f_time_cost BIGINT(20) NOT NULL DEFAULT 0 COMMENT '耗时',
  PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '子任务';

