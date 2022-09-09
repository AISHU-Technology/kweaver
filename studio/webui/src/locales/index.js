/**
 * 整合国际化资源
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/5/9
 */

import global_zh from './global/zh-CN.json';
import login_zh from './login/zh-CN.json';
import title_zh from './title/zh-CN.json';
import graphResult_zh from './graphResult/zh-CN.json';
import graphList_zh from './graphList/zh-CN.json';
import searchGraph_zh from './searchGraph/zh-CN.json';
import datamanagement_zh from './datamanagement/zh-CN.json';
import workflow_zh from './workflow/zh-CN.json';
import createEntity_zh from './createEntity/zh-CN.json';
import userManagement_zh from './userManagement/zh-CN.json';
import taskManagement_zh from './taskManagement/zh-CN.json';
import graphQL_zh from './graphQL/zh-CN.json';
import subscription_zh from './subscription/zh-CN.json';
import expired_zh from './expired/zh-CN.json';
import configSys_zh from './configSys/zh-CN.json';
import searchStrategy_zh from './searchStrategy/zh-CN.json';
import searchConfig_zh from './searchConfig/zh-CN.json';
import memberManage_zh from './member-management/zh-CN.json';
import search_zh from './search/zh-CN.json';
import knowledgeNetwork_zh from './knowledgeNetwork/zh-CN.json';
import uploadService_zh from './uploadService/zh-CN.json';
import graphDetail_zh from './graphDetail/zh-CN.json';

import global_en from './global/en-US.json';
import login_en from './login/en-US.json';
import title_en from './title/en-US.json';
import graphResult_en from './graphResult/en-US.json';
import graphList_en from './graphList/en-US.json';
import searchGraph_en from './searchGraph/en-US.json';
import datamanagement_en from './datamanagement/en-US.json';
import workflow_en from './workflow/en-US.json';
import createEntity_en from './createEntity/en-US.json';
import userManagement_en from './userManagement/en-US.json';
import taskManagement_en from './taskManagement/en-US.json';
import graphQL_en from './graphQL/en-US.json';
import subscription_en from './subscription/en-US.json';
import expired_en from './expired/en-US.json';
import configSys_en from './configSys/en-US.json';
import searchStrategy_en from './searchStrategy/en-US.json';
import searchConfig_en from './searchConfig/en-US.json';
import memberManage_en from './member-management/en-US.json';
import search_en from './search/en-US.json';
import knowledgeNetwork_en from './knowledgeNetwork/en-US.json';
import uploadService_en from './uploadService/en-US.json';
import graphDetail_en from './graphDetail/en-US.json';

const zh_CN = {
  ...global_zh,
  ...login_zh,
  ...title_zh,
  ...graphResult_zh,
  ...graphList_zh,
  ...searchGraph_zh,
  ...datamanagement_zh,
  ...workflow_zh,
  ...createEntity_zh,
  ...userManagement_zh,
  ...taskManagement_zh,
  ...graphQL_zh,
  ...subscription_zh,
  ...expired_zh,
  ...configSys_zh,
  ...searchStrategy_zh,
  ...searchConfig_zh,
  ...memberManage_zh,
  ...search_zh,
  ...knowledgeNetwork_zh,
  ...uploadService_zh,
  ...graphDetail_zh
};

const en_US = {
  ...global_en,
  ...login_en,
  ...title_en,
  ...graphResult_en,
  ...graphList_en,
  ...searchGraph_en,
  ...datamanagement_en,
  ...workflow_en,
  ...createEntity_en,
  ...userManagement_en,
  ...taskManagement_en,
  ...graphQL_en,
  ...subscription_en,
  ...expired_en,
  ...configSys_en,
  ...searchStrategy_en,
  ...searchConfig_en,
  ...memberManage_en,
  ...search_en,
  ...knowledgeNetwork_en,
  ...uploadService_en,
  ...graphDetail_en
};

const locales = {
  'zh-CN': zh_CN,
  'en-US': en_US
};

export default locales;
