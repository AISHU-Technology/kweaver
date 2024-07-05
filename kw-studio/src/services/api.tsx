const baseMF = '/api/model-factory/v1';
const baseEventStats = '/api/eventStats/v1';

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
const baseDBApi = '/api/cognition_api';
const baseAppManage = '/api/app-manager/v1';

const API = {
  /* 大模型接入管理 */
  // 1、获取大模型列表信息接口
  llmModelList: `${baseMF}/llm-source`,
  // 2、新增大模型接口-参数获取
  llmModelConfig: `${baseMF}/llm-param`,
  // 3、大模型测试接口
  llmModelTest: `${baseMF}/llm-test`,
  // 4、新增大模型接口-数据保存
  llmModelAdd: `${baseMF}/llm-add`,
  // 5、删除大模型接口
  llmModelRemove: `${baseMF}/llm-remove`,
  // 6、查看大模型信息接口
  llmModelGet: `${baseMF}/llm-check`,
  // 7、修改大模型配置接口
  llmModelEdit: `${baseMF}/llm-edit`,
  // 8、URL调用接口
  llmModelUse: (model_id: any) => `${baseMF}/llm-used/${model_id}`,

  /* 提示词工程管理 */
  // 1、获取提示词项目列表信息接口
  promptProjectList: `${baseMF}/prompt-item-source`,
  // 2、新建提示词项目接口
  promptProjectAdd: `${baseMF}/prompt-item-add`,
  // 3、编辑提示词项目接口
  promptProjectEdit: `${baseMF}/prompt-item-edit`,
  // 4、新建提示词分组接口
  promptCategoryAdd: `${baseMF}/prompt-type-add`,
  // 5、编辑提示词分组接口
  promptCategoryEdit: `${baseMF}/prompt-type-edit`,
  // 6、获取提示词列表信息接口
  promptList: `${baseMF}/prompt-source`,
  // 7、新增提示词接口-数据保存
  promptAdd: `${baseMF}/prompt-add`,
  // 8、获取大模型列表接口
  promptLLMList: `${baseMF}/prompt-llm-source`,
  // 9、提示词名称编辑接口
  promptNameEdit: `${baseMF}/prompt-name-edit`,
  // 10、获取提示词模板列表信息接口
  promptTemplateGet: `${baseMF}/prompt-template-source`,
  // 11、提示词查看接口
  promptDetail: (promptId: string) => `${baseMF}/prompt/${promptId}`,
  // 12、提示词编辑接口
  promptEdit: `${baseMF}/prompt-edit`,
  // 13、提示词发布接口
  promptDeploy: `${baseMF}/prompt-deploy`,
  // 14、提示词取消发布接口
  promptUndeploy: `${baseMF}/prompt-undeploy`,
  // 15、提示词运行接口
  promptRun: `${baseMF}/prompt-run`,
  // 16、提示词运行接口-流式返回
  promptRunStream: `${baseMF}/prompt-run-stream`,
  // 17、提示词调用接口
  // 18、查看代码接口
  promptCodeGet: `${baseMF}/prompt-code`,
  // 19、填充提示词接口
  // 20、删除提示词接口
  promptDelete: `${baseMF}/delete-prompt`,
  // 21、获取服务id接口
  promptSnowId: `${baseMF}/get-id`,
  // 22、移动提示词接口
  promptMove: `${baseMF}/prompt/move`,
  // 23、使用创建的提示词模板调用大模型接口
  // 24、提示词管理内编辑接口
  managePromptEdit: `${baseMF}/prompt-template-edit`,
  // 25、批量创建提示词接口

  /* 菜单管理 */
  // 1、获取菜单列表
  newMenuList: `${baseEventStats}/menu/list`,
  // 2、获取指定菜单详情
  newMenuInfo: `${baseEventStats}/menu`,
  // 3、新建菜单
  newMenuAdd: `${baseEventStats}/menu/add`,
  // 4、修改菜单
  newMenuUpdate: `${baseEventStats}/menu/update`,
  // 5、删除菜单
  newMenuDel: `${baseEventStats}/menu/delete`,

  /* 字典管理 */
  // 1、获取字典列表
  dictGetList: `${baseEventStats}/dict/list`,
  // 2、获取指定字典详情
  dictGetInfo: `${baseEventStats}/dict`,
  // 3、新建字典
  dictAdd: `${baseEventStats}/dict/add`,
  // 4、修改字典
  dictUpdate: `${baseEventStats}/dict/update`,
  // 5、删除字典
  dictDelete: `${baseEventStats}/dict/delete`,
  // 6、获取指定字典下的字典值列表
  dictGetItemList: `${baseEventStats}/dict/itemList`,
  // 7、获取指定字典值详情
  dictGetItemInfo: `${baseEventStats}/dict/item`,
  // 8、新建字典值
  dictAddItem: `${baseEventStats}/dict/addItem`,
  // 9、修改字典值
  dictUpdateItem: `${baseEventStats}/dict/updateItem`,
  // 10、删除字典值
  dictDeleteItem: `${baseEventStats}/dict/deleteItem`,

  getLDAP: `${baseManager}/ldap/server/config`,
  saveLDAP: `${baseManager}/ldap/server/config`,
  accessTest: `${baseManager}/ldap/server/test`,
  searchUser: `${baseManager}/ldap/server/user`,
  synchronization: `${baseManager}/ldap/user/insert`,

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

  getSqlExtractPreview: `${baseBuilder}/onto/sql/previewdata`,
  sqlExtract: `${baseBuilder}/onto/sql/extract`,
  addEntity: `${baseBuilder}/onto/saveontology`,
  delEntity: `${baseBuilder}/onto/deleteontology`,
  editEntity: (otl_id: any) => `${baseBuilder}/onto/editontology/${otl_id}`,
  downloadEntityTemplate: `${baseBuilder}/onto/template`,
  exportEntity: `${baseBuilder}/onto/export`,
  importEntity: `${baseBuilder}/onto/import_task`,
  getEntityImportStatus: `${baseBuilder}/onto/import_task`,
  getAllNoumenon: `${baseBuilder}/onto/getotl`,
  updateName: (otl_id: any) => `${baseBuilder}/onto/updatename/${otl_id}`,
  getEntityInfo: (otl_id: any) => `${baseBuilder}/onto/${otl_id}`,

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
  previewdata: `${baseBuilder}/ds/previewdata`,
  dataSourceSql: `${baseBuilder}/ds/sql`,
  getTableField: `${baseBuilder}/ds/table_field`,
  analysisReportGet: `${baseEngine}/analysis`,
  expandEdges: `${baseEngine}/explore/expandv`,
  explorePathDetails: `${baseEngine}/explore/pathDetail`,
  getAllProperties: `${baseAlgServer}/explore/kgs`,
  quickSearch: `${baseAlgServer}/graph-search/kgs`,

  explorePath: (kg_id: any) => `${baseEngine}/graph-explore/kgs/${kg_id}/paths`,
  getNeighbors: (kg_id: any) => `${baseEngine}/graph-explore/kgs/${kg_id}/neighbors`,
  exploreSearchE: (kg_id: any) => `${baseEngine}/graph-explore/kgs/${kg_id}/expandv`,

  graphOutput: `${baseBuilder}/graph/output`,
  graphInput: `${baseBuilder}/graph/input`,
  knowledgeNetGet: `${baseBuilder}/knw/get_all`,
  knowledgeNetGetByName: `${baseBuilder}/knw/get_by_name`,
  knowledgeNetCreate: `${baseBuilder}/knw/network`,
  knowledgeNetEdit: `${baseBuilder}/knw/edit_knw`,
  knowledgeNetDelete: `${baseBuilder}/knw/delete_knw`,
  graphGetByKnw: `${baseBuilder}/knw/get_graph_by_knw`,
  getSysConfig: `${baseBuilder}/knw/sys_info`,

  graphGetInfoOnto: `${baseBuilder}/graph/info/onto`,
  graphGetInfoBasic: `${baseBuilder}/graph/info/basic`,
  graphGetInfoCount: `${baseBuilder}/graph/info/count`,
  graphGetInfoDetail: `${baseBuilder}/graph/info/detail`,

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

  taskGet: `${baseBuilder}/task`,
  taskCreate: `${baseBuilder}/task`,
  taskStop: `${baseBuilder}/task/stoptask`,
  taskDelete: `${baseBuilder}/task/delete`,
  taskGetProgress: `${baseBuilder}/task/get_progress`,
  graphDelByIds: `${baseBuilder}/graph/delbyids`,
  taskPerform: `${baseBuilder}/task`,

  timerGet: `${baseBuilder}/timer`,
  timerGetInfo: `${baseBuilder}/timer/info`,
  timerDelete: `${baseBuilder}/timer/delete`,
  timerCreate: `${baseBuilder}/timer/add`,
  timerUpdate: `${baseBuilder}/timer/update`,
  timerSwitch: `${baseBuilder}/timer/switch`,

  uploadServiceGet: `${baseDataIo}/uploadServiceList`,
  uploadServiceCreate: `${baseDataIo}/uploadServiceList/add`,
  uploadServiceUpdate: `${baseDataIo}/uploadServiceList/update`,
  uploadServiceDelete: `${baseDataIo}/uploadServiceList/delete`,
  uploadServiceTaskGet: `${baseDataIo}/uploadServiceTask`,
  uploadKnowledge: `${baseDataIo}/uploadServiceTask`,
  taskGetRelationKN: `${baseDataIo}/task/knowledgeNetwork`,
  uploadContinue: `${baseDataIo}/uploadServiceTask/continue`,
  graphToUpload: `${baseBuilder}/graph/to_be_uploaded`,

  registrationGet: `${baseManager}/registration`,
  registrationPost: `${baseManager}/registration`,
  userListGet: `${baseRbac}/user/list`,

  graphGet: `${baseBuilder}/graph`,
  graphEdit: `${baseBuilder}/graph`,
  graphCreate: `${baseBuilder}/graph`,
  graphSaveNoCheck: `${baseBuilder}/graph/savenocheck`,
  graphCheckKmApInfo: `${baseBuilder}/graph/check_kmapinfo`,
  graphGetExtract: `${baseBuilder}/graph/info/graph_InfoExt`,
  graphGetInfoExt: `${baseBuilder}/graph/graph_InfoExt/graphid`,
  performTask: `${baseBuilder}/task`,

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

  glossary: `${baseBuilder}/taxonomy`,

  rbacAuth: `${baseRbac}/auth`,

  getSourceInfo: `${baseRbac}/permission`,
  addSource: `${baseRbac}/permission/add`,
  updateSource: `${baseRbac}/permission/update`,
  deleteSource: `${baseRbac}/permission/delete`,

  dataPermissionAssign: `${baseAuth}/data-permission/assign`,
  dataPermissionAssignBuilder: `${baseBuilder}/data-permission/assign`,
  dataPermissionGetList: `${baseAuth}/data-permission/list`,
  dataUserList: `${baseAuth}/user/list`,

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

  roleListGet: `${baseRbac}/role/list`,
  roleAdd: `${baseRbac}/role/add`,
  roleDelete: `${baseRbac}/role/delete`,
  roleUpdate: `${baseRbac}/role/update`,
  bindPermission: `${baseRbac}/role/bindPermission`,
  listPermission: `${baseRbac}/role/listPermission`,
  listMember: `${baseRbac}/role/listMember`,
  addMember: `${baseRbac}/role/addMember`,
  rmMember: `${baseRbac}/role/rmMember`,

  userGetList: `${baseRbac}/user/list`,
  userAdd: `${baseRbac}/user/add`,
  userUpdate: `${baseRbac}/user/update`,
  passwordReset: `${baseRbac}/user/password/reset`,
  userDelete: `${baseRbac}/user/delete`,
  statusUpdate: `${baseRbac}/user/status/update`,

  intelligenceCalculate: `${baseBuilder}/graph/intelligence/task`,
  intelligenceGetByKnw: `${baseBuilder}/knw/intelligence`,
  intelligenceGetByGraph: `${baseBuilder}/graph/intelligence`,

  subgraphGetList: `${baseBuilder}/graph/subgraph`,
  subgraphInfoDetail: `${baseBuilder}/graph/subgraph`,
  subgraphRunTask: `${baseBuilder}/task/batch`,
  subgraphHistoryDetail: `${baseBuilder}/task/subgraph`,
  subgraphAdd: `${baseBuilder}/graph/subgraph`,
  subgraphEdit: `${baseBuilder}/graph/subgraph/edit`,
  subgraphDelete: `${baseBuilder}/graph/subgraph/delete`,
  subgraphSave: `${baseBuilder}/graph/subgraph/savenocheck`,

  visualAnalysisList: `${baseAlgServer}/canvases/knws`,
  visualGetCanvasInfoById: `${baseAlgServer}/canvases`,
  visualGraphList: `${baseAlgServer}/canvases/knws`,
  visualAnalysisAdd: `${baseAlgServer}/canvases`,
  visualAnalysisUpdate: `${baseAlgServer}/canvases`,
  visualAnalysisDelete: `${baseAlgServer}/canvases/delete`,

  fullTestRetrieval: (kg_id: any) => `${baseEngine}/basic-search/kgs/${kg_id}/full-text`,
  vidRetrieval: (kg_id: any) => `${baseEngine}/basic-search/kgs/${kg_id}/vids`,
  eidRetrieval: (kg_id: any) => `${baseEngine}/basic-search/kgs/${kg_id}/edges`,
  customSearch: (kg_id: any) => `${baseEngine}/custom-search/kgs/${kg_id}`,
  analysisServiceTest: `${baseEngine}/services/graph-analysis/test`,
  importService: `${baseEngine}/services/import-service/file`,
  serviceInfo: `${baseEngine}/services/info`,
  exportService: (service_id: any) => `${baseEngine}/services/graph-analysis/${service_id}/export-service`,
  analysisTemplate: `${baseEngine}/services/export-template`,

  getDeviceCode: `${baseRbac}/license/deviceCode`,
  licenseAdd: `${baseRbac}/license/add`,
  deleteRemove: `${baseRbac}/license/remove`,
  licenseActivate: `${baseRbac}/license/activate`,
  capacityDetail: `${baseRbac}/license/capacityDetail`,
  graphCountAll: `${baseBuilder}/graphcount`,
  getServiceLicenseStatus: `${baseRbac}/license/getStatus`,

  functionList: `${baseBuilder}/function/list`,
  functionCreate: `${baseBuilder}/function/create`,
  functionEdit: `${baseBuilder}/function/edit`,
  functionDelete: `${baseBuilder}/function/delete`,
  functionInfo: `${baseBuilder}/function/get_by_id`,

  analysisServiceList: `${baseCognitive}/services/list`,
  analysisServiceCreate: `${baseCognitive}/services`,
  analysisServiceGet: `${baseCognitive}/services`,
  analysisServiceEdit: `${baseCognitive}/services`,
  analysisServiceDelete: `${baseCognitive}/services`,
  analysisServiceCancel: `${baseCognitive}/services`,

  snapshotsGetById: (s_id: any) => `${baseCognitive}/snapshots/${s_id}`,
  snapshotsGetList: `${baseCognitive}/snapshots/list`,
  snapshotsPostCreate: `${baseCognitive}/snapshots`,
  snapshotsPostUpdate: (s_id: any) => `${baseCognitive}/snapshots/${s_id}/update`,
  snapshotsPostDelete: (s_id: any) => `${baseCognitive}/snapshots/${s_id}/delete`,

  modelBeginUpload: `${baseKnBuilder}/model/os-begin-upload`,
  modelEndUpload: `${baseKnBuilder}/model/os-end-upload`,
  modelInitMultiUpload: `${baseKnBuilder}/model/os-init-multi-upload`,
  modelUploadPart: `${baseKnBuilder}/model/os-upload-part`,
  modelOsDownload: `${baseKnBuilder}/model/os-download`,
  modelCompletePart: `${baseKnBuilder}/model/os-complete-upload`,
  modelGet: `${baseKnBuilder}/model`,
  modelGetTags: `${baseKnBuilder}/model/tags`,
  modelDelete: `${baseKnBuilder}/model/delete`,
  modelUpdate: `${baseKnBuilder}/model/update`,
  modelHealthReady: `${baseKnBuilder}/health/ready`,
  modelHealthAlive: `${baseKnBuilder}/health/alive`,
  modelGetDetail: (knw_id: any) => `${baseKnBuilder}/knw/${knw_id}/model_ids`,
  modelGetKnwIdByModelId: (model_id: any) => `${baseKnBuilder}/model/${model_id}/knw_id`,
  modelGetUUIDByModelId: (model_id: any) => `${baseKnBuilder}/model/${model_id}/create_user`,
  modelIsExist: (model_id: any) => `${baseKnBuilder}/model/${model_id}/exist`,

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

  cognitiveSearchList: `${baseSearch}/services/list`,
  getStatus: (service_id: any) => `${baseSearchEngine}/services/${service_id}/get_status`,
  getInitialization: `${baseSearchEngine}/services/initialization`,
  searchTest: (service_id: any) => `${baseSearchEngine}/services/${service_id}/test`,
  searchTactics: (service_id: any) => `${baseSearchEngine}/services/${service_id}`,
  createSearch: `${baseSearch}/services`,
  editSearch: (service_id: any) => `${baseSearch}/services/${service_id}`,
  cancelPublish: (service_id: any) => `${baseSearch}/services/${service_id}/cancel-service`,
  getAppointList: `${baseSearch}/services`,
  deleteSearch: (service_id: any) => `${baseSearch}/services/${service_id}/delete-service`,
  kgqaProperty: `${baseSearch}/kgqa/get_property`,
  getKgList: (knw_id: any) => `${baseSearch}/adv_search/knws/${knw_id}/kglist`,
  openAiTest: `${baseSearchEngine}/services/openai_test`,
  checkLink: `${baseSearchEngine}/services/em_model_test`,
  parseModel: `${baseAppManage}/services/parse_model`,
  exportModelTemplate: `${baseAppManage}/services/export_model_template`,
  promptTest: `${baseSearchEngine}/prompt/test`,

  DBApiAdd: `${baseDBApi}/v1/api_config/add`,
  DBApiPublish: `${baseDBApi}/v1/api_config/online`,
  DBApiUnpublish: `${baseDBApi}/v1/api_config/offline`,
  DBApiRemove: `${baseDBApi}/v1/api_config/remove`,
  DBApiList: `${baseDBApi}/v1/api_config/list`,
  DBApiInfo: `${baseDBApi}/v1/api_config/get`,
  addCustom: `${baseSearch}/custom-services`,
  updateCustom: (service_id: any) => `${baseSearch}/custom-services/${service_id}`,
  initialCustom: `${baseSearchEngine}/custom-services/initialization`,
  getCustomServiceStatus: (service_id: any, env = '') => {
    if (!env || env === '0') {
      return `${baseSearchEngine}/services/${service_id}/get_status`;
    }
    return `/api/search-engine-${env}/v1/services/${service_id}/get_status`;
  },
  customList: `${baseIntention}/services/list`,
  editCustom: (service_id: any) => `${baseIntention}/services/${service_id}`,
  testCustom: (service_id: any, env = '') => {
    if (!env || env === '0') {
      return `${baseSearchEngine}/custom-services/${service_id}/test`;
    }
    return `/api/search-engine-${env}/v1/custom-services/${service_id}/test`;
  },
  usedService: (service_id: any) => `${baseSearchEngine}/custom-services/${service_id}`,
  cancelCustomPublish: (service_id: any) => `${baseSearch}/services/${service_id}/cancel-service`,
  deleteCustomPublish: (service_id: any) => `${baseSearch}/services/${service_id}/delete-service`,
  getTemplate: `${baseSearch}/custom-services/get_template`,
  checkValidity: `${baseSearch}/custom-services/check_validity`,

  getSubscribeAccount: `${baseEngine}/subscribe-account`,
  editSubscribeAccount: `${baseEngine}/subscribe-account`,

  getModelServiceList: `${baseManager}/mfdeploy/queryPage`,

  llmModelDeploy: `${baseMF}/llm-deploy`,
  llmApiDoc: `${baseMF}/llm-api-doc`,

  promptProjectRemove: `${baseMF}/prompt-item-remove`,
  promptCategoryRemove: `${baseMF}/prompt-type-remove`,
  promptApiDoc: `${baseMF}/prompt-api-doc`
};

export { API };
