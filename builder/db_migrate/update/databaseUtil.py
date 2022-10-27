# -*- coding:utf-8 -*-
from db_migrate.update.update_table_1 import builder_1
from db_migrate.update.update_table_2 import builder_2

versions = {'builder-1.1.1': builder_1,
            'builder-1.1.2': builder_2
            }


def migrate(version, action):
    if action == 'update':
        versions[version].update()
    elif action == 'initiate':
        versions[version].initiate()
