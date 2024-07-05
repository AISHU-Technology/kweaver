import React, { useEffect, useState } from 'react';
import { Dropdown, Select } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import KwKNIcon from '@/components/KwKNIcon';

import './style.less';

const KNW = 'knw';
const KG = 'kg';

type TYPE = 'kg' | 'knw';

type ResourceDropdownType = {
  knwList: any[];
  filters: any;
  onChangeResource: (value: string, type: TYPE) => void;
};

const ResourceDropdown: React.FC<ResourceDropdownType> = props => {
  const { knwList = [], filters, onChangeResource } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const [kgList, setKgList] = useState<any[]>([]);
  const [data, setData] = useState<{ kw_name?: string; kg_name?: string }>();

  const all = [{ knw_id: '-1', kg_id: '-1', name: intl.get('global.all'), kg_name: intl.get('global.all') }];

  useEffect(() => {
    if (filters?.knw_id === '-1' && !_.isEmpty(knwList)) {
      const kgs = _.reduce(knwList, (acc: any, curr: any) => [...acc, ...curr?.resource_kgs], []);
      setKgList(kgs);
    }
  }, [knwList, filters?.knw_id]);

  /** 渲染值 */
  const getValue = (type?: TYPE) => {
    const id = type === KNW ? filters?.knw_id : filters?.kg_id;
    if (type === KNW) {
      const item = _.find(knwList, item => item?.knw_id === id);
      const label = getIconName(KNW, item?.name || intl.get('global.all'), item?.color);
      return { value: id, label };
    }
    if (type === KG) {
      const item = _.find(kgList, item => item?.kg_id === id);
      const label = getIconName(KG, item?.name || intl.get('global.all'), item?.color);

      return { value: id, label };
    }
  };

  /** 渲染下拉选项 */
  const getIconName = (type: TYPE, name: string, color = '') => {
    return (
      <div className="kw-align-center">
        <div className="kw-center" style={{ width: 20, height: 20 }}>
          {type === KNW ? (
            color ? (
              <KwKNIcon type={color} />
            ) : (
              <KwKNIcon type="icon-color-zswl8" />
            )
          ) : (
            <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
          )}
        </div>
        <div className="kw-ellipsis" style={{ flex: 1, marginLeft: 6 }} title={name}>
          {name}
        </div>
      </div>
    );
  };

  /** 切换知识网络 */
  const onKwChange = (value: any, op: any) => {
    if (value === '-1') {
      onChangeResource(value, KNW);
      setData({});
      setKgList([]);
      return;
    }
    setKgList(op?.data);
    setData(() => ({
      kw_name: op?.name
    }));
    onChangeResource(value, KNW);
  };

  /** 切换知识图谱 */
  const onKgChange = (value: any, op: any) => {
    setData(() => ({
      ...data,
      kg_name: op?.name
    }));

    onChangeResource(value, KG);
  };

  const getResValue = () => {
    if (!data?.kw_name && !data?.kg_name) return intl.get('global.all');
    if (!data?.kg_name) return data?.kw_name;
    if (!data?.kw_name) return data?.kg_name;
    return `${data?.kw_name}-${data?.kg_name}`;
  };

  const resourceOptions = () => {
    return (
      <div className="dropwrapper">
        <div className="kw-space-between kw-mb-4">
          <span className="selectLabel kw-mr-2">{intl.get('global.kgNet')}</span>
          <Select
            value={getValue(KNW)}
            style={{ width: 200, height: 32 }}
            optionLabelProp="children"
            listHeight={8 * 32}
            onChange={(e, op: any) => onKwChange(e, op)}
            getPopupContainer={e => e.parentElement!}
            options={_.map([...all, ...knwList], item => ({
              value: item?.knw_id,
              label: getIconName(KNW, item?.name, item?.color),
              data: item?.resource_kgs || [],
              name: item?.name
            }))}
          />
        </div>
        <div className="kw-space-between">
          <span className="selectLabel kw-mr-2">{intl.get('global.graph')}</span>
          <Select
            value={getValue(KG)}
            style={{ width: 200, height: 32 }}
            listHeight={8 * 32}
            getPopupContainer={e => e.parentElement!}
            optionLabelProp="children"
            onChange={(e: any, op: any) => onKgChange(e, op)}
            options={_.map([...all, ...kgList], item => ({
              value: item?.kg_id,
              label: getIconName(KG, item?.kg_name),
              name: item?.kg_name
            }))}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="resourceDropdownRoot">
      <Dropdown
        overlay={resourceOptions}
        open={visible}
        trigger={['click']}
        getPopupContainer={e => e.parentElement!}
        onOpenChange={isOpen => setVisible(isOpen)}
      >
        <div className="kw-align-center">
          <span className="kw-ellipsis kw-mr-2" title={intl.get('cognitiveService.analysis.associated')}>
            {intl.get('cognitiveService.analysis.associated')}
          </span>
          <Select style={{ width: 200, height: 32 }} notFoundContent={null} value={getResValue()} />
        </div>
      </Dropdown>
    </div>
  );
};
export default ResourceDropdown;
