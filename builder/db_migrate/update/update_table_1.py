# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_1 as table
from utils.log_info import Logger


class Builder_1:
    def update(self):
        Logger.log_info('builder-1.1.1 start updating.')
        Logger.log_info('builder-1.1.1 update success.')
    
    def initiate(self):
        Logger.log_info('builder-1.1.1 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.1 initiate success')


builder_1 = Builder_1()

