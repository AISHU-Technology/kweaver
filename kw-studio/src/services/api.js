const baseBuilder = '/api/builder/v1';
const baseKnBuilder = '/api/kn-builder/v1';
const baseEngine = '/api/engine/v1';
const baseManager = '/api/manager/v1';
const baseDataIo = '/api/data-io/v1';
const baseRbac = '/api/rbac/v1';
const baseAuth = '/api/data-auth/v1';
const baseAlgServer = '/api/alg-server/v1';
const baseCognitive = '/api/cognitive-service/v1';
const baseSearch = '/api/cognition-search/v1';
const baseSearchEngine = '/api/search-engine/v1';
const baseIntention = '/api/cognition-search/v1';
const baseIntentionPool = '/api/intention-pool/v1';
// kg-user-rbac提供服务
const baseDBApi = '/api/cognition_api';
const baseThird = '/api/third-party/v1';
// 模型工厂
const baseMF = '/api/model-factory/v1';
// 字典管理
const baseEventStats = '/api/eventStats/v1';
const baseAppManage = '/api/app-manager/v1';

const API = {
  // configSys
  getLDAP: `${baseManager}/ldap/server/config`,
  saveLDAP: `${baseManager}/ldap/server/config`,
  accessTest: `${baseManager}/ldap/server/test`,
  searchUser: `${baseManager}/ldap/server/user`,
  synchronization: `${baseManager}/ldap/user/insert`,

  // createEntity
  getSource: `${baseBuilder}/onto/ds`,
  getDataList: `${baseBuilder}/onto/gettabbydsn`,
  getOtherPreData: `${baseBuilder}/onto/previewdata`,
  getChildrenFile: `${baseBuilder}/onto/dirlist`,
  submitExtractTask: `${baseBuilder}/onto/auto/autogenschema`,
  fetchModelList: `${baseBuilder}/onto/modellist`,
  getFlowSource: `${baseBuilder}/graph/getdsbygraphid`,
  changeFlowData: `${baseBuilder}/graph/`,
  getModelPreview: `${baseBuilder}/onto/modelspo`,
  unstructuredData: `${baseBuilder}/onto/getmodelotl`,
  buildTask: `${baseBuilder}/onto/task/build_task`,
  getEntityTasks: `${baseBuilder}/onto/task/gettaskinfo`,
  deleteEntityTask: `${baseBuilder}/onto/task/deletetask`,
  getTaskFiles: `${baseBuilder}/onto/task/get_task_files`,
  delAllEntityTask: `${baseBuilder}/onto/task/deletealltask`,
  changeEntityTent: `${baseBuilder}/onto/updatename/`,
  updateEntity: `${baseBuilder}/onto/updateinfo/`,
  getExtractTask: `${baseBuilder}/onto/info/extract_task`,
  getHivePartition: `${baseBuilder}/ds/hive/partitions`,
  previewPartition: `${baseBuilder}/ds/hive/partition_case`,
  checkPartition: `${baseBuilder}/ds/hive/partition_infos/check`,
  getVectorServiceStatus: `${baseBuilder}/onto/vector/vector_service_status`,

  // 流程四-知识抽取-sql抽取相关接口
  /** sql抽取预览数据 */
  getSqlExtractPreview: `${baseBuilder}/onto/sql/previewdata`,
  /** sql抽取 */
  sqlExtract: `${baseBuilder}/onto/sql/extract`,
  // 本体库
  addEntity: `${baseBuilder}/onto/saveontology`,
  delEntity: `${baseBuilder}/onto/deleteontology`,
  editEntity: otl_id => `${baseBuilder}/onto/editontology/${otl_id}`,
  downloadEntityTemplate: `${baseBuilder}/onto/template`,
  exportEntity: `${baseBuilder}/onto/export`,
  importEntity: `${baseBuilder}/onto/import_task`,
  getEntityImportStatus: `${baseBuilder}/onto/import_task`,
  getAllNoumenon: `${baseBuilder}/onto/getotl`,
  updateName: otl_id => `${baseBuilder}/onto/updatename/${otl_id}`,
  getEntityInfo: otl_id => `${baseBuilder}/onto/${otl_id}`,

  // dataSource
  sourceConnectTest: `${baseBuilder}/ds/testconnect`,
  dataSourcePost: `${baseBuilder}/ds`,
  postCopyDs: `${baseBuilder}/ds/ds_copy`,
  dataSourceGet: `${baseBuilder}/ds`,
  dataSourceGetByGraph: `${baseBuilder}/graph/ds/`,
  dataSourcePut: `${baseBuilder}/ds/`,
  dataSourceDelete: `${baseBuilder}/ds/delbydsids`,
  getDsByName: `${baseBuilder}/ds/searchbyname`,
  asAuthGet: `${baseBuilder}/ds/Auth`,
  asAuthPost: `${baseBuilder}/ds/gettoken`,
  // 领域数据表预览
  previewdata: `${baseBuilder}/ds/previewdata`,
  //  领域数据sql查询
  dataSourceSql: `${baseBuilder}/ds/sql`,
  // 获取表的各字段及其字段类型接口
  getTableField: `${baseBuilder}/ds/table_field`,
  // explore
  /** 获取分析报告 */
  analysisReportGet: `${baseEngine}/analysis`,
  /** 探索分析展开实体点 */
  expandEdges: `${baseEngine}/explore/expandv`,
  /** 探索两点之间的路径的详细信息 */
  explorePathDetails: `${baseEngine}/explore/pathDetail`,
  /** 探索两点之间的路径  ${API.explorePath}/${data.kg_id}/path*/
  /** 查询点的进出边数量接口 */
  getAllProperties: `${baseAlgServer}/explore/kgs`,
  /** 快速查找, 搜索联想 */
  quickSearch: `${baseAlgServer}/graph-search/kgs`,

  // 图分析新接口 algServer --> engine
  explorePath: kg_id => `${baseEngine}/graph-explore/kgs/${kg_id}/paths`,
  getNeighbors: kg_id => `${baseEngine}/graph-explore/kgs/${kg_id}/neighbors`,
  exploreSearchE: kg_id => `${baseEngine}/graph-explore/kgs/${kg_id}/expandv`,

  // knowledgeNetwork
  graphOutput: `${baseBuilder}/graph/output`,
  graphInput: `${baseBuilder}/graph/input`,
  knowledgeNetGet: `${baseBuilder}/knw/get_all`,
  knowledgeNetGetByName: `${baseBuilder}/knw/get_by_name`,
  knowledgeNetCreate: `${baseBuilder}/knw/network`,
  knowledgeNetEdit: `${baseBuilder}/knw/edit_knw`,
  knowledgeNetDelete: `${baseBuilder}/knw/delete_knw`,
  graphGetByKnw: `${baseBuilder}/knw/get_graph_by_knw`,
  getSysConfig: `${baseBuilder}/knw/sys_info`,

  // graphDetail
  /** 获取图谱本体信息 */
  graphGetInfoOnto: `${baseBuilder}/graph/info/onto`,
  /** 获取图谱基本信息 */
  graphGetInfoBasic: `${baseBuilder}/graph/info/basic`,
  /** 获取图谱的数量信息 */
  graphGetInfoCount: `${baseBuilder}/graph/info/count`,
  /** 获取图谱中的点或边的配置详情 */
  graphGetInfoDetail: `${baseBuilder}/graph/info/detail`,

  // searchConfig 认知搜索
  addAdvConfig: `${baseEngine}/adv-search-config`,
  updateAdvConfig: `${baseEngine}/adv-search-config/update`,
  deleteAdvConfig: `${baseEngine}/adv-search-config`,
  fetchConfigGraph: `${baseEngine}/adv-search-config/kglist`,
  fetchConfig: `${baseEngine}/adv-search-config/info`,
  fetchConfigList: `${baseEngine}/adv-search-config`,
  advSearchV2: `${baseEngine}/adv-search`,
  advSearchTestV2: `${baseEngine}/adv-search/test`,
  entityPropertiesGet: `${baseEngine}/properties`,
  fetchCanvasData: `${baseBuilder}/onto/getbykgid`,

  // storageManagement
  graphDBGetById: `${baseManager}/graphdb`,
  graphDBCreate: `${baseManager}/graphdb/add`,
  graphDBDelete: `${baseManager}/graphdb/delete`,
  graphDBUpdate: `${baseManager}/graphdb/update`,
  graphDBTest: `${baseManager}/graphdb/test`,
  graphDBGetGraphById: `${baseManager}/graphdb/graph/list`,
  openSearchGet: `${baseManager}/opensearch/list`,
  openSearchGetById: `${baseManager}/opensearch`,
  openSearchCreate: `${baseManager}/opensearch/add`,
  openSearchDelete: `${baseManager}/opensearch/delete`,
  openSearchUpdate: `${baseManager}/opensearch/update`,
  openSearchTest: `${baseManager}/opensearch/test`,

  // taskManagement
  taskGet: `${baseBuilder}/task`,
  taskCreate: `${baseBuilder}/task`,
  taskStop: `${baseBuilder}/task/stoptask`,
  taskDelete: `${baseBuilder}/task/delete`,
  taskGetProgress: `${baseBuilder}/task/get_progress`,
  graphDelByIds: `${baseBuilder}/graph/delbyids`,
  taskPerform: `${baseBuilder}/task`,

  // timedTask
  timerGet: `${baseBuilder}/timer`,
  timerGetInfo: `${baseBuilder}/timer/info`,
  timerDelete: `${baseBuilder}/timer/delete`,
  timerCreate: `${baseBuilder}/timer/add`,
  timerUpdate: `${baseBuilder}/timer/update`,
  timerSwitch: `${baseBuilder}/timer/switch`,

  // uploadKnowledge
  uploadServiceGet: `${baseDataIo}/uploadServiceList`,
  uploadServiceCreate: `${baseDataIo}/uploadServiceList/add`,
  uploadServiceUpdate: `${baseDataIo}/uploadServiceList/update`,
  uploadServiceDelete: `${baseDataIo}/uploadServiceList/delete`,
  uploadServiceTaskGet: `${baseDataIo}/uploadServiceTask`,
  uploadKnowledge: `${baseDataIo}/uploadServiceTask`,
  taskGetRelationKN: `${baseDataIo}/task/knowledgeNetwork`,
  uploadContinue: `${baseDataIo}/uploadServiceTask/continue`,
  graphToUpload: `${baseBuilder}/graph/to_be_uploaded`,

  // userManagement
  registrationGet: `${baseManager}/registration`,
  registrationPost: `${baseManager}/registration`,
  userListGet: `${baseRbac}/user/list`,

  // workflow
  graphGet: `${baseBuilder}/graph`,
  graphEdit: `${baseBuilder}/graph`,
  graphCreate: `${baseBuilder}/graph`,
  graphSaveNoCheck: `${baseBuilder}/graph/savenocheck`,
  graphCheckKmApInfo: `${baseBuilder}/graph/check_kmapinfo`,
  graphGetExtract: `${baseBuilder}/graph/info/graph_InfoExt`,
  graphGetInfoExt: `${baseBuilder}/graph/graph_InfoExt/graphid`,
  performTask: `${baseBuilder}/task`,

  // thesaurus
  thesaurusList: `${baseBuilder}/lexicon/getall`,
  thesaurusInfoBasic: `${baseBuilder}/lexicon/getbyid`,
  thesaurusCreate: `${baseBuilder}/lexicon/create`,
  thesaurusLabelList: `${baseBuilder}/lexicon/labels`,
  thesaurusExport: `${baseBuilder}/lexicon/export`,
  thesaurusEdit: `${baseBuilder}/lexicon/edit`,
  thesaurusDelete: `${baseBuilder}/lexicon/delete`,
  thesaurusImportWords: `${baseBuilder}/lexicon/import_words`,
  thesaurusInsertWords: `${baseBuilder}/lexicon/insert`,
  thesaurusSearchWords: `${baseBuilder}/lexicon/search`,
  thesaurusEditWords: `${baseBuilder}/lexicon/edit_words`,
  thesaurusDeleteWords: `${baseBuilder}/lexicon/delete_words`,
  downloadTemplate: `${baseBuilder}/lexicon/template`,
  thesaurusTemplateLexicon: `${baseBuilder}/lexicon/create/template_lexicon`,
  thesaurusBuild: `${baseBuilder}/lexicon/build_task`,

  // 术语库
  glossary: `${baseBuilder}/taxonomy`,

  // permission
  rbacAuth: `${baseRbac}/auth`,

  // admin source management
  getSourceInfo: `${baseRbac}/permission`,
  addSource: `${baseRbac}/permission/add`,
  updateSource: `${baseRbac}/permission/update`,
  deleteSource: `${baseRbac}/permission/delete`,

  // data-auth
  dataPermissionAssign: `${baseAuth}/data-permission/assign`,
  dataPermissionAssignBuilder: `${baseBuilder}/data-permission/assign`, // builder服务的权限指定
  dataPermissionGetList: `${baseAuth}/data-permission/list`,
  dataUserList: `${baseAuth}/user/list`,

  // rbac system/user
  systemGetConfiguration: `${baseRbac}/system/configuration`,
  systemUpdateConfiguration: `${baseRbac}/system/configuration`,
  systemGetSmtp: `${baseRbac}/system/smtp`,
  systemUpdateSmtp: `${baseRbac}/system/smtp`,
  systemTestMail: `${baseRbac}/system/testmail`,
  userAppId: `${baseRbac}/user/appId`,
  userLoginAppId: `${baseRbac}/user/login/appId`,
  userResetPassword: `${baseRbac}/user/password/reset`,
  userUpdatePassword: `${baseRbac}/user/password/update`,
  userUpdatePasswordConfig: `${baseRbac}/user/password/config`,
  queryUsersName: `${baseRbac}/user/list_by_ids`,

  // role
  roleListGet: `${baseRbac}/role/list`,
  roleAdd: `${baseRbac}/role/add`,
  roleDelete: `${baseRbac}/role/delete`,
  roleUpdate: `${baseRbac}/role/update`,
  bindPermission: `${baseRbac}/role/bindPermission`,
  listPermission: `${baseRbac}/role/listPermission`,
  listMember: `${baseRbac}/role/listMember`,
  addMember: `${baseRbac}/role/addMember`,
  rmMember: `${baseRbac}/role/rmMember`,

  // auth
  userGetList: `${baseRbac}/user/list`,
  userAdd: `${baseRbac}/user/add`,
  userUpdate: `${baseRbac}/user/update`,
  passwordReset: `${baseRbac}/user/password/reset`,
  userDelete: `${baseRbac}/user/delete`,
  statusUpdate: `${baseRbac}/user/status/update`,

  // intelligence
  intelligenceCalculate: `${baseBuilder}/graph/intelligence/task`,
  intelligenceGetByKnw: `${baseBuilder}/knw/intelligence`,
  intelligenceGetByGraph: `${baseBuilder}/graph/intelligence`,

  // subgraph
  subgraphGetList: `${baseBuilder}/graph/subgraph`,
  subgraphInfoDetail: `${baseBuilder}/graph/subgraph`,
  subgraphRunTask: `${baseBuilder}/task/batch`,
  subgraphHistoryDetail: `${baseBuilder}/task/subgraph`,
  subgraphAdd: `${baseBuilder}/graph/subgraph`,
  subgraphEdit: `${baseBuilder}/graph/subgraph/edit`,
  subgraphDelete: `${baseBuilder}/graph/subgraph/delete`,
  subgraphSave: `${baseBuilder}/graph/subgraph/savenocheck`,

  // visualAnalysis
  visualAnalysisList: `${baseAlgServer}/canvases/knws`,
  visualGetCanvasInfoById: `${baseAlgServer}/canvases`,
  visualGraphList: `${baseAlgServer}/canvases/knws`,
  visualAnalysisAdd: `${baseAlgServer}/canvases`,
  visualAnalysisUpdate: `${baseAlgServer}/canvases`,
  visualAnalysisDelete: `${baseAlgServer}/canvases/delete`,

  // 图分析新接口 algServer --> engine
  fullTestRetrieval: kg_id => `${baseEngine}/basic-search/kgs/${kg_id}/full-text`,
  vidRetrieval: kg_id => `${baseEngine}/basic-search/kgs/${kg_id}/vids`,
  eidRetrieval: kg_id => `${baseEngine}/basic-search/kgs/${kg_id}/edges`,
  customSearch: kg_id => `${baseEngine}/custom-search/kgs/${kg_id}`,
  analysisServiceTest: `${baseEngine}/services/graph-analysis/test`,
  importService: `${baseEngine}/services/import-service/file`,
  serviceInfo: `${baseEngine}/services/info`,
  exportService: service_id => `${baseEngine}/services/graph-analysis/${service_id}/export-service`,
  analysisTemplate: `${baseEngine}/services/export-template`,

  // license
  getDeviceCode: `${baseRbac}/license/deviceCode`,
  licenseAdd: `${baseRbac}/license/add`,
  deleteRemove: `${baseRbac}/license/remove`,
  // getLicenseList: `${baseRbac}/license/list`,
  licenseActivate: `${baseRbac}/license/activate`,
  capacityDetail: `${baseRbac}/license/capacityDetail`,
  graphCountAll: `${baseBuilder}/graphcount`,
  getServiceLicenseStatus: `${baseRbac}/license/getStatus`,

  // function
  functionList: `${baseBuilder}/function/list`,
  functionCreate: `${baseBuilder}/function/create`,
  functionEdit: `${baseBuilder}/function/edit`,
  functionDelete: `${baseBuilder}/function/delete`,
  functionInfo: `${baseBuilder}/function/get_by_id`,

  // analysisService
  /** 图分析服务列表 */
  analysisServiceList: `${baseCognitive}/services/list`,
  /** 创建图分析服务 */
  analysisServiceCreate: `${baseCognitive}/services`,
  /** 获取指定图分析服务 */
  analysisServiceGet: `${baseCognitive}/services`,
  /** 编辑图分析服务 */
  analysisServiceEdit: `${baseCognitive}/services`,
  /** 删除图分析服务 */
  analysisServiceDelete: `${baseCognitive}/services`,
  /** 取消发布服务 */
  analysisServiceCancel: `${baseCognitive}/services`,
  /** 图分析服务测试 */
  // analysisServiceTest: `${baseCognitive}/services/test`,

  // snapshots 快照
  /** 通过 Id 获取指定快照的信息 */
  snapshotsGetById: s_id => `${baseCognitive}/snapshots/${s_id}`,
  /** 获取快照列表 */
  snapshotsGetList: `${baseCognitive}/snapshots/list`,
  /** 新增快照 */
  snapshotsPostCreate: `${baseCognitive}/snapshots`,
  /** 编辑快照 */
  snapshotsPostUpdate: s_id => `${baseCognitive}/snapshots/${s_id}/update`,
  /** 删除快照 */
  snapshotsPostDelete: s_id => `${baseCognitive}/snapshots/${s_id}/delete`,

  // 模型仓库
  /** 开始上传模型协议（覆盖） */
  modelBeginUpload: `${baseKnBuilder}/model/os-begin-upload`,
  /** 模型上传完成协议（覆盖） */
  modelEndUpload: `${baseKnBuilder}/model/os-end-upload`,
  /** 开始上传大模型协议（覆盖） */
  modelInitMultiUpload: `${baseKnBuilder}/model/os-init-multi-upload`,
  /** 大模型分块上传协议（覆盖） */
  modelUploadPart: `${baseKnBuilder}/model/os-upload-part`,
  /** 模块下载协议 */
  modelOsDownload: `${baseKnBuilder}/model/os-download`,
  /** 大模型分块上传完成协议（覆盖） */
  modelCompletePart: `${baseKnBuilder}/model/os-complete-upload`,
  /** 获取模型仓库列表 */
  modelGet: `${baseKnBuilder}/model`,
  /** 获取模型的tags */
  modelGetTags: `${baseKnBuilder}/model/tags`,
  /** 模型删除协议 */
  modelDelete: `${baseKnBuilder}/model/delete`,
  /** 编辑模型仓库 */
  modelUpdate: `${baseKnBuilder}/model/update`,
  /** 服务健康检查 */
  modelHealthReady: `${baseKnBuilder}/health/ready`,
  /** 服务存活检查 */
  modelHealthAlive: `${baseKnBuilder}/health/alive`,
  /** 通过知识网络ID获取模型ID（内部接口） */
  modelGetDetail: knw_id => `${baseKnBuilder}/knw/${knw_id}/model_ids`,
  /** 通过模型ID获取知识网络ID（内部接口） */
  modelGetKnwIdByModelId: model_id => `${baseKnBuilder}/model/${model_id}/knw_id`,
  /** 通过模型ID获取创建者UUID（内部接口） */
  modelGetUUIDByModelId: model_id => `${baseKnBuilder}/model/${model_id}/create_user`,
  /** 判断模型是否存在（内部接口） */
  modelIsExist: model_id => `${baseKnBuilder}/model/${model_id}/exist`,

  // 意图池CognitiveIntention
  getIntentPoolList: `${baseIntentionPool}/intent-pool/get_intentpool_page`,
  addIntentPool: `${baseIntentionPool}/intent-pool/add_intentpool`,
  editIntentPool: `${baseIntentionPool}/intent-pool/get_intentpool`,
  updateIntentPool: `${baseIntentionPool}/intent-pool/update_intentpool`,
  deleteIntentPool: `${baseIntentionPool}/intent-pool/del_intentpool`,
  uploadFile: `${baseIntentionPool}/intent-model/parse_file`,
  exportResult: `${baseIntentionPool}/intent-model/export_reports`,
  downLoadModel: `${baseIntentionPool}/intent-model/export_model`,
  downTemplate: `${baseIntentionPool}/intent-model/export_doc_template`,
  trainModel: `${baseIntentionPool}/intent-model/train_model`,
  testIntentModel: `${baseIntentionPool}/intent-model/test_intent_model`,
  getTrainInfo: `${baseIntentionPool}/intent-model/get_train_info`,
  loadModel: `${baseIntentionPool}/intent-model/load_model`,

  // cognitiveSearch 认知搜索
  cognitiveSearchList: `${baseSearch}/services/list`,
  getStatus: service_id => `${baseSearchEngine}/services/${service_id}/get_status`,
  getInitialization: `${baseSearchEngine}/services/initialization`,
  searchTest: service_id => `${baseSearchEngine}/services/${service_id}/test`,
  searchTactics: service_id => `${baseSearchEngine}/services/${service_id}`,
  createSearch: `${baseSearch}/services`,
  editSearch: service_id => `${baseSearch}/services/${service_id}`,
  cancelPublish: service_id => `${baseSearch}/services/${service_id}/cancel-service`,
  getAppointList: `${baseSearch}/services`,
  deleteSearch: service_id => `${baseSearch}/services/${service_id}/delete-service`,
  kgqaProperty: `${baseSearch}/kgqa/get_property`,
  // 获取有效图谱
  getKgList: knw_id => `${baseSearch}/adv_search/knws/${knw_id}/kglist`,
  openAiTest: `${baseSearchEngine}/services/openai_test`,
  /** 检测外接模型 */
  checkLink: `${baseSearchEngine}/services/em_model_test`,
  /** 解析大模型文件 */
  parseModel: `${baseAppManage}/services/parse_model`,
  /** 下载大模型模板文件 */
  exportModelTemplate: `${baseAppManage}/services/export_model_template`,
  /** 测试大模型 */
  promptTest: `${baseSearchEngine}/prompt/test`,

  // dbapi
  DBApiAdd: `${baseDBApi}/v1/api_config/add`,
  DBApiPublish: `${baseDBApi}/v1/api_config/online`,
  DBApiUnpublish: `${baseDBApi}/v1/api_config/offline`,
  DBApiRemove: `${baseDBApi}/v1/api_config/remove`,
  DBApiList: `${baseDBApi}/v1/api_config/list`,
  DBApiInfo: `${baseDBApi}/v1/api_config/get`,
  // customService
  addCustom: `${baseSearch}/custom-services`,
  updateCustom: service_id => `${baseSearch}/custom-services/${service_id}`,
  initialCustom: `${baseSearchEngine}/custom-services/initialization`,
  getCustomServiceStatus: (service_id, env = '') => {
    if (!env || env === '0') {
      return `${baseSearchEngine}/services/${service_id}/get_status`;
    }
    return `/api/search-engine-${env}/v1/services/${service_id}/get_status`;
  },
  customList: `${baseIntention}/services/list`,
  editCustom: service_id => `${baseIntention}/services/${service_id}`,
  // testCustom: service_id => `${baseSearchEngine}/custom-services/${service_id}/test`,
  testCustom: (service_id, env = '') => {
    if (!env || env === '0') {
      return `${baseSearchEngine}/custom-services/${service_id}/test`;
    }
    return `/api/search-engine-${env}/v1/custom-services/${service_id}/test`;
  },
  usedService: service_id => `${baseSearchEngine}/custom-services/${service_id}`,
  cancelCustomPublish: service_id => `${baseSearch}/services/${service_id}/cancel-service`,
  deleteCustomPublish: service_id => `${baseSearch}/services/${service_id}/delete-service`,
  getTemplate: `${baseSearch}/custom-services/get_template`,
  checkValidity: `${baseSearch}/custom-services/check_validity`,

  // 订阅服务
  /** 获取账号 */
  getSubscribeAccount: `${baseEngine}/subscribe-account`,
  /** 编辑绑定账号 */
  editSubscribeAccount: `${baseEngine}/subscribe-account`,

  // 模型服务
  getModelServiceList: `${baseManager}/mfdeploy/queryPage`,

  // llmModel
  llmModelList: `${baseMF}/llm-source`,
  llmModelConfig: `${baseMF}/llm-param`,
  llmModelTest: `${baseMF}/llm-test`,
  llmModelAdd: `${baseMF}/llm-add`,
  llmModelRemove: `${baseMF}/llm-remove`,
  llmModelGet: `${baseMF}/llm-check`,
  llmModelEdit: `${baseMF}/llm-edit`,
  llmModelUse: model_id => `${baseMF}/llm-used/${model_id}`,
  llmModelDeploy: `${baseMF}/llm-deploy`,
  llmApiDoc: `${baseMF}/llm-api-doc`,

  // prompt
  promptProjectList: `${baseMF}/prompt-item-source`,
  promptProjectAdd: `${baseMF}/prompt-item-add`,
  promptProjectEdit: `${baseMF}/prompt-item-edit`,
  promptProjectRemove: `${baseMF}/prompt-item-remove`,
  promptCategoryAdd: `${baseMF}/prompt-type-add`,
  promptCategoryEdit: `${baseMF}/prompt-type-edit`,
  promptCategoryRemove: `${baseMF}/prompt-type-remove`,
  promptList: `${baseMF}/prompt-source`,
  promptAdd: `${baseMF}/prompt-add`,
  promptDetail: promptId => `${baseMF}/prompt/${promptId}`,
  promptNameEdit: `${baseMF}/prompt-name-edit`,
  promptEdit: `${baseMF}/prompt-edit`,
  promptLLMList: `${baseMF}/prompt-llm-source`,
  promptTemplateGet: `${baseMF}/prompt-template-source`,
  promptDeploy: `${baseMF}/prompt-deploy`,
  promptUndeploy: `${baseMF}/prompt-undeploy`,
  promptRun: `${baseMF}/prompt-run`,
  promptRunStream: `${baseMF}/prompt-run-stream`,
  promptUse: promptId => `${baseMF}/prompt-used/${promptId}`,
  promptCodeGet: `${baseMF}/prompt-code`,
  promptApiDoc: `${baseMF}/prompt-api-doc`,
  promptSnowId: `${baseMF}/get-id`,
  promptDelete: `${baseMF}/delete-prompt`,
  promptMove: `${baseMF}/prompt/move`,
  managePromptEdit: `${baseMF}/prompt-template-edit`,

  // 字典管理
  dictGetList: `${baseEventStats}/dict/list`,
  dictGetInfo: `${baseEventStats}/dict`,
  dictAdd: `${baseEventStats}/dict/add`,
  dictUpdate: `${baseEventStats}/dict/update`,
  dictDelete: `${baseEventStats}/dict/delete`,
  dictGetItemList: `${baseEventStats}/dict/itemList`,
  dictGetItemInfo: `${baseEventStats}/dict/item`,
  dictAddItem: `${baseEventStats}/dict/addItem`,
  dictUpdateItem: `${baseEventStats}/dict/updateItem`,
  dictDeleteItem: `${baseEventStats}/dict/deleteItem`,

  // 菜单管理
  newMenuList: `${baseEventStats}/menu/list`,
  newMenuInfo: `${baseEventStats}/menu`,
  newMenuAdd: `${baseEventStats}/menu/add`,
  newMenuUpdate: `${baseEventStats}/menu/update`,
  newMenuDel: `${baseEventStats}/menu/delete`
};

export { API };
