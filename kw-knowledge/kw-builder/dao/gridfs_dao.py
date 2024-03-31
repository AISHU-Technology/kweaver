# -*- coding:utf-8 -*-
import gridfs
from gridfs import GridFS

from utils.ConnectUtil import mongoConnect


class GridFSDao(object):

    def connect(self):
        # 连接到MongoDB数据库
        db = mongoConnect.connect_mongo()
        self.fs = GridFS(db)

    def save(self, filename, target_filename):
        '''
        存储文件到GridFS
        重名则覆盖
        Args:
            filename: 本地文件名
            target_filename: gridfs中文件的名字
        '''
        # 存储文件到GridFS
        try:
            with open(filename, 'rb') as file:
                self.fs.put(file, filename=target_filename, _id=target_filename)
        except gridfs.errors.FileExists:
            self.delete(target_filename)
            self.save(filename, target_filename)

    def get(self, filename, target_filename):
        '''
        从GridFS检索文件并存储至本地
        Args:
            filename: gridfs中文件的名字
            target_filename: 存储至本地的文件名
        '''
        file = self.fs.find_one({'filename': filename})
        if file:
            with open(target_filename, 'wb') as output:
                output.write(file.read())

    def delete(self, filename):
        # 删除GridFS中的文件
        file = self.fs.find_one({'filename': filename})
        if file:
            self.fs.delete(file._id)


gridfs_dao = GridFSDao()
