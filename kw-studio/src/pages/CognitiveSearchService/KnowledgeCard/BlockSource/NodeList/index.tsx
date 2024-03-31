import React, { useState, useMemo } from 'react';
import { Button, Checkbox } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import TipModal, { tipModalFunc } from '@/components/TipModal';
import { fuzzyMatch } from '@/utils/handleFunction';
import './style.less';

import KNOWLEDGE_CARD from '../../enums';
import { useCard } from '../../useCard';
import { isConfigChanged } from '../../utils';

/**
 * 判断全选、半选状态
 * @param showData 显示的数据
 * @param keys 勾选的key
 */
const boolCheckStatus = (showData: any[], keys: string[]) => {
  let isPart = false;
  let isAll = false;
  let count = 0;
  if (!keys.length || !showData.length) return { isPart, isAll };
  const keysMap = _.keyBy(keys);
  _.some(showData, ({ name }) => {
    if (count && !keysMap[name]) return true;
    if (keysMap[name]) {
      isPart = true;
      count += 1;
    }
    return false;
  });
  isAll = count >= showData.length;
  isPart = isAll ? false : isPart;
  return { isPart, isAll };
};

export interface NodeListProps {
  className?: string;
  triggerSave?: () => any;
}

const NodeList = (props: NodeListProps) => {
  const { className, triggerSave } = props;
  const { state, dispatch } = useCard();
  const { selectedGraph, savedData, configs, configType } = state;
  const [searchValue, setSearchValue] = useState(''); // 搜索关键字
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]); // 勾选的key
  const [changedTip, setChangedTip] = useState({ visible: false, node: {} as any }); // 切换实体的提示弹窗

  // 已配置的点类
  const savedNodeKeys = useMemo(() => {
    return _.filter(savedData, d => d.kg_id === selectedGraph?.kg_id).map(d => d.entity);
  }, [savedData, selectedGraph?.kg_id]);

  // 显示的实体点列表
  const showNodes = useMemo(() => {
    const total = [...(selectedGraph?.entity || [])];
    if (!searchValue) return total;
    return _.filter(total, d => fuzzyMatch(searchValue, d.name) || fuzzyMatch(searchValue, d.alias));
  }, [selectedGraph?.entity, searchValue]);

  // 全选的状态
  const checkedStatus = useMemo(() => boolCheckStatus(showNodes, checkedKeys), [showNodes, checkedKeys]);

  /**
   * 点击实体
   * @param node
   */
  const onNodeClick = async (node: any) => {
    if (isConfigChanged(configs)) {
      return setChangedTip({ visible: true, node });
    }
    changeNode(node);
  };

  /**
   * 切换实体
   * @param node
   * @param needSave 是否需要保存
   */
  const changeNode = (node: any, needSave?: boolean) => {
    if (!selectedGraph) return;
    changedTip.visible && setChangedTip({ visible: false, node: {} });
    if (needSave && triggerSave) {
      const saveSuccessful = triggerSave();
      if (!saveSuccessful) return; // 保存不成功, 终止
    }
    const boolKey = selectedGraph.kg_id + node.name;
    const configuredIndex = _.findIndex(savedData, d => d.kg_id + d.entity === boolKey);

    // 新配置
    if (configuredIndex === -1) {
      const defaultConfig = KNOWLEDGE_CARD.getDefaultConfig(
        configType,
        configType === 'card' ? { title: node.default_tag } : undefined
      );
      dispatch({ key: 'configs', data: { ...defaultConfig, node, activeID: defaultConfig.components[0].id } });
      return;
    }

    // 打开已有的配置
    const sort: string[] = [];
    const components = _.map(savedData[configuredIndex].components, (c, index) => {
      sort.push(String(index + 1));
      return { ...c, id: String(index + 1) };
    });
    dispatch({
      key: 'configs',
      data: { node, activeID: components[0].id, sort, components, componentsCache: _.cloneDeep(components) }
    });
  };

  /**
   * 防抖搜索
   */
  const debounceSearch = _.debounce(value => {
    setSearchValue(value);
  }, 100);

  /**
   * 勾选单个
   * @param checked 是否勾选
   * @param key 类名
   */
  const onItemCheck = (checked: boolean, key: string) => {
    setCheckedKeys(pre => (checked ? [...pre, key] : pre.filter(k => k !== key)));
  };

  /**
   * 全选
   * @param checked 是否全选
   */
  const onCheckAll = (checked: boolean) => {
    const showKeys = _.map(showNodes, n => n.name);
    setCheckedKeys(pre => (checked ? _.uniq([...pre, ...showKeys]) : pre.filter(k => !showKeys.includes(k))));
  };

  /**
   * 批量清除配置
   */
  const onClear = async () => {
    if (!selectedGraph) return;

    const isOk = await tipModalFunc({
      title: intl.get('knowledgeCard.clearTitle'),
      content: intl.get('knowledgeCard.clearTip'),
      closable: false
    });
    if (!isOk) return;

    const clearKeys = _.map(showNodes, n => n.name).filter(k => checkedKeys.includes(k));
    if (!clearKeys.length) return;
    const clearKeyMap = _.reduce(
      clearKeys,
      (res, key) => ({ ...res, [selectedGraph.kg_id + key]: true }),
      {} as Record<string, boolean>
    );
    const updateData = _.filter(savedData, d => {
      const boolKey = d.kg_id + d.entity;
      return !clearKeyMap[boolKey];
    });
    // 勾选清除的并不一定是保存过的, 这样判断减少一次更新
    if (updateData.length < savedData.length) {
      dispatch({ key: 'savedData', data: updateData });
    }
    // 清除的是当前配置的数据
    if (checkedKeys.includes(configs.node.name)) {
      dispatch({
        key: 'configs',
        data: KNOWLEDGE_CARD.getDefaultConfig(
          configType,
          configType === 'card' ? { title: configs.node.default_tag } : undefined
        )
      });
    }
    setCheckedKeys(pre => pre.filter(k => !clearKeys.includes(k)));
  };

  return (
    <div className={classNames(className, 'knw-card-config-nodes kw-flex-column kw-h-100')}>
      <div className="kw-space-between kw-mt-8 kw-mb-3 kw-pl-6 kw-pr-6">
        <Format.Title>
          <div className="t-icon kw-mr-2">
            <div />
          </div>
          {intl.get('global.entityClass')}
        </Format.Title>
        <div>
          <span className="kw-c-primary">{savedNodeKeys.length}</span>
          <span className="kw-c-watermark" style={{ fontSize: 16 }}>
            /
          </span>
          <span>{selectedGraph?.entity?.length || 0}</span>
        </div>
      </div>
      <div className="kw-mb-3 kw-pl-6 kw-pr-6">
        <SearchInput
          placeholder={intl.get('exploreGraph.searchEntityClass')}
          autoWidth
          onChange={e => debounceSearch(e.target.value)}
        />
      </div>
      <div className="kw-flex-item-full-height" style={{ overflow: 'auto' }}>
        {_.map(showNodes, node => {
          return (
            <div
              key={node.name}
              className={classNames('node-row kw-align-center kw-pl-6 kw-pr-6', {
                checked: configs?.node?.name === node.name
              })}
            >
              <Checkbox
                className="kw-mr-2"
                checked={_.includes(checkedKeys, node.name)}
                onChange={e => onItemCheck(e.target.checked, node.name)}
              />
              <div className="node-icon kw-mr-2" style={{ background: node.color }} />
              <div
                className="node-name kw-flex-item-full-width kw-ellipsis kw-pointer"
                onClick={() => onNodeClick(node)}
              >
                {node.name}&nbsp;({node.alias})
              </div>
              {_.includes(savedNodeKeys, node.name) && (
                <IconFont type="icon-duigou" className="kw-ml-2 kw-c-primary" style={{ fontSize: 20 }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="kw-space-between kw-p-6 kw-pt-1">
        <Checkbox
          checked={checkedStatus.isAll}
          indeterminate={checkedStatus.isPart}
          onChange={e => onCheckAll(e.target.checked)}
        >
          {intl.get('global.checkAll')}
        </Checkbox>
        <Button
          type="default"
          disabled={!showNodes.length || !(checkedStatus.isAll || checkedStatus.isPart)}
          onClick={onClear}
        >
          {intl.get('knowledgeCard.clearBtn')}
        </Button>
      </div>

      <TipModal
        title={intl.get('knowledgeCard.changedTipTitle')}
        content={intl.get('knowledgeCard.changedTip')}
        okText={intl.get('global.save')}
        visible={changedTip.visible}
        onOk={() => changeNode(changedTip.node, true)}
        onCancel={() => setChangedTip({ visible: false, node: {} })}
        extractBtn={<Button onClick={() => changeNode(changedTip.node)}>{intl.get('global.notSave')}</Button>}
      />
    </div>
  );
};

export default NodeList;
