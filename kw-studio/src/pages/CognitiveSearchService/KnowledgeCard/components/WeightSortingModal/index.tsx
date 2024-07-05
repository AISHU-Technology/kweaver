import React, { useState, useEffect, useMemo } from 'react';
import { Button, Alert, Select, Tooltip, Empty, message } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import servicesSearchConfig from '@/services/searchConfig';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import IconFont from '@/components/IconFont';
import NumberInput from '@/components/NumberInput';
import NoDataBox from '@/components/NoDataBox';
import kongImg from '@/assets/images/kong.svg';
import './style.less';
import { WeightItem } from './types';
import { getPermissionIds } from '../../utils';

export interface WeightSortingModalProps {
  className?: string;
  visible?: boolean;
  graphSources?: any[]; // 已配置的图谱资源
  data?: WeightItem[]; // 已配置的权重
  onCancel?: () => void;
  onOk?: (data: WeightItem[]) => void;
}

/** 权重排序弹窗 */
const WeightSortingModal = (props: WeightSortingModalProps) => {
  const { className, visible, graphSources, data, onCancel, onOk } = props;
  const [tableDIV, setTableDiv] = useState<HTMLDivElement | null>(null);
  const [weightList, setWeightList] = useState<WeightItem[]>(() => (data ? [...data] : [])); // 外部是真条件渲染可以这样写
  const [totalOptionsObj, setTotalOptionsObj] = useState<any>({});
  const [permissionIds, setPermissionIds] = useState<string[]>([]); // 有权限的图谱id

  const usedOptionsObj = useMemo(() => {
    return _.reduce(
      weightList,
      (res, item) => {
        if (!item.kg_id || !item.entity) return res;
        res[item.kg_id] ? res[item.kg_id].push(item.entity) : (res[item.kg_id] = [item.entity]);
        return res;
      },
      {} as Record<number, string[]>
    );
  }, [totalOptionsObj, weightList]);

  useEffect(() => {
    verifyGraphAuth();
  }, []);

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
    initTotalOptions(pIds);
  };

  /**
   * 初始化所有可配置的实体类
   */
  const initTotalOptions = async (permissionIds: string[]) => {
    try {
      const responseList = await Promise.all(
        _.map(permissionIds, id => servicesSearchConfig.fetchCanvasData(id)).map(promiseItem =>
          promiseItem.catch(err => err)
        )
      );
      const resMap: any = {};
      _.forEach(permissionIds, (id, index) => {
        resMap[id] = responseList[index]?.res;
      });
      const options: any[] = [];
      _.forEach(graphSources, item => {
        const entity = resMap[item.kg_id]?.entity;
        options.push({
          value: item.kg_id,
          label: item.kg_name,
          disabled: !permissionIds.includes(String(item.kg_id)),
          data: _.map(entity, node => ({ value: node.name, label: node.alias }))
        });
      });
      setTotalOptionsObj(_.keyBy(options, 'value'));
    } catch (err) {
      //
    }
  };

  /**
   * 添加权重配置
   */
  const onAdd = () => {
    let kg_id = 0;
    // [bug 483266] 只有一个图谱可选择时自动填充
    if (permissionIds.length === 1) {
      kg_id = Number(permissionIds[0]);
    }
    setWeightList(pre => [...pre, { kg_id, entity: '', weight: 0 }]);

    // 添加时滑到底部
    const scrollDOM = tableDIV?.querySelector('.scroll-wrap');
    if (!scrollDOM) return;
    setTimeout(() => {
      scrollDOM.scrollTop = scrollDOM.scrollHeight;
    }, 0);
  };

  /**
   * 变更
   * @param value 值
   * @param field 变更的字段
   * @param index 变更的索引
   */
  const onChange = (value: any, field: keyof WeightItem, index: number) => {
    const newWeightList = [...weightList];
    const newItem = { ...newWeightList[index], [field]: value };
    newItem.error = _.omit(newItem.error, field);
    newWeightList[index] = newItem;
    setWeightList(newWeightList);
  };

  /**
   * 删除权重配置
   * @param index 删除的数组下标
   */
  const handleDelete = (index: number) => {
    const newWeightList = [...weightList];
    newWeightList.splice(index, 1);
    setWeightList(newWeightList);
  };

  /**
   * 权重输入框失焦触发排序
   */
  const onNumberBlur = () => {
    setWeightList(pre => _.orderBy(pre, item => item.weight, 'desc'));
  };

  /**
   * 点击保存
   */
  const handleOk = () => {
    let firstErrorIndex = -1;
    const data = _.map(weightList, (item, index) => {
      if (item.kg_id && item.entity) {
        return _.omit(item, 'error');
      }
      if (!item.kg_id) {
        firstErrorIndex === -1 && (firstErrorIndex = index);
        item.error = { ...(item.error || {}), kg_id: intl.get('global.pleaseEnter') };
      }
      if (!item.entity) {
        firstErrorIndex === -1 && (firstErrorIndex = index);
        item.error = { ...(item.error || {}), entity: intl.get('global.pleaseEnter') };
      }
      return item;
    });
    if (firstErrorIndex > -1) {
      const scrollDOM = tableDIV?.querySelector('.scroll-wrap');
      scrollDOM && (scrollDOM.scrollTop = firstErrorIndex * 44 - 12);
      setWeightList(data);
      return;
    }
    onOk?.(data);
  };

  /**
   * 下拉框过滤已配置的实体
   * @param item
   */
  const getNodeOptions = (item: WeightItem) => {
    if (!item.kg_id) return [];
    const nodeOptions = totalOptionsObj[item.kg_id]?.data || [];
    let usedNodes = [...(usedOptionsObj[item.kg_id] || [])];
    if (item.entity) {
      usedNodes = _.without(usedNodes, item.entity);
    }
    return _.filter(nodeOptions, d => !usedNodes.includes(d.value));
  };

  return (
    <UniversalModal
      className={classNames(className, 'knw-card-weight-sorting')}
      title={intl.get('exploreAnalysis.sort')}
      okText={intl.get('global.save')}
      width={800}
      open={visible}
      // footerExtra={
      //   <div>
      //     {!!weightList.length && (
      //       <Button onClick={onAdd}>
      //         <IconFont type="icon-Add" />
      //         {intl.get('global.add')}
      //       </Button>
      //     )}
      //   </div>
      // }
      onCancel={onCancel}
      onOk={handleOk}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.save'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div style={{ height: '450px', paddingRight: 24 }}>
        <div className="kw-flex-column kw-h-100">
          <Alert
            message={intl.get('knowledgeCard.sortTip')}
            type="info"
            showIcon
            style={{ backgroundColor: '#e6f4ff', borderColor: '#bae0ff' }}
          />
          <div ref={setTableDiv} className="table-box kw-flex-item-full-height kw-mt-5">
            {!!weightList.length && (
              <div className="th-box kw-flex kw-mb-3 kw-c-subtext">
                <div className="th-graph kw-flex-item-full-width">{intl.get('global.domainGraph')}</div>
                <div className="th-class kw-flex-item-full-width">{intl.get('global.entityClass')}</div>
                <div className="th-weight">{intl.get('knowledgeCard.weight')}</div>
              </div>
            )}
            <div
              className="scroll-wrap"
              style={{
                position: 'relative',
                height: 'calc(100% - 34px)',
                width: (tableDIV?.clientWidth || 0) + 20,
                overflow: 'auto'
              }}
            >
              <div style={{ width: tableDIV?.clientWidth || 0 }}>
                {_.map(weightList, (item, index: number) => {
                  const { kg_id, entity, weight, error } = item;
                  const hasPermission = !item.kg_id || !entity || permissionIds.includes(String(item.kg_id));

                  return (
                    <div
                      key={String(index)}
                      className={classNames('tr-rows kw-align-center kw-mb-3', { disabled: !hasPermission })}
                    >
                      <Tooltip title={intl.get('global.delete')}>
                        <IconFont
                          type="icon-del"
                          className="del-icon kw-pointer"
                          onClick={() => hasPermission && handleDelete(index)}
                        />
                      </Tooltip>
                      <Select
                        className={classNames('kw-flex-item-full-width kw-ml-3', { 'error-border': !!error?.kg_id })}
                        placeholder={intl.get('global.pleaseSelect')}
                        options={_.values(totalOptionsObj)}
                        value={kg_id || undefined}
                        disabled={!hasPermission}
                        onChange={v => hasPermission && onChange(v, 'kg_id', index)}
                        listHeight={32 * 6}
                        notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                        getPopupContainer={() => tableDIV?.querySelector('.scroll-wrap') || document.body}
                      />
                      <Select
                        className={classNames('kw-flex-item-full-width kw-ml-3', { 'error-border': !!error?.entity })}
                        placeholder={intl.get('global.pleaseSelect')}
                        options={getNodeOptions(item)}
                        value={entity || undefined}
                        disabled={!hasPermission}
                        onChange={v => hasPermission && onChange(v, 'entity', index)}
                        listHeight={32 * 6}
                        notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                        getPopupContainer={() => tableDIV?.querySelector('.scroll-wrap') || document.body}
                      />
                      <NumberInput
                        className="kw-ml-3"
                        defaultValue={0}
                        min={-100}
                        max={100}
                        value={weight}
                        disabled={!hasPermission}
                        onChange={v => hasPermission && onChange(v, 'weight', index)}
                        onBlur={onNumberBlur}
                      />
                    </div>
                  );
                })}

                {
                  <div>
                    {!!weightList.length && (
                      <div className="kw-c-primary kw-pointer" onClick={onAdd}>
                        <IconFont type="icon-Add" style={{ marginRight: '8px' }} />
                        {intl.get('global.add')}
                      </div>
                    )}
                  </div>
                }

                {!weightList.length && (
                  <NoDataBox
                    imgSrc={kongImg}
                    desc={
                      <>
                        {intl.get('knowledgeCard.addSortTip').split('|')[0]}
                        <span className="kw-c-primary kw-pointer" onClick={onAdd}>
                          {intl.get('knowledgeCard.addSortTip').split('|')[1]}
                        </span>
                        {intl.get('knowledgeCard.addSortTip').split('|')[2]}
                      </>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: WeightSortingModalProps) => (props.visible ? <WeightSortingModal {...props} /> : null);
