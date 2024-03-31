/**
 * 开放api
 */
const baseBuilder = '/api/builder/v1';
const baseEngine = '/api/engine/v1';
const baseManager = '/api/manager/v1';
const baseDataIo = '/api/data-io/v1';
const baseAlgServer = '/api/alg-server/v1';
const baseCognitive = '/api/cognitive-service/v1';
const baseSearchEngine = '/api/search-engine/v1';
const baseSearch = '/api/cognition-search/v1';

const OPEN_API = {
  openApiUseByAdf: `${baseManager}/openapiuse/adf`,
  openApiUseByKg: `${baseManager}/openapiuse/kg`,

  // graphDetail
  /** 获取图谱的本体信息 */
  openGraphGetInfoOnto: `${baseBuilder}/open/graph/info/onto`,
  /** 获取图谱基本信息 */
  openGraphGetInfoBasic: `${baseBuilder}/open/graph/info/basic`,
  /** 获取图谱的数量信息 */
  openGraphGetInfoCount: `${baseBuilder}/open/graph/info/count`,
  /** 获取图谱中的点或边的配置详情 */
  openGraphGetInfoDetail: `${baseBuilder}/open/graph/info/detail`,

  // explore
  /** 获取分析报告 */
  openAnalysisReportGet: `${baseEngine}/open/analysis`,
  /** 探索分析展开实体点 */
  openExpandEdges: `${baseEngine}/open/explore/expandv`,
  /** 探索两点之间的路径  ${OPEN_API.openExplorePath}/${data.kg_id}/path */
  // openExplorePath: `${baseAlgServer}/open/explore/kgs`,
  /** 探索两点之间的路径的详细信息 */
  openExplorePathDetails: `${baseEngine}/open/explore/pathDetail`,
  /** 快速查找, 搜索联想 */
  openQuickSearch: `${baseAlgServer}/open/graph-search/kgs`,
  /** 邻居查询  ${API.getNeighbors}/${data?.id}/neighbors*/
  // openNeighbors: `${baseAlgServer}/open/explore/kgs`,

  // 图分析新接口 algServer --> engine
  openExplorePath: (kg_id: number | string) => `${baseEngine}/open/graph-explore/kgs/${kg_id}/paths`,
  openNeighbors: (kg_id: number | string) => `${baseEngine}/open/graph-explore/kgs/${kg_id}/neighbors`,
  openExploreSearchE: (kg_id: number | string) => `${baseEngine}/open/graph-explore/kgs/${kg_id}/expandv`,

  /** 新增画布 post  */
  openVisualAnalysisAdd: `${baseAlgServer}/open/canvases`,
  /** 更新画布 post ${OPEN_API.openVisualAnalysisUpdate}/${data?.c_id}/update */
  openVisualAnalysisUpdate: `${baseAlgServer}/open/canvases`,

  // 图分析新接口 algServer --> engine
  openFullTestRetrieval: (kg_id: number | string) => `${baseEngine}/open/basic-search/kgs/${kg_id}/full-text`,
  openVidRetrieval: (kg_id: number | string) => `${baseEngine}/open/basic-search/kgs/${kg_id}/vids`,
  openEidRetrieval: (kg_id: number | string) => `${baseEngine}/open/basic-search/kgs/${kg_id}/edges`,
  openCustomSearch: (kg_id: number | string) => `${baseEngine}/open/custom-search/kgs/${kg_id}`,
  openAnalysisServiceTest: `${baseEngine}/open/services/graph-analysis/test`,

  // baseCognitive
  /** 获取指定图分析服务 get ${API.analysisServiceGet}/${id} */
  openAnalysisServiceGet: `${baseCognitive}/open/services`,

  // search
  /** 获取实体类中的所有属性 get */
  openEntityPropertiesGet: `${baseEngine}/open/properties`,

  // cognitiveSearch
  /** 初始化 post */
  openGetInitialization: `${baseSearchEngine}/open/services/initialization`,
  /** 获取指定图分析服务 get ${OPEN_API.openGetAppointList}/${body} */
  openGetAppointList: `${baseSearch}/open/services`,
  /** 获取初始化状态 get ${OPEN_API.openGetStatus}/${body}/get_status */
  openGetStatus: (service_id: string, env = '') => {
    if (!env || env === '0') {
      `${baseSearchEngine}/open/services/${service_id}/get_status`;
    }
    return `/api/search-engine-${env}/v1/open/services/${service_id}/get_status`;
  },
  /** 测试 post ${OPEN_API.openSearchTest}/${body.service_id}/test */
  openSearchTest: (service_id: string) => `${baseSearchEngine}/open/services/${service_id}/test`,
  openSearchTactics: (service_id: string) => `${baseSearchEngine}/open/services/${service_id}/test`,
  /** 图分析服务列表 get ${OPEN_API.openCognitiveSearchList}/${body.knw_id}/list */
  openCognitiveSearchList: `${baseSearch}/open/services/list`,

  // snapshots 快照
  /** 通过 Id 获取指定快照的信息 */
  openSnapshotsGetById: (s_id: number) => `${baseCognitive}/open/snapshots/${s_id}`,
  /** 获取快照列表 */
  openSnapshotsGetList: `${baseCognitive}/open/snapshots/list`,
  /** 新增快照 */
  openSnapshotsPostCreate: `${baseCognitive}/open/snapshots`,
  /** 编辑快照 */
  openSnapshotsPostUpdate: (s_id: number) => `${baseCognitive}/open/snapshots/${s_id}/update`,
  /** 删除快照 */
  openSnapshotsPostDelete: (s_id: number) => `${baseCognitive}/open/snapshots/${s_id}/delete`,

  // as知识卡片
  /** 根据文档gns获取相关知识点 */
  openKnowledgePointPost: (s_id: string) => `${baseCognitive}/open/custom-search/services/${s_id}`,
  /** 获取实体链接 */
  openEntityLinkGet: (config_name: string) => `${baseCognitive}/open/entity_link/${config_name}`
};

export { OPEN_API };
