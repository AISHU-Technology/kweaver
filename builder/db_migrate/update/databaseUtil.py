# -*- coding:utf-8 -*-
from db_migrate.update.update_table_1 import builder_1

versions = {'builder-1.1.1': builder_1
            }


def migrate(version, action):
    if action == 'update':
        versions[version].update()
    elif action == 'initiate':
        versions[version].initiate()
