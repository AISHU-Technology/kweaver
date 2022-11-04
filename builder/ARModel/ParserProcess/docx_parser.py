# -*- coding: utf-8 -*-
import io
import re
import requests
from docx import Document
from ARModel.utils.gid import getIndex
from ARModel.utils.preset import *
from utils.log_info import Logger


class DocxParse(object):
    def __init__(self):
        self.__id = getIndex()

    # 根据文档的authrequest读取文档
    def get_file_content_by_url(self, authrequest):
        one_headers = {}
        for i in authrequest[2:]:
            one_headers[i[:i.index(":")].strip()] = i[i.index(":") + 1:].strip()
        response = requests.request(authrequest[0], authrequest[1], headers=one_headers, verify=False, timeout=5)
        return response
        
    # 将文档解析成一个个的chapter
    def parseChapter(self, doc_url):
        response = self.get_file_content_by_url(doc_url)
        reader = io.BufferedReader(io.BytesIO(response.content))
        document = Document(reader)
        l = list()
        curLevel = 1
        preIsHeading = False
        for p in document.paragraphs:
            res = dict()
            res['number'] = getIndex()
            res['type'] = p.style.name
            res['text'] = p.text
            res['chapters'] = list()
            if res['type'].startswith('图片') and p.text == '':
                res['text'] = "图片省略"
            if p.text == '':
                continue
            
            # 设置当前段落所在级别
            if self.isNewNode(res):
                if res['type'] == 'Title' or res['type'] == '标题':
                    curLevel = 1
                else:
                    curLevel = int(p.style.name[-1:])
                preIsHeading = True
            if preIsHeading and (not self.isNewNode(res)):
                curLevel += 1
                preIsHeading = False
            res['level'] = curLevel
            l.append(res)
        return self.mergeText(l)

    # 生成章节列表
    def genChapters(self, chapters):
        ds = []
        for chapter in chapters:
            if self.isNewNode(chapter) and (
                    chapter['type'] != 'Title' and chapter['type'] != '标题'):
                ds.append(["chapter", "chapter_" + str(chapter['number']), chapter['text']])
                continue
            if self.isNewNode(chapter) and self.isTitle(chapter):
                ds.append(["chapter", "chapter_" + str(chapter['number']), chapter['text']])

        return ds
        # 判断是不是新的章节，除了版权声明和概述之前的都是title章节

    def isTitle(self, res):
        typeName = res['type']
        text = res['text']
        if (typeName == '标题' or typeName == "Title") and (
                not (text == '前言' or text == '前 言' or text == '版权声明')):
            return True
        return False
    
    def isNewNode(self, res):
        if (res['type'].startswith("Heading") or res['type'].startswith("标题")
                or res['type'] == 'Title'):
            return True
        return False
    
    #  将文档中的相同的级别的正文段落合并成一个
    def mergeText(self, chapters):
        newChapters = list()
        mergeList = list()
        for chapter in chapters:
            if not self.isNewNode(chapter):
                mergeList.append(chapter)
            else:
                if len(mergeList) > 0:
                    newChapters.append(self.mergeChapters(mergeList))
                    mergeList = list()
                newChapters.append(chapter)
        if len(mergeList) > 0:
            newChapters.append(self.mergeChapters(mergeList))
        return newChapters
    
    # 将curChapter的内容合并到preChapter
    def mergeChapters(self, chapters):
        mergeChild = chapters[0]
        mergeChild['type'] = 'merge'
        for curChapter in chapters:
            if curChapter['type'] == '目录' or curChapter['type'].startswith(
                    'toc'):
                continue
            if mergeChild['number'] == curChapter['number']:
                continue
            mergeChild['text'] = mergeChild['text'] + "\n" + curChapter['text']
        return mergeChild
    
    # 软件
    def genSoftware(self, file_name):
        ds = []
        softwareNames = sortedSoftware
        
        start = 0
        end = len(file_name)
        
        for name in softwareNames:
            while (end > start):
                index = file_name.find(name, start, end)
                if index < 0:
                    break
                else:
                    ds.append(name)
                    start += (index + len(name))
        return ds
    
    # document 分类
    def genCategory(self, file_name):
        for cname in sortedCategory:
            if cname in file_name:
                return cname
        return ''
    
    # 软件版本
    def genVersion(self, file_name, software):
        ds = []
        rep = r'\s*\d+(.\d+)*'
        softwareNames = [s for s in software]
        for name in softwareNames:
            name = name.strip(' ')
            if name == '':
                continue
            if name in file_name:
                versionGropup = re.search(rep, file_name)
                if versionGropup:
                    version = versionGropup.group()
                    version = version.strip(' \n')
                    nameVersion = '{0} {1}'.format(name, version)
                    ds.append(nameVersion)
        return ds
    
    # 标签
    def genLabel(self, file_name):
        ds = []
        labelNames = list(labels.keys())
        for name in labelNames:
            if name in file_name:
                ds.append(name)
        return ds
    
    # 正文列表
    def genDocumentText(self, chapter):
        ds = []
        for chapter in chapter:
            if chapter['type'] == 'merge':
                ds.append([chapter['number'], chapter['text']])
        return ds
    
    # 生成csv目录
    def getCategroy(self, chapter):
        cs = []
        for item in chapter:
            if self.isNewNode(item):
                cs.append(item['text'])
        return '\n'.join(cs)
    
    # 文档的组成部分
    def genDocComponent(self, categroy, document, chapters, chapters_struc):
        ds = []
        # 目录: id,name,categroy,content
        ds.append([categroy[1], '目录', '目录', categroy[-1]])
        
        # 章节:id,name,categroy,content=""
        for chapter in chapters:
            ds.append([chapter[1], chapter[2], '章节', ""])
        
        # 正文
        self.merge(chapters_struc)
        chapters = self.addParentIndex(chapters_struc)
        # document = document[0]
        for chapter in chapters:
            if self.isNewNode(chapter):
                continue
            if str(chapter['text']).strip('\n') == '':
                continue
            parentIndex = chapter['parentIndex']
            # 文档的正文
            if parentIndex < 0:
                ds.append(
                    ["component_" + str(chapter['number']), document.get("docTitle"), '正文', chapter['text']])
            # 章节的正文
            if parentIndex >= 0:
                parentChapter = chapters[parentIndex]
                ds.append([
                    "component_" + str(chapter['number']), parentChapter['text'], '正文', chapter['text']
                ])
        return ds
    
    def merge(self, chapters):
        # 最高级的状态
        topLevel = 10
        lowLevel = chapters[0]['level']
        for chapter in chapters:
            if chapter['level'] < topLevel:
                topLevel = chapter['level']
            if chapter['level'] > lowLevel:
                lowLevel = chapter['level']
        self.topLevel = topLevel
        self.lowLevel = lowLevel
        
        # 确定每个章节的父节点
        chapters = self.addParentIndex(chapters)
        
        # 从底层开始，合并成树
        level = self.lowLevel
        while (level >= topLevel):
            for i, chapter in enumerate(chapters):
                curParentIndex = chapter['parentIndex']
                if curParentIndex < 0:
                    continue
                parentChapter = chapters[curParentIndex]
                if chapter['level'] == level:
                    l = parentChapter['chapters']
                    l.append(chapter)
                    if (not self.isNewNode(chapter)
                    ) and self.isNewNode(parentChapter):
                        parentChapter['chapters'] = [
                            self.mergeChapters(l)
                        ]
            level -= 1
        
        # 删除非顶层结构
        result = list()
        for i, chapter in enumerate(chapters):
            if chapter['parentIndex'] == -1:
                result.append(chapter)
        
        return result
    
    def addParentIndex(self, chapters):
        topLevel = self.topLevel
        
        preParentIndex = -1
        preLevel = 0
        for index, chapter in enumerate(chapters):
            if chapter['text'] == '配置网络':
                print(chapter)
            # 根节点标记
            curLevel = chapter['level']
            if index == 0 or chapter['level'] == topLevel:
                chapter['parentIndex'] = -1
            else:
                if curLevel > preLevel:
                    chapter['parentIndex'] = index - 1
                if curLevel == preLevel:
                    chapter['parentIndex'] = preParentIndex
                if curLevel < preLevel:
                    chapter['parentIndex'] = self.findParentIndex(chapters, index)
            preParentIndex = chapter['parentIndex']
            preLevel = chapter['level']
        return chapters
    
    def findParentIndex(self, chapters, index):
        chapter = chapters[index]
        preChapter = chapters[index - 1]
        while (chapter['level'] != preChapter['level']):
            preChapter = chapters[preChapter['parentIndex']]
        return preChapter['parentIndex']
    
    # 生成关系对象
    def genRelationObj(self):
        ds = []
        ds.append(('1', '文档是'))
        ds.append(('2', '版本是'))
        ds.append(('3', '升级版本是'))
        ds.append(('4', '适用版本'))
        ds.append(('5', '标签是'))
        ds.append(('6', '组成部分是'))
        ds.append(('7', '子章节'))
        ds.append(('8', '引用'))
        ds.append(('9', '正文是'))
        return ds
    
    # 获取文档的信息
    def get_doc_info(self, file_name, doc_info):
        meteInfo = {}
        keys = ["gns", "name", "docFormat", "docPath", "docSize", "docCreatedTime",
                "docUpdatedTime", "docLabel", "docLink", "docAuthor", "docVersion", "docTitle", "ds_id"]
        
        for key in keys:
            meteInfo[key] = doc_info.get(key, "")
        meteInfo["docClassify"] = self.genCategory(file_name)
        return meteInfo
    
    def entity_value_conver2spo(self, entity_name, pros2value):
        spo = {}
        spo["subject"] = entity_name
        spo["property"] = pros2value
        return spo
    
    def list2spo(self, entity_name, pros, values):
        spo = {}
        if len(pros) != len(values):
            return spo
        spo["subject"] = entity_name
        pro2value = dict(zip(pros, values))
        spo["property"] = pro2value
        return spo
    
    def edge_convert2spo(self, subject, subject_dict, predicate, object, object_dict):
        spo = {}
        spo["subject"] = subject
        spo["predicate"] = predicate
        spo["object"] = object
        spo["subject_pro"] = subject_dict
        spo["object_pro"] = object_dict
        return spo
    
    def genNewRelation(self, chapters):
        chapters = self.merge(chapters)
        
        ds = []
        
        # 软件的文档是xxx
        for software in self.softwareName:
            # ds.append([
            #     software, 'documentIs', self.document_meteInfo.get("gns"), self.document_meteInfo.get("name"),
            # ])
            ds.append({"s_pro": {"name": software},
             "predicate": "documentIs",
             "o_pro": {"name": self.document_meteInfo.get("name"), "gns": self.document_meteInfo.get("gns")}
             })
        
        # 软件的版本
        rep = r'\s*\d+(.\d+)*'
        for version in self.versionName:
            versionGropup = re.search(rep, version)
            if versionGropup:
                versionStr = versionGropup.group()
                softwareName = version.split(versionStr)[0]
                softwareName = softwareName.strip()
                
                for software in self.softwareName:
                    if softwareName in software:
                        # ds.append([
                        #     software, 'versionIS', version
                        # ])
                        ds.append({"s_pro": {"name": software},
                                   "predicate": "versionIS",
                                   "o_pro": {"name": version}
                                   })
                        # 文档适用的版本
                        # ds.append([
                        #     self.document_meteInfo.get("gns"), self.document_meteInfo.get("name"), 'matchVersion', version
                        # ])
                        ds.append({"s_pro": {"name": self.document_meteInfo.get("name"), "gns": self.document_meteInfo.get("gns")},
                                   "predicate": "matchVersion",
                                   "o_pro": {"name": version}
                                   })
        
        # 组成部分是
        for com in self.docComponent:
            # ds.append([self.document_meteInfo.get("gns"), self.document_meteInfo.get("name"), 'docComponentIs', com[0], com[1]])
            ds.append(
                {"s_pro": {"name": self.document_meteInfo.get("name"), "gns": self.document_meteInfo.get("gns")},
                 "predicate": "docComponentIs",
                 "o_pro": {"name": com[1], "docComponentId": com[0]}
                 })
        
        # 标签是
        for label in self.labels:
            # ds.append(
            #     [self.document_meteInfo.get("gns"), self.document_meteInfo.get("name"), 'labelIs', label])
            ds.append(
                {"s_pro": {"name": self.document_meteInfo.get("name"), "gns": self.document_meteInfo.get("gns")},
                 "predicate": "labelIs",
                 "o_pro": {"name": label}
                 })
        # 章节是
        for chapter in chapters:
            if len(chapter['chapters']) > 0:
                ds.extend(self.getNewChapterRelation(chapter))
        return ds
    
    def getNewChapterRelation(self, chapter):
        ds = []
        for curChapter in chapter['chapters']:
            if curChapter['type'] == 'merge':
                # 章节的正文
                
                # ds.append(
                    # ('component_{0}'.format(chapter['number']), chapter["name"],  'docComponentText',
                    #  'component_{0}'.format(curChapter['number']), curChapter["name"]))
                ds.append(
                    {"s_pro": {"name": chapter["text"], "docComponentId": 'component_{0}'.format(chapter['number'])},
                     "predicate": "docComponentText",
                     "o_pro": {"name": curChapter["text"], "docComponentId": 'component_{0}'.format(curChapter['number'])}
                     })
            if not curChapter['type'] == 'merge':
                # 章节的子章节
                # ds.append(
                #     ('component_{0}'.format(chapter['number']), chapter["name"], 'childChapter',
                #      'component_{0}'.format(curChapter['number']), chapter["name"]))
                ds.append(
                    {"s_pro": {"name": chapter["text"], "docComponentId": 'component_{0}'.format(chapter['number'])},
                     "predicate": "childChapter",
                     "o_pro": {"name": curChapter["text"], "docComponentId": 'component_{0}'.format(curChapter['number'])}
                     })
                ds.extend(self.getNewChapterRelation(curChapter))
        return ds
    
    def get_elements(self, doc_url, doc_info):
        try:
            file_name = doc_info.get("name", "")
            spos = []
            # 软件
            self.softwareName = self.genSoftware(file_name)
            for software in self.softwareName:
                spos.append(self.list2spo("software", ["name"], [software]))
            # 软件版本
            self.versionName = self.genVersion(file_name, self.softwareName)
            for version in self.versionName:
                spos.append(self.list2spo("version", ["name"], [version]))
            # 文档
            self.document_meteInfo = self.get_doc_info(file_name, doc_info)
            spos.append(self.entity_value_conver2spo("document", self.document_meteInfo))
            # 标签
            self.labels = self.document_meteInfo.get("docLabel", [])
            for label in self.labels:
                spos.append(self.list2spo("label", ["name"], [label]))
                
            chapters_struc = self.parseChapter(doc_url)
            # 目录
            catalog = ["catalogue", "catalogue_" + str(self.__id), self.getCategroy(chapters_struc)]
            # 章节
            chapters = self.genChapters(chapters_struc)
           
            # 正文
            # text = self.genDocumentText(chapters)
            
            # docComponent 关系
            self.docComponent = self.genDocComponent(categroy=catalog, document=self.document_meteInfo, chapters=chapters,
                                                     chapters_struc=chapters_struc)
            component_pros = ["docComponentId", "name", "docComponentClassify", "docComponentContent"]
            for component in self.docComponent:
                spos.append(self.list2spo("docComponent", component_pros, component))
            res = self.genNewRelation(chapters_struc)
            
            spos.extend(res)
            return spos
        except Exception as e:
            Logger.log_error("AR model get elements error: {}".format(repr(e)))
 
 
docx_parse = DocxParse()
