SET SCHEMA dip;

UPDATE t_knowledge_network SET f_creator_type = 'user' WHERE f_creator_type = '';
UPDATE t_knowledge_network SET f_updater_type = 'user' WHERE f_updater_type = '';
UPDATE t_object_type SET f_creator_type = 'user' WHERE f_creator_type = '';
UPDATE t_object_type SET f_updater_type = 'user' WHERE f_updater_type = '';
UPDATE t_relation_type SET f_creator_type = 'user' WHERE f_creator_type = '';
UPDATE t_relation_type SET f_updater_type = 'user' WHERE f_updater_type = '';
UPDATE t_action_type SET f_creator_type = 'user' WHERE f_creator_type = '';
UPDATE t_action_type SET f_updater_type = 'user' WHERE f_updater_type = '';