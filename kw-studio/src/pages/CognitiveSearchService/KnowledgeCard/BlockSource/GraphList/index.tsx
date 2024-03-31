import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import serviceGraphDetail from '@/services/graphDetail';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';
import './style.less';

import { useCard } from '../../useCard';
import { isConfigChanged, getPermissionIds } from '../../utils';
import { message, Button } from 'antd';

export interface GraphListProps {
  className?: string;
  triggerSave?: () => any;
}

const GraphList = (props: GraphListProps) => {
  const { className, triggerSave } = props;
  const { state, dispatch } = useCard();
  const { graphSources, selectedGraph, savedData, configs } = state;
  const savedKeys = useMemo(() => _.map(savedData, d => d.kg_id), [savedData]);
  const [permissionIds, setPermissionIds] = useState<string[]>([]); // 有权限的图谱id
  const [changedTip, setChangedTip] = useState({ visible: false, graph: {} as any }); // 切换图谱的提示弹窗

  useEffect(() => {
    verifyGraphAuth();
  }, [graphSources]);

  /**
   * 查询权限
   */
  const verifyGraphAuth = async () => {
    const ids = _.map(graphSources, item => item.kg_id);
    const pIds = await getPermissionIds(ids);
    setPermissionIds(pIds);
    if (pIds.length < ids.length) {
      message.error(intl.get('knowledgeCard.notGraphAuth'));
    }
    if (pIds[0]) {
      const select = _.find(graphSources, g => String(g.kg_id) === pIds[0]);
      select && onGraphChange(select);
    }
  };

  /**
   * 获取本体信息
   * @param graph_id 图谱id
   */
  const getOntology = async (graph_id: number) => {
    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id });
      return resultOnto?.res;
    } catch (err) {
      //
    }
  };

  /**
   * 点击选择图谱
   * @param item
   */
  const onGraphChange = async (item: any) => {
    if (selectedGraph?.kg_id === item.kg_id) return;
    if (isConfigChanged(configs)) {
      return setChangedTip({ visible: true, graph: item });
    }
    changeGraph(item);
  };

  /**
   * 切换图谱
   * @param graph
   * @param needSave 是否需要保存
   */
  const changeGraph = async (graph: any, needSave?: boolean) => {
    changedTip.visible && setChangedTip({ visible: false, graph: {} });
    if (needSave && triggerSave) {
      const saveSuccessful = triggerSave();
      if (!saveSuccessful) return; // 保存不成功, 终止
    }
    const res = await getOntology(graph.kg_id);
    if (selectedGraph?.kg_id === graph.kg_id) return; // 接口太慢, 重复点击
    let newGraph = { ...graph };
    if (res?.entity) {
      newGraph = { ...newGraph, ...res };
    }
    dispatch({ key: 'selectedGraph', data: newGraph });
    dispatch({
      key: 'configs',
      data: {
        sort: [],
        node: {},
        activeID: '',
        componentsCache: [],
        components: []
      }
    });
  };

  return (
    <div className={classNames(className, 'knw-card-config-graph kw-flex-column kw-h-100')}>
      <Format.Title className="kw-p-6 kw-pb-2" style={{ height: 'unset' }}>
        {intl.get('cognitiveSearch.graphQA.graphResource')}
      </Format.Title>
      <div className="kw-flex-item-full-height">
        {_.map(graphSources, item => {
          const checked = _.includes(savedKeys, item.kg_id);
          const hasPermission = permissionIds.includes(String(item.kg_id));
          return (
            <div
              key={item.kg_id}
              className={classNames('graph-row kw-pl-6 kw-pr-6 kw-align-center kw-pointer', {
                checked: selectedGraph?.kg_id === item.kg_id,
                disabled: !hasPermission
              })}
              onClick={() => hasPermission && onGraphChange(item)}
            >
              <IconFont type="icon-color-zhishitupu11" className="kw-mr-2" style={{ fontSize: 16 }} />
              <div className="kw-flex-item-full-width kw-ellipsis" title={item.kg_name}>
                {item.kg_name}
              </div>
              {checked && <IconFont type="icon-duigou" className="kw-ml-2 kw-c-primary" style={{ fontSize: 20 }} />}
            </div>
          );
        })}
      </div>

      <TipModal
        title={intl.get('knowledgeCard.changedTipTitle')}
        content={intl.get('knowledgeCard.changedTip')}
        okText={intl.get('global.save')}
        visible={changedTip.visible}
        onOk={() => changeGraph(changedTip.graph, true)}
        onCancel={() => setChangedTip({ visible: false, graph: {} })}
        extractBtn={<Button onClick={() => changeGraph(changedTip.graph)}>{intl.get('global.notSave')}</Button>}
      />
    </div>
  );
};

export default GraphList;
