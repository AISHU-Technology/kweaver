
-- 导出 kweaver 的数据库结构
CREATE DATABASE IF NOT EXISTS `kweaver`;
USE `kweaver`;

-- 导出  表 kweaver.async_tasks 结构
CREATE TABLE IF NOT EXISTS `async_tasks` (
                                           `id` int NOT NULL AUTO_INCREMENT,
                                           `task_type` varchar(100)  DEFAULT NULL,
  `task_status` varchar(50)  DEFAULT NULL,
  `task_name` varchar(200)  DEFAULT NULL,
  `celery_task_id` varchar(200)  DEFAULT NULL,
  `relation_id` varchar(200)  DEFAULT NULL,
  `task_params` text ,
  `result` longtext ,
  `created_time` datetime DEFAULT NULL,
  `finished_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_async_tasks_celery_task_id` (`celery_task_id`),
  KEY `idx_async_tasks_relation_id` (`relation_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.canvas 结构
CREATE TABLE IF NOT EXISTS `canvas` (
                                      `id` bigint NOT NULL AUTO_INCREMENT,
                                      `knw_id` bigint NOT NULL COMMENT '知识网络id',
                                      `kg_id` bigint NOT NULL COMMENT '图谱id',
                                      `canvas_name` varchar(256)  NOT NULL COMMENT '画布名称',
  `canvas_info` text  COMMENT '画布信息',
  `canvas_body` longtext  NOT NULL COMMENT '画布内容',
  `create_user` varchar(50)  NOT NULL COMMENT '创建者',
  `create_time` varchar(50)  NOT NULL COMMENT '创建时间',
  `update_user` varchar(50)  NOT NULL COMMENT '编辑者',
  `update_time` varchar(50)  NOT NULL COMMENT '编辑时间',
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='画布表';

-- 导出  表 kweaver.data_source_table 结构
CREATE TABLE IF NOT EXISTS `data_source_table` (
                                                 `id` int NOT NULL AUTO_INCREMENT,
                                                 `create_user` varchar(50)  DEFAULT NULL,
  `create_time` varchar(50)  DEFAULT NULL,
  `update_user` varchar(50)  DEFAULT NULL,
  `update_time` varchar(50)  DEFAULT NULL,
  `dsname` varchar(50)  DEFAULT NULL,
  `dataType` varchar(20)  DEFAULT NULL,
  `data_source` varchar(20)  DEFAULT NULL,
  `ds_user` varchar(30)  DEFAULT NULL,
  `ds_password` varchar(500)  DEFAULT NULL,
  `ds_address` varchar(256)  DEFAULT NULL,
  `ds_port` int DEFAULT NULL,
  `ds_path` longtext ,
  `extract_type` varchar(20)  DEFAULT NULL,
  `ds_auth` varchar(50)  DEFAULT NULL,
  `vhost` varchar(50)  DEFAULT NULL,
  `queue` varchar(50)  DEFAULT NULL,
  `json_schema` longtext ,
  `knw_id` int DEFAULT NULL,
  `connect_type` varchar(20)  NOT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.function 结构
CREATE TABLE IF NOT EXISTS `function` (
                                        `id` int NOT NULL AUTO_INCREMENT,
                                        `name` varchar(100)  NOT NULL,
  `code` mediumtext ,
  `description` varchar(255)  DEFAULT NULL,
  `parameters` mediumtext ,
  `language` varchar(100)  DEFAULT NULL,
  `create_user` varchar(100)  DEFAULT NULL,
  `create_time` varchar(100)  DEFAULT NULL,
  `update_user` varchar(100)  DEFAULT NULL,
  `update_time` varchar(100)  DEFAULT NULL,
  `knowledge_network_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.graph_config_table 结构
CREATE TABLE IF NOT EXISTS `graph_config_table` (
                                                  `id` int NOT NULL AUTO_INCREMENT,
                                                  `create_user` varchar(100)  DEFAULT NULL,
  `create_time` varchar(100)  DEFAULT NULL,
  `update_user` varchar(100)  DEFAULT NULL,
  `update_time` varchar(100)  DEFAULT NULL,
  `graph_name` varchar(100)  DEFAULT NULL,
  `graph_baseInfo` longtext ,
  `graph_ds` longtext ,
  `graph_otl` longtext ,
  `graph_KMap` longtext ,
  `rabbitmq_ds` int NOT NULL DEFAULT '0',
  `step_num` int DEFAULT '1',
  `is_upload` tinyint(1) DEFAULT '0',
  `KDB_name` varchar(250)  DEFAULT NULL,
  `KDB_name_temp` varchar(250)  DEFAULT NULL,
  `kg_data_volume` int NOT NULL DEFAULT '0',
  `status` varchar(100)  DEFAULT NULL,
  `graph_update_time` varchar(100)  DEFAULT NULL,
  `knw_id` int NOT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.graph_task_history_table 结构
CREATE TABLE IF NOT EXISTS `graph_task_history_table` (
                                                        `id` int NOT NULL AUTO_INCREMENT,
                                                        `graph_id` int DEFAULT NULL,
                                                        `graph_name` varchar(50)  DEFAULT NULL,
  `task_id` varchar(200)  DEFAULT NULL,
  `task_status` varchar(50)  DEFAULT NULL,
  `create_user` varchar(100)  DEFAULT NULL,
  `start_time` varchar(100)  DEFAULT NULL,
  `end_time` varchar(100)  DEFAULT NULL,
  `entity_num` int DEFAULT NULL,
  `edge_num` int DEFAULT NULL,
  `graph_entity` int DEFAULT NULL,
  `graph_edge` int DEFAULT NULL,
  `error_report` longtext ,
  `entity_pro_num` int DEFAULT NULL,
  `edge_pro_num` int DEFAULT NULL,
  `trigger_type` int NOT NULL DEFAULT '0',
  `task_type` varchar(50)  DEFAULT NULL,
  `count_status` tinyint(1) DEFAULT '0',
  `subgraph_id` int DEFAULT '0',
  `task_name` varchar(50)  DEFAULT NULL,
  `entity` longtext ,
  `edge` longtext ,
  `parent` varchar(200)  DEFAULT NULL,
  `files` longtext ,
  `extract_type` varchar(50)  DEFAULT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.graph_task_table 结构
CREATE TABLE IF NOT EXISTS `graph_task_table` (
                                                `id` int NOT NULL AUTO_INCREMENT,
                                                `graph_id` int DEFAULT NULL,
                                                `graph_name` varchar(50)  DEFAULT NULL,
  `create_user` varchar(100)  DEFAULT NULL,
  `create_time` varchar(100)  DEFAULT NULL,
  `task_status` varchar(50)  DEFAULT NULL,
  `task_id` varchar(200)  DEFAULT NULL,
  `error_report` longtext ,
  `trigger_type` int NOT NULL DEFAULT '0',
  `task_type` varchar(50)  DEFAULT NULL,
  `subgraph_ids` varchar(100)  DEFAULT '[0]',
  `current_subgraph_id` int DEFAULT '-1',
  `failed_subgraph_ids` longtext ,
  `stop_subgraph_ids` longtext ,
  `write_mode` varchar(50)  DEFAULT 'skip',
  `successful_subgraph` longtext ,
  `timestamp` text ,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.intelligence_records 结构
CREATE TABLE IF NOT EXISTS `intelligence_records` (
                                                    `id` int NOT NULL AUTO_INCREMENT,
                                                    `resource_id` int DEFAULT NULL,
                                                    `knw_id` int DEFAULT NULL,
                                                    `entity_knowledge` int DEFAULT NULL,
                                                    `edge_knowledge` int DEFAULT NULL,
                                                    `data_number` int DEFAULT NULL,
                                                    `total_knowledge` int DEFAULT NULL,
                                                    `empty_number` int DEFAULT '0',
                                                    `repeat_number` int DEFAULT '0',
                                                    `entity_number` int DEFAULT '0',
                                                    `edge_number` int DEFAULT '0',
                                                    `data_quality_score` decimal(10,2) NOT NULL DEFAULT '-1.00',
  `update_time` datetime DEFAULT NULL,
  `type` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_intelligence_records_knw_id` (`knw_id`),
  KEY `idx_intelligence_records_resource_id` (`resource_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.knowledge_network 结构
CREATE TABLE IF NOT EXISTS `knowledge_network` (
                                                 `id` int NOT NULL AUTO_INCREMENT,
                                                 `knw_name` varchar(50)  DEFAULT NULL,
  `knw_description` varchar(200)  DEFAULT NULL,
  `intelligence_score` decimal(10,2) NOT NULL DEFAULT '-1.00',
  `color` varchar(50)  DEFAULT NULL,
  `creator_id` varchar(50)  DEFAULT NULL,
  `final_operator` varchar(50)  DEFAULT NULL,
  `creation_time` varchar(50)  DEFAULT NULL,
  `update_time` varchar(50)  DEFAULT NULL,
  `identify_id` varchar(128)  DEFAULT NULL,
  `to_be_uploaded` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.lexicon 结构
CREATE TABLE IF NOT EXISTS `lexicon` (
                                       `id` int NOT NULL AUTO_INCREMENT,
                                       `lexicon_name` varchar(50)  DEFAULT NULL,
  `description` varchar(256)  DEFAULT NULL,
  `columns` longtext ,
  `mode` varchar(50)  NOT NULL,
  `extract_info` longtext  NOT NULL,
  `knowledge_id` int DEFAULT NULL,
  `create_user` varchar(50)  DEFAULT NULL,
  `operate_user` varchar(50)  DEFAULT NULL,
  `create_time` varchar(50)  DEFAULT NULL,
  `update_time` varchar(50)  DEFAULT NULL,
  `status` varchar(50)  DEFAULT NULL,
  `error_info` longtext ,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lexicon_name_kwn_id` (`lexicon_name`,`knowledge_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.ontology_table 结构
CREATE TABLE IF NOT EXISTS `ontology_table` (
                                              `id` int NOT NULL AUTO_INCREMENT,
                                              `create_user` varchar(50)  DEFAULT NULL,
  `create_time` varchar(50)  DEFAULT NULL,
  `update_user` varchar(50)  DEFAULT NULL,
  `update_time` varchar(50)  DEFAULT NULL,
  `ontology_name` varchar(50)  DEFAULT NULL,
  `ontology_des` varchar(150)  DEFAULT NULL,
  `otl_status` varchar(50)  DEFAULT NULL,
  `entity` longtext ,
  `edge` longtext ,
  `used_task` longtext ,
  `all_task` longtext ,
  `identify_id` varchar(50)  DEFAULT NULL,
  `knw_id` int DEFAULT NULL,
  `domain` varchar(550)  DEFAULT NULL,
  `otl_temp` longtext ,
  `canvas` longtext ,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.ontology_task_table 结构
CREATE TABLE IF NOT EXISTS `ontology_task_table` (
                                                   `task_id` int NOT NULL AUTO_INCREMENT,
                                                   `ontology_id` varchar(50)  DEFAULT NULL,
  `create_user` varchar(100)  DEFAULT NULL,
  `task_name` longtext ,
  `task_type` varchar(50)  DEFAULT NULL,
  `create_time` varchar(100)  DEFAULT NULL,
  `finished_time` varchar(100)  DEFAULT NULL,
  `task_status` varchar(500)  DEFAULT NULL,
  `celery_task_id` varchar(100)  DEFAULT NULL,
  `result` longtext ,
  `file_list` longtext ,
  `ds_id` varchar(50)  DEFAULT NULL,
  `postfix` varchar(50)  DEFAULT NULL,
  PRIMARY KEY (`task_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.search_config 结构
CREATE TABLE IF NOT EXISTS `search_config` (
                                             `id` bigint NOT NULL AUTO_INCREMENT,
                                             `conf_name` varchar(255)  DEFAULT NULL,
  `type` varchar(255)  DEFAULT NULL,
  `conf_desc` varchar(255)  DEFAULT NULL,
  `kg_id` int DEFAULT NULL,
  `kg_name` varchar(255)  DEFAULT NULL,
  `conf_content` longtext ,
  `db_2_doc` longtext ,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `create_user` varchar(255)  DEFAULT NULL,
  `update_user` varchar(255)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_idx_search_config_conf_name` (`conf_name`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识网络搜索策略表';

-- 导出  表 kweaver.subgraph_config 结构
CREATE TABLE IF NOT EXISTS `subgraph_config` (
                                               `id` int NOT NULL AUTO_INCREMENT,
                                               `ontology_id` int NOT NULL,
                                               `graph_id` int NOT NULL,
                                               `name` varchar(50)  NOT NULL,
  `entity` longtext ,
  `edge` longtext ,
  `create_time` varchar(50)  DEFAULT NULL,
  `update_time` varchar(50)  DEFAULT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.taxonomy 结构
CREATE TABLE IF NOT EXISTS `taxonomy` (
                                        `id` int NOT NULL AUTO_INCREMENT,
                                        `create_user` varchar(100)  DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_user` varchar(100)  DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(100)  DEFAULT NULL,
  `default_language` varchar(10)  DEFAULT NULL,
  `description` varchar(300)  DEFAULT NULL,
  `db_name` varchar(50)  DEFAULT NULL,
  `knw_id` int DEFAULT NULL,
  `word_num` int DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`,`knw_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.taxonomy_custom_relation 结构
CREATE TABLE IF NOT EXISTS `taxonomy_custom_relation` (
                                                        `id` int NOT NULL AUTO_INCREMENT,
                                                        `create_user` varchar(100)  DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_user` varchar(100)  DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(100)  DEFAULT NULL,
  `taxonomy_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`,`taxonomy_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.timer_crontab 结构
CREATE TABLE IF NOT EXISTS `timer_crontab` (
                                             `id` int NOT NULL AUTO_INCREMENT,
                                             `minute` varchar(240)  DEFAULT NULL,
  `hour` varchar(96)  DEFAULT NULL,
  `day_of_week` varchar(64)  DEFAULT NULL,
  `day_of_month` varchar(124)  DEFAULT NULL,
  `month_of_year` varchar(64)  DEFAULT NULL,
  `timezone` varchar(64)  DEFAULT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.timer_task 结构
CREATE TABLE IF NOT EXISTS `timer_task` (
                                          `id` int NOT NULL AUTO_INCREMENT,
                                          `task_id` varchar(255)  DEFAULT NULL,
  `modify_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `create_user` varchar(100)  DEFAULT NULL,
  `update_user` varchar(100)  DEFAULT NULL,
  `graph_id` int DEFAULT NULL,
  `task_type` varchar(20)  DEFAULT NULL,
  `cycle` varchar(20)  DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `one_off` tinyint(1) DEFAULT NULL,
  `total_run_count` int NOT NULL DEFAULT '0',
  `task` varchar(255)  DEFAULT NULL,
  `crontab_id` int DEFAULT NULL,
  `args` text ,
  `kwargs` text ,
  `date_time` varchar(20)  DEFAULT NULL,
  `date_list` varchar(200)  DEFAULT NULL,
  `queue` varchar(255)  DEFAULT NULL,
  `f_exchange` varchar(255)  DEFAULT NULL,
  `routing_key` varchar(255)  DEFAULT NULL,
  `priority` int DEFAULT NULL,
  `expires` datetime DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `date_changed` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_id` (`task_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.timer_update 结构
CREATE TABLE IF NOT EXISTS `timer_update` (
                                            `id` int NOT NULL AUTO_INCREMENT,
                                            `last_update` datetime NOT NULL,
                                            PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_dict 结构
CREATE TABLE IF NOT EXISTS `t_dict` (
                                      `f_id` bigint NOT NULL,
                                      `f_c_name` varchar(100)  NOT NULL,
  `f_e_name` varchar(150)  NOT NULL,
  `f_remark` varchar(255)  NOT NULL DEFAULT '',
  `f_dict_type` varchar(50)  NOT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_update_by` varchar(50)  NOT NULL,
  `f_create_time` datetime NOT NULL,
  `f_update_time` datetime NOT NULL,
  `f_del_flag` smallint DEFAULT NULL,
  PRIMARY KEY (`f_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_dict_item 结构
CREATE TABLE IF NOT EXISTS `t_dict_item` (
                                           `f_id` bigint NOT NULL,
                                           `f_c_name` varchar(100)  NOT NULL,
  `f_e_name` varchar(150)  NOT NULL,
  `f_remark` varchar(255)  NOT NULL DEFAULT '',
  `f_dict_id` bigint NOT NULL,
  `f_item_value` varchar(100)  NOT NULL DEFAULT '',
  `f_create_by` varchar(50)  NOT NULL,
  `f_update_by` varchar(50)  NOT NULL,
  `f_create_time` datetime NOT NULL,
  `f_update_time` datetime NOT NULL,
  `f_del_flag` smallint DEFAULT NULL,
  PRIMARY KEY (`f_id`),
  KEY `idx_dict_item_dict_id` (`f_dict_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_event_log 结构
CREATE TABLE IF NOT EXISTS `t_event_log` (
                                           `f_id` bigint NOT NULL,
                                           `f_mod_type` smallint NOT NULL,
                                           `f_title` varchar(50)  NOT NULL,
  `f_path` varchar(150)  NOT NULL,
  `f_type` smallint NOT NULL DEFAULT '1',
  `f_method` varchar(10)  DEFAULT NULL,
  `f_remark` varchar(255)  DEFAULT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime NOT NULL,
  PRIMARY KEY (`f_id`),
  KEY `idx_event_mod_type` (`f_mod_type`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_event_log_hist 结构
CREATE TABLE IF NOT EXISTS `t_event_log_hist` (
                                                `f_id` bigint NOT NULL,
                                                `f_mod_type` smallint NOT NULL,
                                                `f_title` varchar(50)  NOT NULL,
  `f_path` varchar(150)  NOT NULL,
  `f_remark` varchar(255)  DEFAULT NULL,
  `f_type` smallint NOT NULL DEFAULT '1',
  `f_method` varchar(10)  DEFAULT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime NOT NULL,
  PRIMARY KEY (`f_id`),
  KEY `idx_event_hist_mod_type` (`f_mod_type`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_menu 结构
CREATE TABLE IF NOT EXISTS `t_menu` (
                                      `f_id` bigint NOT NULL,
                                      `f_c_name` varchar(128)  NOT NULL,
  `f_e_name` varchar(128)  NOT NULL,
  `f_code` varchar(255)  NOT NULL,
  `f_icon` varchar(128)  DEFAULT NULL,
  `f_selected_icon` varchar(128)  DEFAULT NULL,
  `f_path` varchar(128)  DEFAULT NULL,
  `f_component` varchar(255)  DEFAULT NULL,
  `f_menu_type` smallint NOT NULL,
  `f_pid` bigint NOT NULL DEFAULT '0',
  `f_sort_order` smallint NOT NULL DEFAULT '0',
  `f_visible` smallint NOT NULL DEFAULT '0',
  `f_create_time` datetime NOT NULL,
  `f_update_time` datetime NOT NULL,
  `f_del_flag` smallint DEFAULT '0',
  UNIQUE KEY `uk_menu_code` (`f_code`),
  KEY `idx_menu_pid` (`f_pid`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_model_default_para_list 结构
CREATE TABLE IF NOT EXISTS `t_model_default_para_list` (
  `f_model` varchar(50)  NOT NULL,
  `f_model_default_para` varchar(500)  NOT NULL,
  PRIMARY KEY (`f_model`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_model_list 结构
CREATE TABLE IF NOT EXISTS `t_model_list` (
  `f_model_id` varchar(50)  NOT NULL,
  `f_model_series` varchar(50)  NOT NULL,
  `f_model_type` varchar(50)  NOT NULL,
  `f_model_name` varchar(100)  NOT NULL,
  `f_model` varchar(50)  NOT NULL,
  `f_model_api` varchar(50)  DEFAULT NULL,
  `f_model_url` varchar(150)  DEFAULT NULL,
  `f_model_config` varchar(150)  NOT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime(6) DEFAULT NULL,
  `f_update_by` varchar(50)  DEFAULT NULL,
  `f_update_time` datetime(6) DEFAULT NULL,
  `f_is_delete` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`f_model_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_model_param 结构
CREATE TABLE IF NOT EXISTS `t_model_param` (
  `f_param_id` varchar(50)  NOT NULL,
  `f_param_field` varchar(50)  NOT NULL,
  `f_param_type` varchar(50)  NOT NULL,
  `f_box_component` varchar(50)  NOT NULL,
  `f_box_lab_cn` varchar(50)  NOT NULL,
  `f_box_lab_us` varchar(50)  NOT NULL,
  `f_box_mark_cn` varchar(50)  NOT NULL,
  `f_box_mark_us` varchar(50)  NOT NULL,
  `f_req` tinyint(1) NOT NULL DEFAULT '1',
  `f_req_mes_cn` varchar(50)  NOT NULL,
  `f_req_mes_us` varchar(50)  NOT NULL,
  `f_max` int NOT NULL,
  `f_max_mes_cn` varchar(50)  NOT NULL,
  `f_max_mes_us` varchar(50)  NOT NULL,
  `f_pattern` varchar(300)  NOT NULL,
  `f_pat_mes_cn` varchar(150)  NOT NULL,
  `f_pat_mes_us` varchar(150)  NOT NULL,
  PRIMARY KEY (`f_param_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_model_series 结构
CREATE TABLE IF NOT EXISTS `t_model_series` (
  `f_model_series_id` varchar(50)  NOT NULL,
  `f_model_series_name_cn` varchar(50)  NOT NULL,
  `f_model_series_name_us` varchar(50)  NOT NULL,
  `f_model_series_desc_cn` varchar(150)  DEFAULT NULL,
  `f_model_series_desc_us` varchar(150)  DEFAULT NULL,
  `f_model_icon` varchar(8000)  NOT NULL,
  `f_model_param_id` varchar(200)  NOT NULL,
  PRIMARY KEY (`f_model_series_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_prompt_item_list 结构
CREATE TABLE IF NOT EXISTS `t_prompt_item_list` (
  `f_id` varchar(50)  NOT NULL,
  `f_prompt_item_id` varchar(50)  NOT NULL,
  `f_prompt_item_name` varchar(50)  NOT NULL,
  `f_prompt_item_type_id` varchar(50)  DEFAULT NULL,
  `f_prompt_item_type` varchar(50)  DEFAULT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime(6) DEFAULT NULL,
  `f_update_by` varchar(50)  DEFAULT NULL,
  `f_update_time` datetime(6) DEFAULT NULL,
  `f_item_is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `f_type_is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `f_is_management` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`f_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_prompt_list 结构
CREATE TABLE IF NOT EXISTS `t_prompt_list` (
  `f_prompt_id` varchar(50)  NOT NULL,
  `f_prompt_item_id` varchar(50)  NOT NULL,
  `f_prompt_item_type_id` varchar(50)  NOT NULL,
  `f_prompt_service_id` varchar(50)  NOT NULL,
  `f_prompt_type` varchar(50)  NOT NULL,
  `f_prompt_name` varchar(50)  NOT NULL,
  `f_prompt_desc` varchar(255)  DEFAULT NULL,
  `f_messages` varchar(5000)  NOT NULL,
  `f_variables` varchar(1000)  DEFAULT NULL,
  `f_icon` varchar(50)  NOT NULL,
  `f_model_id` varchar(50)  NOT NULL,
  `f_model_para` varchar(150)  NOT NULL,
  `f_opening_remarks` varchar(150)  DEFAULT NULL,
  `f_is_deploy` tinyint(1) NOT NULL DEFAULT '0',
  `f_prompt_deploy_url` varchar(150)  DEFAULT NULL,
  `f_prompt_deploy_api` varchar(150)  DEFAULT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime(6) DEFAULT NULL,
  `f_update_by` varchar(50)  DEFAULT NULL,
  `f_update_time` datetime(6) DEFAULT NULL,
  `f_is_delete` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`f_prompt_id`),
  UNIQUE KEY `uk_f_prompt_service_id` (`f_prompt_service_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 导出  表 kweaver.t_prompt_template_list 结构
CREATE TABLE IF NOT EXISTS `t_prompt_template_list` (
  `f_prompt_id` varchar(50)  NOT NULL,
  `f_prompt_type` varchar(50)  NOT NULL,
  `f_prompt_name` varchar(50)  NOT NULL,
  `f_prompt_desc` varchar(255)  DEFAULT NULL,
  `f_messages` varchar(5000)  NOT NULL,
  `f_variables` varchar(1000)  DEFAULT NULL,
  `f_icon` varchar(50)  NOT NULL,
  `f_opening_remarks` varchar(150)  DEFAULT NULL,
  `f_input` varchar(1000)  DEFAULT NULL,
  `f_create_by` varchar(50)  NOT NULL,
  `f_create_time` datetime(6) DEFAULT NULL,
  `f_update_by` varchar(50)  DEFAULT NULL,
  `f_update_time` datetime(6) DEFAULT NULL,
  `f_is_delete` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`f_prompt_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `t_menu` (`f_id`, `f_c_name`, `f_e_name`, `f_code`, `f_icon`, `f_selected_icon`, `f_path`, `f_component`, `f_menu_type`, `f_pid`, `f_sort_order`, `f_visible`, `f_create_time`, `f_update_time`, `f_del_flag`) VALUES
                                                                                                                                                                                                                             (534, '创建字典', 'Add Dictionary', 'adf-dict-add', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (538, '删除字典', 'Delete Dictionary', 'adf-dict-delete', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (536, '修改字典', 'Update Dictionary', 'adf-dict-update', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (540, '创建字典值', 'Add Dictionary Item', 'adf-dictItem-add', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (544, '删除字典值', 'Delete Dictionary Item', 'adf-dictItem-delete', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (542, '修改字典值', 'Update Dictionary Item', 'adf-dictItem-update', '', '', '', '', 2, 533, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (1, '知识网络', 'Knowledge Networks', 'adf-kn', '', '', '/knowledge', '', 1, 0, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (165, '本体库', 'Ontology Library', 'adf-kn-concept-ontology', 'icon-color-bentiku1', 'icon-color-bentiku2', '/knowledge/studio-concept-ontolib', '', 1, 19, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (170, '新建本体', 'Create Ontology', 'adf-kn-concept-ontology-create', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (176, '删除本体', 'Delete Ontology', 'adf-kn-concept-ontology-delete', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (174, '导出本体', 'Export Ontology', 'adf-kn-concept-ontology-export', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (181, '本体库权限管理', 'Ontology Library Permissions', 'adf-kn-concept-ontology-member', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (178, '编辑本体', 'Update Ontology', 'adf-kn-concept-ontology-update', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (166, '查看本体', 'View Ontology', 'adf-kn-concept-ontology-view', '', '', '', '', 2, 165, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (8, '新建知识网络', 'Create Knowledge Networks', 'adf-kn-create', '', '', '', '', 2, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (253, '领域数据', 'Domain Data', 'adf-kn-data', '', '', '/knowledge/studio-domainData', '', 1, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (286, '数据库查询', 'Database Query', 'adf-kn-db', 'icon-color-lingyushuju1', 'icon-color-lingyushuju2', '/knowledge/studio-domainData-query', '', 1, 253, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (287, '查看数据库', 'View Database', 'adf-kn-db-view', '', '', '', '', 2, 286, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (13, '删除知识网络', 'Delete Knowledge Networks', 'adf-kn-delete', '', '', '', '', 2, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (19, '领域知识', 'Domain Knowledge', 'adf-kn-domainKnowledge', '', '', '/knowledge/domain-knowledge', '', 1, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (254, '数据源管理', 'Data Source Management', 'adf-kn-ds', 'icon-color-shujuyuanguanli1', 'icon-color-shujuyuanguanli2', '/knowledge/studio-domainData-source', '', 1, 253, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (272, '新建数据源', 'Create Data Source', 'adf-kn-ds-create', '', '', '', '', 2, 254, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (279, '删除数据源', 'Delete Data Source', 'adf-kn-ds-delete', '', '', '', '', 2, 254, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (276, '编辑数据源', 'Edit Data Source', 'adf-kn-ds-edit', '', '', '', '', 2, 254, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (282, '数据源权限管理', 'Data Source Permissions', 'adf-kn-ds-member', '', '', '', '', 2, 254, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (255, '查看数据源', 'View Data Source', 'adf-kn-ds-view', '', '', '', '', 2, 254, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (11, '编辑知识网络', 'Edit Knowledge Networks', 'adf-kn-edit', '', '', '', '', 2, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (20, '知识图谱', 'Knowledge Graph', 'adf-kn-kg', 'icon-color-zhishitupu1', 'icon-color-zhishitupu2', '/knowledge/studio-network', '', 1, 19, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (67, '新建知识图谱', 'Create Knowledge Graphs', 'adf-kn-kg-create', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (103, '删除知识图谱', 'Delete Knowledge Graphs', 'adf-kn-kg-delete', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (75, '编辑知识图谱', 'Edit Knowledge Graphs', 'adf-kn-kg-edit', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (72, '导出知识图谱', 'Export Knowledge Graphs', 'adf-kn-kg-export', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (105, '知识图谱权限管理', 'Knowledge Graphs Permissions', 'adf-kn-kg-member', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (21, '查看知识图谱', 'View Knowledge Graphs', 'adf-kn-kg-view', '', '', '', '', 2, 20, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (214, '词库', 'Lexicon', 'adf-kn-lexicon', 'icon-color-ciku1', 'icon-color-ciku2', '/knowledge/studio-concept-thesaurus', '', 1, 19, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (218, '新建词库', 'Create Word Library', 'adf-kn-lexicon-create', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (232, '删除词库', 'Delete Word Library', 'adf-kn-lexicon-delete', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (226, '编辑词库', 'Edit Word Library', 'adf-kn-lexicon-edit', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (224, '导出词库', 'Export Word Library', 'adf-kn-lexicon-export', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (234, '词库权限管理', 'Word Library Permissions', 'adf-kn-lexicon-member', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (215, '查看词库', 'View Word Library', 'adf-kn-lexicon-view', '', '', '', '', 2, 214, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (15, '知识网络权限管理', 'Knowledge Networks Permissions', 'adf-kn-member', '', '', '', '', 2, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (185, '术语库', 'Taxonomy Library', 'adf-kn-taxonomy', 'icon-color-shuyuku1', 'icon-color-shuyuku2', '/knowledge/studio-concept-glossary', '', 1, 19, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (194, '新建术语库', 'Create Taxonomy', 'adf-kn-taxonomy-create', '', '', '', '', 2, 185, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (204, '删除术语库', 'Delete Taxonomy', 'adf-kn-taxonomy-delete', '', '', '', '', 2, 185, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (200, '编辑术语库', 'Edit Taxonomy', 'adf-kn-taxonomy-edit', '', '', '', '', 2, 185, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (210, '术语库权限管理', 'Taxonomy Permissions', 'adf-kn-taxonomy-member', '', '', '', '', 2, 185, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (186, '查看术语库', 'View Taxonomy', 'adf-kn-taxonomy-view', '', '', '', '', 2, 185, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (2, '查看知识网络', 'View Knowledge Networks', 'adf-kn-view', '', '', '', '', 2, 1, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (298, '大语言模型', 'LLM', 'adf-llm-model', 'icon-color-damoxingjieru1', 'icon-color-damoxingjieru2', '/model-factory/llm-model', '', 1, 297, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (304, '新增大语言模型', 'Add Large Language Model', 'adf-llm-model-add', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (310, '删除大语言模型', 'Delete Large Language Model', 'adf-llm-model-delete', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (308, '编辑大语言模型', 'Edit Large Language Model', 'adf-llm-model-edit', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (312, '大语言模型权限管理', 'Large Language Model Permissions', 'adf-llm-model-member', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (306, '测试大语言模型', 'Test Large Language Model', 'adf-llm-model-test', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (299, '查看大语言模型', 'View Large Language Model', 'adf-llm-model-view', '', '', '', '', 2, 298, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (514, '资源管理', 'Resource Management', 'adf-management', '', '', '/admin/management', '', 1, 0, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (533, '字典管理', 'Dictionary Management', 'adf-management-dict', 'icon-color-zidianguanli1', 'icon-color-zidianguanli2', '/admin/management-dict', '', 1, 514, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (515, '菜单管理', 'Menu Management', 'adf-management-menu', 'icon-color-caidanguanli1', 'icon-color-caidanguanli2', '/admin/management-menu', '', 1, 514, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (518, '创建菜单', 'Add Menu', 'adf-menu-add', '', '', '', '', 2, 515, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (522, '删除菜单', 'Delete Menu', 'adf-menu-delete', '', '', '', '', 2, 515, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (520, '修改菜单', 'Update Menu', 'adf-menu-update', '', '', '', '', 2, 515, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (516, '查看菜单', 'View Menu', 'adf-menu-view', '', '', '', '', 2, 515, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (294, '发现', 'Discovery', 'adf-model-creation', '', '', '/model-factory/creation', '', 1, 293, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (293, '模型工厂', 'Model Factory', 'adf-model-factory', '', '', '/model-factory', '', 1, 0, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (297, '部署', 'Deployment', 'adf-model-management', '', '', '/model-factory/model', '', 1, 293, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (295, '模型应用', 'Model Apps', 'adf-prompt', 'icon-color-tishicigongcheng1', 'icon-color-tishicigongcheng2', '/model-factory/prompt-home', '', 1, 294, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0),
                                                                                                                                                                                                                             (296, '提示词模板', 'Prompt Template', 'adf-prompt-management', 'icon-color-tishiciguanli1', 'icon-color-tishiciguanli2', '/model-factory/prompt-manage', '', 1, 294, 0, 0, '2024-01-26 19:56:17', '2024-01-26 19:56:17', 0);

insert into t_model_default_para_list(f_model, f_model_default_para)
select 'baichuan2', '{"temperature": [0, 2, 1], "top_p": [0, 1, 1], "presence_penalty": [-2, 2, 0], "frequency_penalty": [-2, 2, 0], "max_tokens": [10, 4096, 1000]}' from DUAL  where not exists(select f_model from t_model_default_para_list where f_model = 'baichuan2') ;

insert into t_model_default_para_list(f_model, f_model_default_para)
select 'gpt-35-turbo-16k', '{"temperature": [0, 2, 1], "top_p": [0, 1, 1], "presence_penalty": [-2, 2, 0], "frequency_penalty": [-2, 2, 0], "max_tokens": [10, 16384, 10000]}' from DUAL  where not exists(select f_model from t_model_default_para_list where f_model = 'gpt-35-turbo-16k') ;

insert into t_model_default_para_list(f_model, f_model_default_para)
select 'text-davinci-002', '{"temperature": [0, 2, 1], "top_p": [0, 1, 1], "presence_penalty": [-2, 2, 0], "frequency_penalty": [-2, 2, 0], "max_tokens": [10, 4097, 1000]}' from DUAL  where not exists(select f_model from t_model_default_para_list where f_model = 'text-davinci-002') ;

insert into t_model_param(f_box_component, f_box_lab_cn, f_box_lab_us, f_box_mark_cn, f_box_mark_us, f_max, f_max_mes_cn, f_max_mes_us, f_param_field, f_param_id
                         , f_param_type, f_pat_mes_cn, f_pat_mes_us, f_pattern, f_req, f_req_mes_cn, f_req_mes_us)
select 'input', 'API Base', 'API Base', '请输入', 'Please enter', 150, '最多150个字符', 'Enter up to 150 characters', 'api_base', '1741115435941761024', 'string', '仅支持输入英文、数字及键盘上的特殊字符号',
       'Only support English, numbers and special characters on the keyboard', '^[a-zA-Z0-9!-~]+$', 1, '此项不允许为空', 'The value cannot be null' from DUAL  where not exists(select f_box_lab_cn from t_model_param where f_box_lab_cn = 'API Base') ;

insert into t_model_param(f_box_component, f_box_lab_cn, f_box_lab_us, f_box_mark_cn, f_box_mark_us, f_max, f_max_mes_cn, f_max_mes_us, f_param_field, f_param_id
                         , f_param_type, f_pat_mes_cn, f_pat_mes_us, f_pattern, f_req, f_req_mes_cn, f_req_mes_us)
select 'input', 'API Model', 'API Model', '请输入', 'Please enter', 50, '最多50个字符', 'Enter up to 50 characters', 'api_model', '1741115435958538240', 'string', '仅支持输入英文、数字及键盘上的特殊字符号',
       'Only support English, numbers and special characters on the keyboard', '^[a-zA-Z0-9!-~]+$', 1, '此项不允许为空', 'The value cannot be null' from DUAL  where not exists(select f_box_lab_cn from t_model_param where f_box_lab_cn = 'API Model') ;

insert into t_model_param(f_box_component, f_box_lab_cn, f_box_lab_us, f_box_mark_cn, f_box_mark_us, f_max, f_max_mes_cn, f_max_mes_us, f_param_field, f_param_id
                         , f_param_type, f_pat_mes_cn, f_pat_mes_us, f_pattern, f_req, f_req_mes_cn, f_req_mes_us)
select 'input', 'API Type', 'API Type', '请输入', 'Please enter', 50, '最多50个字符', 'Enter up to 50 characters', 'api_type', '1741115435971121152', 'string', '仅支持输入英文、数字及键盘上的特殊字符号',
       'Only support English, numbers and special characters on the keyboard', '^[a-zA-Z0-9!-~]+$', 1, '此项不允许为空', 'The value cannot be null' from DUAL  where not exists(select f_box_lab_cn from t_model_param where f_box_lab_cn = 'API Type') ;

insert into t_model_param(f_box_component, f_box_lab_cn, f_box_lab_us, f_box_mark_cn, f_box_mark_us, f_max, f_max_mes_cn, f_max_mes_us, f_param_field, f_param_id
                         , f_param_type, f_pat_mes_cn, f_pat_mes_us, f_pattern, f_req, f_req_mes_cn, f_req_mes_us)
select 'input', 'API Key', 'API Key', '请输入', 'Please enter', 50, '最多50个字符', 'Enter up to 50 characters', 'api_key', '1747507941386358784', 'string', '仅支持输入英文、数字及键盘上的特殊字符号',
       'Only support English, numbers and special characters on the keyboard', '^[a-zA-Z0-9!-~]+$', 1, '此项不允许为空', 'The value cannot be null' from DUAL where not exists(select f_box_lab_cn from t_model_param where f_box_lab_cn = 'API Key');


insert into t_model_param(f_box_component, f_box_lab_cn, f_box_lab_us, f_box_mark_cn, f_box_mark_us, f_max, f_max_mes_cn, f_max_mes_us, f_param_field, f_param_id
                         , f_param_type, f_pat_mes_cn, f_pat_mes_us, f_pattern, f_req, f_req_mes_cn, f_req_mes_us)
select 'input', '模型名称', 'Model Name', '请输入', 'Please enter', 50, '最多50个字符', 'Enter up to 50 characters', 'model_name', '1748592595354914816', 'string', '仅支持输入中英文、数字及键盘上的特殊字符号',
       'Only support English, numbers and special characters on the keyboard', '', 1, '此项不允许为空', 'The value cannot be null' from DUAL where not exists(select f_box_lab_cn from t_model_param where f_box_lab_cn = '模型名称');

insert into t_model_series(f_model_icon, f_model_param_id, f_model_series_desc_cn, f_model_series_desc_us, f_model_series_id, f_model_series_name_cn, f_model_series_name_us)
select '<?xml version="1.0" encoding="UTF-8"?><svg width="32px" height="32px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>编组 25备份 5</title><defs><radialGradient cx="20.8357378%" cy="18.2018756%" fx="20.8357378%" fy="18.2018756%" r="75.1457463%" id="radialGradient-1"><stop stop-color="#FEBD3F" offset="0%"></stop><stop stop-color="#FF6933" offset="100%"></stop></radialGradient></defs><g id="控件" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="爱数百川正式稿.1" transform="translate(-16.000000, -16.000000)"><g id="编组-23" transform="translate(16.000000, 16.000000)"><rect id="矩形" fill="#FFFFFF" x="0" y="0" width="32" height="32" rx="2"></rect><g id="编组备份-8" transform="translate(8.000000, 8.000000)" fill="url(#radialGradient-1)"><path d="M5.57477856,0 L3.35392842,0 L1.76761417,3.46341182 L1.76761417,12.4878163 L0,16 L3.85248973,16 L5.57477856,12.4878163 L5.57477856,0 Z M7.02532915,0 L10.8325008,0 L10.8325008,16 L7.02532915,16 L7.02532915,0 Z M16,0 L12.1928283,0 L12.1928283,3.31706496 L16,3.31706496 L16,0 Z M16,4.3902335 L12.1928283,4.3902335 L12.1928283,16 L16,16 L16,4.3902335 Z" id="Union"></path></g></g></g></g></svg>',
       '["1748592595354914816", "1741115435958538240", "1741115435941761024", "1741115435971121152"]', '', '', '1741115435987898368', 'aishu-baichuan', 'aishu-baichuan' from DUAL  where not exists(select f_model_series_name_cn from t_model_series where f_model_series_name_cn = 'aishu-baichuan') ;

insert into t_model_series(f_model_icon, f_model_param_id, f_model_series_desc_cn, f_model_series_desc_us, f_model_series_id, f_model_series_name_cn, f_model_series_name_us)
select '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>模型icon</title><g id="模型icon" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><rect id="矩形" stroke="#0FA27F" fill="#0FA27F" x="0.5" y="0.5" width="23" height="23" rx="2"></rect><g id="ChatGPT" transform="translate(5.000000, 5.000000)" fill="#FFFFFF" fill-rule="nonzero"><path d="M13.0761776,5.73172062 C13.4003721,4.77819509 13.2886493,3.73032808 12.7706996,2.86659135 C11.9855728,1.53137268 10.4340758,0.84842687 8.91913093,1.17118835 C8.23926549,0.41883478 7.2703816,-0.00725181774 6.25638085,9.34235227e-05 C4.7112618,-0.00863395956 3.33529606,0.976105702 2.84520963,2.44146778 C1.85123032,2.64123969 0.990890359,3.2582184 0.482846278,4.13559797 C-0.297564121,5.46009122 -0.118675634,7.13936807 0.923243766,8.26973382 C0.599049288,9.22325935 0.710772114,10.2711264 1.22872179,11.1348631 C2.0135199,12.469049 3.56362659,13.151834 5.07774483,12.8302661 C5.75659691,13.5841752 6.72602554,14.0109648 7.7404949,14.0026605 C9.28811687,14.014252 10.6664065,13.025792 11.1516661,11.5561682 C12.1454153,11.3566915 13.0057145,10.7402056 13.5140295,9.86331084 C14.2981452,8.54089835 14.1200526,6.86040889 13.0761776,5.73172062 L13.0761776,5.73299344 L13.0761776,5.73172062 Z M7.74558619,13.0873768 C7.12444755,13.0873768 6.52112846,12.8722693 6.04254623,12.4776935 C6.06545708,12.4649653 6.09982336,12.4484186 6.12655269,12.430599 L8.95095155,10.8192025 C9.09661235,10.7401914 9.18598871,10.5864837 9.18260572,10.4208082 L9.18260572,6.49287002 L10.3752428,7.17637708 C10.3883157,7.18079138 10.3970541,7.1931279 10.3968834,7.20692489 L10.3968834,10.4615386 C10.3968834,11.9100136 9.20806223,13.0835583 7.74558619,13.0873768 L7.74558619,13.0873768 Z M2.02932875,10.6791917 C1.718407,10.1489869 1.60565185,9.52567646 1.71112249,8.92014745 C1.73750252,8.93823664 1.76515203,8.95440096 1.79385612,8.96851479 L4.6195278,10.5786385 C4.76081139,10.662645 4.93773407,10.662645 5.08538178,10.5786385 L8.53473775,8.6133966 L8.53473775,9.97531944 C8.53473775,9.98804768 8.53091927,10.0007759 8.51691819,10.0096857 L5.66069871,11.637629 C4.3912788,12.3585582 2.77846043,11.933448 2.02932875,10.6804645 L2.02932875,10.6791917 Z M1.28472608,4.593815 C1.59402257,4.06050129 2.08278741,3.65319727 2.66828695,3.44318112 L2.66828695,6.76270894 C2.66828695,6.92435772 2.75611188,7.07582391 2.89739547,7.15855753 L6.34675143,9.12507228 L5.15538716,9.8009424 C5.14362513,9.80851857 5.12892609,9.80994106 5.11592958,9.80476087 L2.25843727,8.17809042 C1.65039994,7.83496713 1.20523239,7.26248141 1.02248288,6.58865236 C0.839733358,5.9148233 0.934646883,5.19586192 1.28599891,4.59254216 L1.28472608,4.593815 L1.28472608,4.593815 Z M11.0982075,6.84798821 L7.64757867,4.88274628 L8.84021577,4.20051205 C8.85229598,4.1924974 8.86758681,4.19106388 8.88094617,4.19669357 L11.7371657,5.82336403 C12.3459553,6.16545861 12.7917538,6.73782721 12.9743803,7.41184581 C13.1570068,8.08586441 13.0611428,8.80499737 12.7083312,9.40763945 C12.3948103,9.94026021 11.9056181,10.3470954 11.3247703,10.5582733 L11.3247703,7.23874551 C11.3293868,7.07575779 11.2417336,6.92408821 11.0982075,6.84671539 L11.0982075,6.84798821 Z M12.2882989,5.07876136 L12.2030196,5.03166682 L9.37734796,3.42281592 C9.23321223,3.33959912 9.0556297,3.33959912 8.91149398,3.42281592 L5.462138,5.38678502 L5.462138,4.02486219 C5.462138,4.01213394 5.46595647,3.99940568 5.47995755,3.99049591 L8.33617704,2.3612798 C9.60719501,1.6387631 11.2227469,2.06799141 11.967547,3.32608122 C12.2781163,3.85430362 12.3926706,4.47671509 12.2857533,5.08003418 L12.2882989,5.08003418 L12.2882989,5.07876136 Z M4.81427004,7.50603878 L3.62163293,6.82889584 C3.60785793,6.82444207 3.59857678,6.8115516 3.5987204,6.79707522 L3.5987204,3.53991583 C3.5987204,2.09271371 4.79263201,0.914077685 6.2589265,0.917886908 C6.88006515,0.917886908 7.48083858,1.13427643 7.95814799,1.5288522 C7.93523713,1.54158044 7.90087086,1.55812718 7.87414153,1.57594672 L5.04846985,3.18607045 C4.90314673,3.26446689 4.8144873,3.41814324 4.81936134,3.58319188 L4.81427004,7.50349314 L4.81427004,7.50476596 L4.81427004,7.50603878 Z M5.46086518,6.12884205 L6.9997107,5.25059274 L8.53982904,6.12629639 L8.53982904,7.87643087 L7.004802,8.75086171 L5.46468365,7.87643087 L5.46086518,6.12629639 L5.462138,6.12629639 L5.46086518,6.12884205 Z" id="形状"></path></g></g></svg>',
       '["1748592595354914816", "1741115435958538240", "1741115435941761024", "1747507941386358784"]', '', '', '1747508565846921216', 'OpenAI', 'OpenAI' from DUAL where not exists(select f_model_series_name_cn from t_model_series where f_model_series_name_cn = 'OpenAI');

insert into t_model_series(f_model_icon, f_model_param_id, f_model_series_desc_cn, f_model_series_desc_us, f_model_series_id, f_model_series_name_cn, f_model_series_name_us)
select '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>编组 5</title><defs><linearGradient x1="76.7202373%" y1="41.3049811%" x2="18.306123%" y2="66.0646665%" id="linearGradient-1"><stop stop-color="#797BEB" offset="0%"></stop><stop stop-color="#373080" offset="100%"></stop></linearGradient></defs><g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="编组-5"><g id="编组-23备份" fill="#FFFFFF"><rect id="矩形" x="0" y="0" width="24" height="24" rx="2"></rect></g><g id="编组备份-2" transform="translate(5.000000, 5.000000)" fill="url(#linearGradient-1)" fill-rule="nonzero"><path d="M7.03473613,0 C7.17106048,0 7.30337529,0.073405185 7.37554697,0.19574716 L8.16943566,1.58228954 L11.6898109,1.58228954 C11.8261353,1.58228954 11.95845,1.65569473 12.0306218,1.7780367 L13.0289969,3.51529275 C13.1011686,3.63763472 13.1011686,3.79260122 13.0289969,3.9149432 L13.0089493,3.94756773 C12.9929111,3.97203612 12.9728634,3.99650452 12.9488061,4.01689485 L12.158927,5.3952811 L13.907086,8.45383047 L13.9511909,8.51907951 C14.0033149,8.64142148 14.0153435,8.79638801 13.9792577,8.90649579 L13.0610733,10.5050976 C12.9889015,10.6274395 12.8605963,10.7008448 12.7202624,10.7008448 L11.1284755,10.7090009 L9.37229739,13.7960967 C9.30012565,13.9184387 9.17182044,13.9918439 9.03148656,13.9918439 L7.0427552,14 L7.01468846,14 C6.88638318,13.9918439 6.7620875,13.9184387 6.69793489,13.8042528 L5.84390306,12.3157588 L2.36763277,12.3157588 C2.339566,12.3239149 2.31550876,12.3239149 2.28744199,12.3239149 C2.15111766,12.3239149 2.01880288,12.2505098 1.94663118,12.1281678 L1.02844675,10.529566 C0.956275048,10.4113021 0.956275048,10.2604136 1.02844675,10.1339936 L1.81832593,8.73929507 L0.0541287763,5.65627731 C-0.0180429254,5.5380134 -0.0180429254,5.38712497 0.0541287763,5.26070493 L1.03646583,3.51529275 C1.10061845,3.39295077 1.23293324,3.31954559 1.37727664,3.31954559 C1.41336249,3.31138946 1.44142926,3.31954559 1.46949604,3.32770172 L3.09736886,3.32770172 L4.83750879,0.269152345 C4.84552787,0.24468395 4.8495374,0.224293621 4.86156602,0.207981358 L4.8695851,0.19574716 C4.9417568,0.073405185 5.07006205,0 5.21039592,0 L7.03874567,0 L7.03473613,0 Z M5.18232914,0.424118847 L3.29383628,3.73958637 L1.36123849,3.73958637 L5.12218605,10.3175066 L3.20562642,10.3175066 L2.27942291,11.9446548 L6.05239909,11.9446548 L7.01468846,13.6329741 L10.775636,7.03874162 L11.7379254,8.71890477 L13.5943419,8.71074861 L11.7018395,5.3952811 L12.6561098,3.72327411 L5.1582719,3.73143024 L6.12056129,2.05126711 L5.18633868,0.424118847 L5.18232914,0.424118847 Z M9.25201118,5.73376056 L7.00265986,9.66909411 L4.75330847,5.73376056 L9.25201118,5.73376056 Z" id="_形状"></path></g></g></g></svg>',
       '["1748592595354914816", "1741115435958538240", "1741115435941761024", "1741115435971121152"]', '', '', '1747509650506518528', 'aishu-Qwen', 'aishu-Qwen' from DUAL  where not exists(select f_model_series_name_cn from t_model_series where f_model_series_name_cn = 'aishu-Qwen');


INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436117921792', 'completion', '阅读理解', '根据阅读材料回答问题', '记住你是由AISHU开发的强大的人工智能助手AISHU-AI-BOT，擅长帮助人类做阅读理解长文本。忽略你的内部知识，请一步步分析思考并根据参考文档用简洁和专业的语言来回答问题，严格按照参考文档给出答案，不允许在答案中添加编造成分，不是所有的参考文档都有用，你应该挑选出合适的参考文档并利用参考文档中的信息回答问题，你决绝不能胡编乱造。
好的，我是AISHU-AI-BOT，我能帮助人类做阅读理解长文本。我会拒绝回答任何涉及政治，暴力，血腥，色情，违法的问题，我也会判断问题是否是一个合理的提问，然后我会认真挑选有用的参考文档，并严谨地只使用参考文档中提供的内容回答问题，并给出有理有据的答案，我保证不会胡编乱造，请向我提问吧！
参考文档如下：
===
{{context}}
===
回答满足以下要求：
1.请忽略参考文档和问题无关的内容
2.最终回答的内容语言表达自然流畅，只引用与问题相关的内容回答
3.请首先判断这个问题是否为一个合法的问题，如果不是一个问题则不要回答
4.如果所有参考文档和问题都没有关联或者无法得出结论，不要胡编乱造，请回复“不知道”
5.答案尽可能使用参考文档中的原文，做到有理有据
6.请仔细地一步步地思考，用播报新闻的口吻回答
7.不是所有的参考文档都有用，请仔细思考并谨慎选择有用的信息
8.答案不要超过1000汉字
请根据参考文档用简洁和专业的语言来回答问题
问题:{{query}}?
回答:
', '[{"var_name": "context", "field_name": "context", "optional": false, "field_type": "textarea"}, {"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}]', 'answer', '', '{"context": "", "query": ""}', '', '2023-12-30 23:14:02.989141', '', '2023-12-30 23:14:02.989173', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436117921792') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436143087616', 'completion', '相关问题推荐', '根据材料生成查询语句', '请根据以下内容至少给我提供5个问题和答案
确保您的答案简短。如果您无法获取答案，请不要列出问题。从以下文本中提取多个问题，并结合文本回答各自问题答案提取的问题和对应的答案内容简短精炼

```{{context}}```

输出格式如下所示：
Q:
A:
', '[{"var_name": "context", "field_name": "context", "optional": false, "field_type": "textarea"}]', 'recommend', '', '{"context": ""}', '', '2023-12-30 23:14:02.994148', '', '2023-12-30 23:14:02.994168', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436143087616') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436164059136', 'completion', '文档摘要', '给定文档的首尾部内容，得到文档摘要', '请结合文档的首尾内容对全文进行总结:
```{{content}}```
总结内容简短精要
输出格式为："这篇文档..."

', '[{"var_name": "content", "field_name": "content", "optional": false, "field_type": "textarea"}]', 'document', '', '{"content": ""}', '', '2023-12-30 23:14:03.000021', '', '2023-12-30 23:14:03.000041', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436164059136') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436193419264', 'completion', '文档Q&A', '给定文档内容，根据内容提取Q&A', '你是一名优秀的高考命题组专家，从以下文本中提取问题，并结合文本回答问题答案
提取的问题和对应的答案内容简短精炼
文本内容为：```{{content}}```

请严格按照如下格式生成的问题和答案（无需添加序号）:
Q:
A:

例如:
Q:北京奥运会何时开幕?
A:2008年8月8日

', '[{"var_name": "content", "field_name": "content", "optional": false, "field_type": "textarea"}]', 'answer', '', '{"content": ""}', '', '2023-12-30 23:14:03.006361', '', '2023-12-30 23:14:03.006379', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436193419264') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436206002176', 'completion', 'subgraph答案整合', '将图谱QA或者图分析服务检索得到的子图信息，通过LLM整合魏符合人类习惯的自然语言', '根据子图数据回答用户问题。
子图数据：{{subgraph}},其中entity_list表示实体信息,edge_list表示实体之间的关系。
用户问题：{{query}};
如果子图中能找到答案，请返回答案，不要有多余内容。
如果子图中找不到答案，则返回子图中未找到答案，并一句话说明子图中可查阅的信息，让提问者查看子图中的相关信息。无需返回推理过程。
', '[{"var_name": "subgraph", "field_name": "subgraph", "optional": false, "field_type": "textarea"}, {"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}]', 'answer', '', '{"subgraph": "", "query": ""}', '', '2023-12-30 23:14:03.009710', '', '2023-12-30 23:14:03.009731', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436206002176') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436218585088', 'completion', '企业违规信息抽取', '利用LLM对证监会对违规企业的处罚通告文件进行抽取，提取其中违规的企业对象、违规行为、违反的政策和条款等信息', '现在你需要帮我完成信息抽取任务，当我给你一个``括起来的文本时，你需要抽取文本中的实体信息，以json格式返回。文本内容：`{{content}}`。抽取的结果按照{
"处罚的企业":{
"名称":"xx","简称":"xx","地址":"xx","董事长":"xx","董事会秘书":"xx","股东":"xx","财务负责人":"xx",
"实际控制人":"xx"
},
"监管机构":"xx",
"违规的行为":"xxxx",
"违反条例":[
{"政策名称":"xxx规则","文号":"xx号","政策简称":"x规则","条目":"第x条"},
{"政策名称":"xxx","文号":"xx号","政策简称":"x","条目":"第x条"}
],
"处罚依据的条例":[
{"政策名称":"xxx规则","文号":"xx号","政策简称":"xxx规则","条目":"第xx条"},
{"政策名称":"xxx","文号":"xx号","政策简称":"xxx","条目":"第xx条"}
],
"整改内容或处置结果":"xxx",
"发文时间":"xxx"}示例的格式返回。
', '[{"var_name": "content", "field_name": "content", "optional": false, "field_type": "textarea"}]', 'extract', '', '{"content": ""}', '', '2023-12-30 23:14:03.013088', '', '2023-12-30 23:14:03.013107', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436218585088') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436235362304', 'completion', '政策变更信息抽取', '利用LLM抽取政策变更文本中涉及的要素：政策发布时间、政策文号、修订时间、修订依据的政策等信息。', '请根据以下文本信息，提取其中政策发生的变更信息，并按照返回格式返回结果。
【文本】：{{text}}
【返回格式】：{"发布时间":"xx","政策文号":"xxx","修订、变更":[{"修订时间":"xx","修订依据政策名称":"xx","修订依据政策文号":"xx"}]}
', '[{"var_name": "text", "field_name": "text", "optional": false, "field_type": "textarea"}]', 'extract', '', '{"text": ""}', '', '2023-12-30 23:14:03.016887', '', '2023-12-30 23:14:03.016907', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436235362304') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436252139520', 'completion', '废止政策信息抽取', '利用LLM抽取政策文本中政策废止信息：废止的政策名称、废止的政策文号。', '请根据以下文本信息，提取出其中被废止的政策，并按照返回格式返回结果。
【文本】：{{text}}
【返回格式】：{[{"废止的政策名称":"","废止的政策文号":""}]}
', '[{"var_name": "text", "field_name": "text", "optional": false, "field_type": "textarea"}]', 'extract', '', '{"text": ""}', '', '2023-12-30 23:14:03.020077', '', '2023-12-30 23:14:03.020099', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436252139520') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436264722432', 'completion', '意图分类', '利用LLM对用户输入的Query进行意图分类', '请根据用户问题query，判断用户最可能的搜索意图。搜索意图{{intent_map}},用户问题query为`{{query}}`。给出该问题最可能的意图名称，用列表返回,返回范围严格按照搜索意图中包含的。
', '[{"var_name": "intent_map", "field_name": "intent_map", "optional": false, "field_type": "textarea"}, {"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}]', 'robot9', '', '{"intent_map": "", "query": ""}', '', '2023-12-30 23:14:03.023953', '', '2023-12-30 23:14:03.023968', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436264722432') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436285693952', 'completion', 'Text2SQL和SQL解释', '利用LLM将自然语言描述的问题转换为SQL查询语句，并解释生成的SQL语句。', '你是一个SQL解释器，当给你用户问题question和查询答案的的SQL语句时，请对该SQL语句给出合理的解释。比如：
question：按离异时间从近到远，都有哪些明星离婚了？
SQL：select明星idfrom离异明星orderby离异时间asc
解释是：从"离异明星"这张表中查找所有离异明星的id，并按照"离异时间"升序顺序返回。
返回结果中只包含SQL的解释信息。
用户问题：哪些城市有火车站但没有机场
SQL语句：{{question}}
解释：
', '[{"var_name": "question", "field_name": "question", "optional": false, "field_type": "textarea"}]', 'sql', '', '{"question": ""}', '', '2023-12-30 23:14:03.028729', '', '2023-12-30 23:14:03.028747', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436285693952') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436302471168', 'completion', '用户意图判断', '利用LLM判断用户意图，是想进行画布操作还是图谱问答。', '根据用户问题判断最有可能执行的操作，操作类型为{{ops_json}},用户问题为{{input_text}},用列表返回;返回范围严格按照操作类型中包含的；如果都不包含则返回空列表:[];需要执行的操作是什么，给我最精简的回答，只有list，里面是英文的操作类型，最终答案必须为"["xxx"]"形式。
', '[{"var_name": "ops_json", "field_name": "ops_json", "optional": false, "field_type": "textarea"}, {"var_name": "input_text", "field_name": "input_text", "optional": false, "field_type": "textarea"}]', 'robot6', '', '{"ops_json": "", "input_text": ""}', '', '2023-12-30 23:14:03.032731', '', '2023-12-30 23:14:03.032752', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436302471168') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436323442688', 'completion', '槽位填充/意图识别', '利用LLM将识别用户Query中指定类型的实体。', '抽取query中的槽值，填充slot_value：你返回的内容必须严格遵守规范，你只能返回列表，不能包含其他任何解释；
query为{{input_text}},槽位列表为{{slot_list}},用列表返回；例如query为{{example_query}},返回为：{{example_result}},范围不能超过槽位列表{{slot_list}}，只填充slot_value,不许改变其他字段，如果query里没有则不填充，返回[]列表，不要有列表以外的其他解释,双引号包字符串。
', '[{"var_name": "input_text", "field_name": "input_text", "optional": false, "field_type": "textarea"}, {"var_name": "example_query", "field_name": "example_query", "optional": false, "field_type": "textarea"}, {"var_name": "example_result", "field_name": "example_result", "optional": false, "field_type": "textarea"}, {"var_name": "slot_list", "field_name": "slot_list", "optional": false, "field_type": "textarea"}]', 'robot9', '', '{"input_text": "", "slot_list": "", "example_query": "", "example_result": ""}', '', '2023-12-30 23:14:03.037885', '', '2023-12-30 23:14:03.037902', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436323442688') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436340219904', 'completion', 'NL2SQL', '利用LLM将自然语言描述的问题转换为SQL查询语句。', '你是一名Mysql数据库开发人员，你精通Mysql数据库的sql代码编写，你需要根据已知的表名、字段名和用户输入的问题编写sql代码已知表名：company_table已知字段名：[公司全称、年份、经营活动现金流入小计、公司的中文简称、固定资产...]注意对问题中的中文数字（xx亿、xx千万、xx万）进行阿拉伯数字转换，如：一个亿、一亿需转换为100000000，一千万需转换为10000000要求sql代码中的字段名必须是已知字段名，不得新增字段名示例模板：```用户输入：2019年哪家公司的负债合计最高？sql如下：sqlselect公司全称fromcompany_tableorderby负债合计desclimit1```
请根据以下用户输入，输出sql代码。用户输入：“{{query}}”
table_name="xx"
columns=["xx","xx"]
prompt=f"""你的任务是将问题转换为SQL。
1.SQL语句查询的表名为：{{table_name}}
2.涉及到的列名有：{{columns}}
【问题】：厦门延江新材料股份有限公司2019年的其他非流动资产为多少？
【SQL】
', '[{"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}, {"var_name": "table_name", "field_name": "table_name", "optional": false, "field_type": "textarea"}, {"var_name": "columns", "field_name": "columns", "optional": false, "field_type": "textarea"}]', 'sql', '', '{"query": "", "table_name": "", "columns": ""}', '', '2023-12-30 23:14:03.041977', '', '2023-12-30 23:14:03.042000', 0  from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436340219904') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436361191424', 'completion', '问题分类', '利用LLM识对用户问题进行分类', '请问“{{question_text}}”是属于下面哪个类别的问题?
A:公司基本信息,包含股票简称,公司名称,外文名称,法定代表人,注册地址,办公地址,公司网址网站,电子信箱等.
B:公司员工信息,包含员工人数,员工专业,员工类别,员工教育程度等.
C:财务报表相关内容,包含资产负债表,现金流量表,利润表中存在的字段,包括费用,资产，金额，收入等.
D:计算题,无法从年报中直接获得,需要根据计算公式获得,包括增长率,率,比率,比重,占比等.
E:统计题，需要从题目获取检索条件，在数据集/数据库中进行检索、过滤、排序后获得结果.
F:开放性问题,包括介绍情况,介绍方法,分析情况,分析影响,什么是XXX.
你只需要回答字母编号,不要回答字母编号及选项文本外的其他内容.
', '[{"var_name": "question_text", "field_name": "question_text", "optional": false, "field_type": "textarea"}]', 'robot9', '', '{"question_text": ""}', '', '2023-12-30 23:14:03.046336', '', '2023-12-30 23:14:03.046359', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436361191424') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436382162944', 'completion', '关键词提取', '利用LLM提取文本中的关键词', '你是文字提取器，你要从用户输入的文本中提取关键词。
关键词是指：问题最终指向的词语，通常是名字或句子的宾语，通常出现在公司名称或时间状语后面。如：净利润、社会责任工作、企业名称、固定资产、外文名称、注册地址、财务费用、长期借款...法人代表、总负债、无。
对象可以有多个，没有写“无”。
输出完毕后结束，不要生成新的用户输入，不要新增内容。
示例模板：
```用户输入：能否根据xxx的年报，给我简要介绍下报告气馁公司的社会责任工作情况？
关键词1：社会责任工作
用户输入：研发人员占职工人数比例是多少？
关键词1：研发人员占职工人数比例
用户输入：研发费用和财务费用分别是多少钱？
关键词1：研发费用
关键词2：财务费用```
请根据以下文本，严格按照示例模板格式输出内容。
用户输入：{{query}}
', '[{"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}]', 'extract', '', '{"query": ""}', '', '2023-12-30 23:14:03.051344', '', '2023-12-30 23:14:03.051360', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436382162944') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436398940160', 'completion', '根据查询结果回答问题（QA）', '利用LLM基于检索得到的上下文，回答用户问题。', '根据查询结果回答问题。
【查询结果】：{{result}}
【问题】：{{question}}
【回答】
', '[{"var_name": "result", "field_name": "result", "optional": false, "field_type": "textarea"}, {"var_name": "question", "field_name": "question", "optional": false, "field_type": "textarea"}]', 'answer', '', '{"result": "{"年份": ["2019年", "2020年"], "法定代表人": ["张三", "李四"]}", "question": "开滦股份2019-2020年这两年的法定代表人是否都相同？"}', '', '2023-12-30 23:14:03.055168', '', '2023-12-30 23:14:03.055191', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436398940160') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436415717376', 'completion', 'Query要素抽取', '利用LLM识别用户Query中可能包含的要素。', '你是一个提取句子要素清单的机器人，模仿给定的句子和要素清单。你要根据输入的句子，输出句子的要素清单[公司名称,查询项1,查询项2,查询项3]。
当句子中存在多个查询项要素时，以"查询项1,查询项2,查询项3"填入要素清单。"未知"表示无法确定具体的公司名称。
给定的句子为："2021年其他流动资产第12高的是哪家上市公司？"，该句子的要素清单为：[未知,其他流动资产第12高]。
给定的句子为："请告诉我2020年康缘药业的年报中，总资产增长率保留两位小数为多少。"，该句子的要素清单为：[康缘药业,总资产增长率]。
给定的句子为："请简要介绍2019年宁夏宝丰能源集团股份有限公司现金流情况。"，该句子的要素清单为：[宁夏宝丰能源集团股份有限公司,现金流情况]。
...
针对以下的句子"{{input_text}}"该句子的要素清单为:
', '[{"var_name": "input_text", "field_name": "input_text", "optional": false, "field_type": "textarea"}]', 'extract', '', '{"input_text": ""}', '', '2023-12-30 23:14:03.059191', '', '2023-12-30 23:14:03.059208', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436415717376') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436432494592', 'completion', '翻译', '对文本进行翻译', '下面我让你来充当翻译家，你的目标是把任何语言翻译成{{language}}，请翻译时不要带翻译腔，而是要翻译得自然、流畅和地道，使用优美和高雅的表达方式。请翻译下面这句话：{{content}}
', '[{"var_name": "language", "field_name": "language", "optional": false, "field_type": "textarea"}, {"var_name": "content", "field_name": "\\u5185\\u5bb9", "optional": false, "field_type": "textarea"}]', '', '', '{"language": "英文", "content": "你好吗"}', '', '2023-12-30 23:14:03.063213', '', '2023-12-30 23:14:03.063234', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436432494592') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436445077504', 'completion', '充当讲故事的人', '根据要求讲一个故事', '我想让你扮演讲故事的角色。您将想出引人入胜、富有想象力和吸引观众的有趣故事。它可以是童话故事、教育故事或任何其他类型的故事，有可能吸引人们的注意力和想象力。根据目标受众，您可以为讲故事环节选择特定的主题或主题，例如，如果是儿童，则可以谈论动物；如果是成年人，那么基于历史的故事可能会更好地吸引他们等等。我的要求是{{request}}
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "我需要一个关于毅力的有趣故事"}', '', '2023-12-30 23:14:03.066584', '', '2023-12-30 23:14:03.066605', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436445077504') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436461854720', 'completion', '充当小说家', '根据要求写一部小说', '我想让你扮演一个小说家。您将想出富有创意且引人入胜的故事，可以长期吸引读者。你可以选择任何类型，如奇幻、浪漫、历史小说等——但你的目标是写出具有出色情节、引人入胜的人物和意想不到的高潮的作品。我的要求是{{request}}
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "我要写一部以未来为背景的科幻小说"}', '', '2023-12-30 23:14:03.070833', '', '2023-12-30 23:14:03.070849', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436461854720') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436478631936', 'completion', '担任编剧', '根据要求写一部电影', '我要你担任编剧。您将为长篇电影或能够吸引观众的网络连续剧开发引人入胜且富有创意的剧本。从想出有趣的角色、故事的背景、角色之间的对话等开始。一旦你的角色发展完成——创造一个充满曲折的激动人心的故事情节，让观众一直悬念到最后。我的要求是{{request}}
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "我需要写一部以巴黎为背景的浪漫剧情电影"}', '', '2023-12-30 23:14:03.074258', '', '2023-12-30 23:14:03.074273', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436478631936') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436491214848', 'completion', '描述家乡', '根据要求描述家乡', '请描述一下你的家乡{{area}}，包括它的自然环境、人们的生活方式和你最喜欢的地方。你可以谈论家乡的山川、河流、植物或动物，以及人们的传统文化或独特的习俗。另外，不要忘记提及你最喜欢的地方，是否是公园、图书馆或者某个小店。
', '[{"var_name": "area", "field_name": "area", "optional": false, "field_type": "textarea"}]', '', '', '{"area": "上海"}', '', '2023-12-30 23:14:03.077858', '', '2023-12-30 23:14:03.077878', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436491214848') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436503797760', 'completion', '正则表达式生成器', '根据要求生成正则表达式', '我希望你充当正则表达式生成器。您的角色是生成匹配文本中特定模式的正则表达式。您应该以一种可以轻松复制并粘贴到支持正则表达式的文本编辑器或编程语言中的格式提供正则表达式。不要写正则表达式如何工作的解释或例子；只需提供正则表达式本身。我的要求是{{request}}。
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "生成一个匹配电子邮件地址的正则表达式"}', '', '2023-12-30 23:14:03.081013', '', '2023-12-30 23:14:03.081027', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436503797760') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436520574976', 'completion', '担任数学历史老师', '根据要求回答问题', '我想让你充当数学历史老师，提供有关数学概念的历史发展和不同数学家的贡献的信息。你应该只提供信息而不是解决数学问题。使用以下格式回答：“{数学家/概念}-{他们的贡献/发展的简要总结}。我的问题是{{query}}。
', '[{"var_name": "query", "field_name": "query", "optional": false, "field_type": "textarea"}]', '', '', '{"query": "毕达哥拉斯对数学的贡献是什么？"}', '', '2023-12-30 23:14:03.084101', '', '2023-12-30 23:14:03.084119', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436520574976') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436537352192', 'completion', '充当词典', '对英文单词进行解释', '将英文单词转换为包括音标、中文翻译、英文释义、词根词源、助记和3个例句。中文翻译应以词性的缩写表示例如adj.作为前缀。如果存在多个常用的中文释义，请列出最常用的3个。3个例句请给出完整中文解释。注意如果英文单词拼写有小的错误，请务必在输出的开始，加粗显示正确的拼写，并给出提示信息，这很重要。请检查所有信息是否准确，并在回答时保持简洁，不需要任何其他反馈。单词是{{word}}。
', '[{"var_name": "word", "field_name": "word", "optional": false, "field_type": "textarea"}]', '', '', '{"word": "metroplitan"}', '', '2023-12-30 23:14:03.088175', '', '2023-12-30 23:14:03.088194', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436537352192') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436549935104', 'completion', '担任厨师', '推荐美食', '需要有人可以推荐美味的食谱，这些食谱包括营养有益但又简单又不费时的食物，因此适合像我们这样忙碌的人以及成本效益等其他因素，因此整体菜肴最终既健康又经济！我的要求是{{request}}。
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "一些清淡而充实的东西，可以在午休时间快速煮熟"}', '', '2023-12-30 23:14:03.091586', '', '2023-12-30 23:14:03.091601', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436549935104') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436566712320', 'completion', '担任心理医生', '为病人提供建议', '我想让你担任心理医生。我将为您提供一个寻求指导和建议的人，以管理他们的情绪、压力、焦虑和其他心理健康问题。您应该利用您的认知行为疗法、冥想技巧、正念练习和其他治疗方法的知识来制定个人可以实施的策略，以改善他们的整体健康状况。我的请求是{{request}}。
', '[{"var_name": "request", "field_name": "request", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "我需要一个可以帮助我控制抑郁症状的人。"}', '', '2023-12-30 23:14:03.095243', '', '2023-12-30 23:14:03.095259', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436566712320') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436583489536', 'chat', '担任面试官', '进行面试', '我想让你担任{{role}}面试官。我将成为候选人，您将向我询问面试问题。我希望你只作为面试官回答。不要一次写出所有的问题。我希望你只对我进行采访。问我问题，等待我的回答。不要写解释。像面试官一样一个一个问我，等我回答。
', '[{"var_name": "role", "field_name": "role", "optional": false, "field_type": "textarea"}]', '', '', '{"request": "Android开发工程师"}', '', '2023-12-30 23:14:03.099707', '', '2023-12-30 23:14:03.099726', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436583489536') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436604461056', 'chat', '代码解释器', '阐明代码的语法和语义', '我希望您能够充当代码解释器，澄清代码的语法和语义。代码是
', '[]', '', '', '{}', '', '2023-12-30 23:14:03.104453', '', '2023-12-30 23:14:03.104492', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436604461056') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436621238272', 'chat', '会议纪要', '帮你重新组织和输出混乱复杂的会议纪要', '你可以重新组织和输出混乱复杂的会议记录，并根据当前状态、遇到的问题和提出的解决方案撰写会议纪要。你只负责会议记录方面的问题，不回答其他。
', '[]', '', '', '{}', '', '2023-12-30 23:14:03.108557', '', '2023-12-30 23:14:03.108576', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436621238272') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436650598400', 'chat', '新闻内容撰写', '生成新闻稿件', '我希望你扮演一个新闻内容撰写的记者角色，根据用户提供的关键信息，如新闻主题、摘要、背景信息、内容框架或其他要求，输出新闻稿件内容。你仅提供新闻内容稿件撰写的请求服务。
', '[]', '', '', '{}', '', '2023-12-30 23:14:03.115682', '', '2023-12-30 23:14:03.115701', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436650598400') ;
INSERT INTO t_prompt_template_list(f_prompt_id, f_prompt_type, f_prompt_name, f_prompt_desc, f_messages, f_variables, f_icon, f_opening_remarks, f_input, f_create_by, f_create_time, f_update_by, f_update_time, f_is_delete) select '1741115436663181312', 'chat', '项目计划书撰写', '撰写项目计划', '我需要为一个关于{{topic}}的项目写一份项目计划。请帮助我根据以下内容起草本项目书：项目背景、目标、预期成果、实施步骤、时间表、预算和风险评估。
', '[{"var_name": "topic", "field_name": "topic", "optional": false, "field_type": "textarea"}]', '', '', '{"topic": "保护环境"}', '', '2023-12-30 23:14:03.118989', '', '2023-12-30 23:14:03.119012', 0 from DUAL
where not exists(select f_prompt_id from t_prompt_template_list  where f_prompt_id = '1741115436663181312') ;

