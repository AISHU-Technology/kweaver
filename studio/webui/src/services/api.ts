const baseBuilder = 'api/builder/v1';
const baseEngine = '/api/engine/v1';
const baseStudio = '/api/studio/v1';

const API = {
  // createEntity
  getSource: `${baseBuilder}/onto/ds`,
  getDataList: `${baseBuilder}/onto/gettabbydsn`,
  getOtherPreData: `${baseBuilder}/onto/previewdata`,
  getChildrenFile: `${baseBuilder}/onto/dirlist`,
  getFileGraphData: `${baseBuilder}/onto/auto/autogenschema`,
  getAllNoumenon: `${baseBuilder}/onto/getotl`,
  getAllNoumenonData: `${baseBuilder}/onto/getotlbyname`,
  addEntity: `${baseBuilder}/onto/saveontology`,
  fetchModelList: `${baseBuilder}/onto/modellist`,
  getEntityInfo: `${baseBuilder}/onto/`,
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

  // explore
  analysisReportGet: `${baseEngine}/analysis`,
  exploreRelation: `${baseEngine}/explore/relation`,
  expandEdges: `${baseEngine}/explore/expandv`,
  explorePath: `${baseEngine}/explore/path`,
  explorePathDetails: `${baseEngine}/explore/pathDetail`,

  // knowledgeNetwork
  graphOutput: `${baseBuilder}/graph/output`,
  graphInput: `${baseBuilder}/graph/input`,
  knowledgeNetGet: `${baseBuilder}/knw/get_all`,
  knowledgeNetGetByName: `${baseBuilder}/knw/get_by_name`,
  knowledgeNetCreate: `${baseBuilder}/knw/network`,
  knowledgeNetEdit: `${baseBuilder}/knw/edit_knw`,
  knowledgeNetDelete: `${baseBuilder}/knw/delete_knw`,
  graphGetByKnw: `${baseBuilder}/knw/get_graph_by_knw`,

  // graphDetail
  graphGetInfoOnto: `${baseBuilder}/graph/info/onto`,
  graphGetInfoBasic: `${baseBuilder}/graph/info/basic`,
  graphGetInfoCount: `${baseBuilder}/graph/info/count`,
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
  graphDBGetById: `${baseStudio}/graphdb`,
  graphDBGetList: `${baseStudio}/graphdb/list`,
  graphDBCreate: `${baseStudio}/graphdb/add`,
  graphDBDelete: `${baseStudio}/graphdb/delete`,
  graphDBUpdate: `${baseStudio}/graphdb/update`,
  graphDBTest: `${baseStudio}/graphdb/test`,
  graphDBGetGraphById: `${baseStudio}/graphdb/graph/list`,
  openSearchGet: `${baseStudio}/opensearch/list`,
  openSearchGetById: `${baseStudio}/opensearch`,
  openSearchCreate: `${baseStudio}/opensearch/add`,
  openSearchDelete: `${baseStudio}/opensearch/delete`,
  openSearchUpdate: `${baseStudio}/opensearch/update`,
  openSearchTest: `${baseStudio}/opensearch/test`,

  // taskManagement
  taskGet: `${baseBuilder}/task`,
  taskCreate: `${baseBuilder}/task`,
  taskStop: `${baseBuilder}/task/stoptask`,
  taskDelete: `${baseBuilder}/task`,
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

  // workflow
  graphGet: `${baseBuilder}/graph`,
  graphEdit: `${baseBuilder}/graph`,
  graphCreate: `${baseBuilder}/graph`,
  graphGetBis: `${baseBuilder}/graph/getbis`,
  graphSaveNoCheck: `${baseBuilder}/graph/savenocheck`,
  graphCheckKmApInfo: `${baseBuilder}/graph/check_kmapinfo`,
  graphGetInfoExt: `${baseBuilder}/graph/graph_InfoExt/graphid`,

  // swagger
  swaggerDocGet: `${baseStudio}/swaggerDoc`,

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
  wordCloud: `${baseBuilder}/lexicon/word_cloud`,
  searchWordCloud: `${baseBuilder}/lexicon/word_cloud_search`
};

export { API };
