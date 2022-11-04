import os
import sys
from os import path

import pytest
from datasets import load_dataset, DatasetInfo, Dataset

from DataTransform.DataflowDatasetDict import DataflowDatasetDict

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

# 读取数据集
DESCRIPTION = '''文档与搜索语句对应关系数据集,作者：爱数 AnyDATA全体人员'''
HOMEPAGE = '''https://www.aishu.cn/?utm_source=BrandZone&utm_medium=CPT&utm_campaign=Title'''
LICENSE = '''Apache 2'''
VERSION = '1.0.0'
dataset_info = DatasetInfo(
    description=DESCRIPTION,
    homepage=HOMEPAGE,
    license=LICENSE,
    version=VERSION
)

dict_test = {'doc_id': [140, 141, 142, 143, 144, 145, 146, 147, 148],
             'doc_path': ["公司产品知识库/04.AnyRobot Family/AnyRobot Family 3/11-生态转售产品介绍/01-听云生态合作/4-听云解决方案/在线教育",
                          "公司产品知识库/03.AnyShare Family/历史归档/2-AnyShare 5.0 归档资料/AnyShare 5.0 产品资料/0-AnyShare 5.0 "
                          "产品发布资料/9-AnyShare5.0.11产品资料/英文/1-DataSheet",
                          "公司产品知识库/02.AnyBackup Family/AnyStorage/AnyStorage 7.0/AnyStorage 7 "
                          "AS5000/08-产品硬件规格/AS5000",
                          "公司产品知识库/02.AnyBackup Family/AnyStorage/AnyStorage 7.0/AnyStorage 7 GX/09-产品使用手册",
                          "公司产品知识库/03.AnyShare Family/历史归档/3-AnyShare 6.0 归档资料/AnyShare Universal/AnyShare "
                          "Universal 6.0.9/09.产品使用手册",
                          "公司产品知识库/02.AnyBackup Family/AnyStorage/归档材料/AnyStorage 5.0/AnyStorage GX 5.0/02-产品方案",
                          "公司产品知识库/03.AnyShare Family/历史归档/2-AnyShare 5.0 归档资料/AnyShare 5.0 产品资料/0-AnyShare 5.0 "
                          "产品发布资料/7-AnyShare5.0.9产品资料/中文/02-产品配置",
                          "公司产品知识库/03.AnyShare Family/历史归档/3-AnyShare 6.0 归档资料/AnyShare Universal/AnyShare "
                          "Universal 6.0.7/19.产品实施指导",
                          "公司产品知识库/02.AnyBackup Family/AnyStorage/MDC运营材料/医疗行业/医疗行业会议及政策材料/2018 贵州医疗会议材料"],
             'tag_type': ["开发集", "开发集", "开发集", "开发集", "开发集", "开发集", "开发集", "开发集", "开发集"],
             'doc_name': ["行业解决方案-在线教育-V1.0-20200205", "EISOO AnyShare Datasheet", "AnyStorage 7 AS5000 彩页",
                          "AnyStorage 7 GX存储虚拟化网关--GX2020产品使用手册-V1.0", "CIFS快速配置指南", "爱数GX存储虚拟化网关同机房双活数据中心解决方案-V1.0",
                          "AnyShare5.0产品配置指南", "AnyShare Universal 6.0.7安装部署手册", "李小虎  审视信息技术对人的自我异化—避免信息化导致的医疗安全"],
             'doc_type': [".pptx", ".docx", ".pdf", ".docx", ".pdf", ".docx", ".pptx", ".docx", ".pdf"],
             'query': ["在线教育行业时代背景|在线教育行业提升用户体验方案|听云在线教育客户案例|云课堂在线教育性能监测与保障|在线教育应用系统优化和质量保障",
                       "EISOO AnyShare a source file sync an sharing platform | EISOO AnyShare manage and control "
                       "unstructured data | EISOO AnyShare can sharing and collabora tion| anyshare for enterprise "
                       "| anyshare for education | anyshare for services and government",
                       "AnyStorage 7 智能数据存储产品优势|AnyStorage 7 智能数据存储产品规格|AnyStorage 7 智能数据存储域数据保护",
                       "AnyStorage 7 GX存储虚拟化网关GX配置 | AnyStorage 7存储虚拟化配置GX双激活集群服务器| AnyStorage 7存储虚拟化配置远程服务器| "
                       "AnyStorage 7存储虚拟化CDP配置|AnyStorage 7存储虚拟化SNAPSHOT快照配置|AnyStorage 7存储虚拟化业务系统|AnyStorage "
                       "7存储虚拟化日志、性能维护",
                       "快速完成AnyShare Universal 的 CIFS 配置 | GIFS 配置描述 | GIFS "
                       "共享配置数据准备|配置GIFS共享步骤|GIFS配置在Windows客户端访问共享目录",
                       "数据及混合IT环境整合面临的调整体现储存容灾的必要性IT爱数GX存储虚拟化网关同机房双活数据中心概述|爱数GX存储虚拟化网关与容灾技术介绍|GX"
                       "存储双活数据中心详细设计|爱数智能数据管理公司",
                       "AnyShare5.0产品简介| AnyShare5.0产品模块简介|一体机版本配置说明及关联和配件模块介绍|AnyShare软件版本配置|AnyShare "
                       "虚拟化版本配置说明|AnyShare软件版本与虚拟化版本的区别",
                       "安装AnyShare Universal 的环境准备| AnyShare Universal支持灵活的组网方案|安装AnyShare "
                       "Universal的实施步骤和流程|安装AnyShare Universal软件包的操作步骤|AnyShare Universal初始化部署",
                       "盲目认同和过度依赖技术| 信息化与医疗安全|医疗技术危害案例|人在“人-人造物-环境”系统的影响"],

             }

dataset1 = Dataset.from_dict(dict_test, split='test1')
dataset2 = Dataset.from_dict(dict_test, split='test2')
dataset_dict = DataflowDatasetDict({'test1': dataset1, 'test2': dataset2})

print("load dataset_dict")
for k in dataset_dict:
    dataset_dict[k].info.update(dataset_info)
print(dataset_dict)
print(dataset_dict['test1'].info)
sample_path = path.join(path.dirname(path.dirname(path.abspath(__file__))), 'sample_data')
dev_small = path.join(sample_path, 'dev', 'dev_small.csv')
test_small = path.join(sample_path, 'test', 'test_small.csv')
domain_data_test_files = {"domain": dev_small, "other": test_small}
domain_dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=domain_data_test_files))


@pytest.fixture()
def dataset_dict_test():
    return dataset_dict


@pytest.fixture()
def domain_dataset_dict_test():
    return domain_dataset_dict

@pytest.fixture()
def dir_test():
    import os
    dir_path = '/mnt/sdb3/yq/doc-parser/data/docs/dev'  # 文件类型仅为pdf, txt, docx

    # 获取dir下文件
    files_list = os.listdir(dir_path)

    # 生成DataflowDatasetDict
    files_path = [os.path.join(dir_path, file) for file in files_list]
    dataset = Dataset.from_dict({'files_path': files_path})
    dataset_dict = DataflowDatasetDict({'test': dataset})

    return dataset_dict