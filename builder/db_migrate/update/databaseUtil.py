# -*- coding:utf-8 -*-
from db_migrate.update.update_table_1 import builder_1
from db_migrate.update.update_table_2 import builder_2
from db_migrate.update.update_table_3 import builder_3
from db_migrate.update.update_table_4 import builder_4
from db_migrate.update.update_table_5 import builder_5

versions = {'builder-1.1.1': builder_1,
            'builder-1.1.2': builder_2,
            'builder-1.1.3': builder_3,
            'builder-1.1.4': builder_4,
            'builder-1.1.5': builder_5
            }


def migrate(version, action):
    if action == 'update':
        versions[version].update()
    elif action == 'initiate':
        versions[version].initiate()
