import intl from 'react-intl-universal';

export const DESC = 'descend' as const;
export const ASC = 'ascend' as const;
export const PAGE_SIZE = 10;

export const FILTER_OPTION = [
  { key: '-1', text: intl.get('dpapiList.publishAllStatus') },
  { key: 'PUBLISHED', text: intl.get('dpapiList.Published') },
  { key: 'UNPUBLISHED', text: intl.get('dpapiList.Unpublished') }
];

export const SORTED_FIELD_MAP_CODE:any = {
  name: 'name',
  createTime: 'create_time',
  updateTime: 'update_time'
}

export const SORTER_FIELD = [
  { key: 'name', text: intl.get('dpapiList.byServiceName') }, // 服务名称
  { key: 'createTime', text: intl.get('dpapiList.byCreate') }, // 创建时间
  { key: 'updateTime', text: intl.get('dpapiList.sortByFinalOpTime') } // 修改时间
];

export const STATUS_COLOR: any = {
  UNPUBLISHED: 'rgba(216, 216, 216, 1)', // 未发布
  PUBLISHED: 'rgba(82, 196, 26, 1)' // 已发布
};

export const STATUS_SHOW: any = {
  0: intl.get('dpapiList.unpublished'),
  1: intl.get('dpapiList.published'),
  2: intl.get('dpapiList.publishFailed')
};
