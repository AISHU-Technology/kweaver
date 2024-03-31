/**
 * 批量导入实体类弹窗
 */
import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Select, Empty, Input, message } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

import servicesCreateEntity from '@/services/createEntity';
import { DS_SOURCE } from '@/enums';
import TemplateModal from '@/components/TemplateModal';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';

import { DataSheet, FileTree, PreviewTable, PreviewJson, parseToTable } from '@/components/SourceImportComponent';
import { DsSourceItem, PreviewColumn } from '@/components/SourceImportComponent/types';

import { SOURCE_IMG_MAP } from './assistant';
import kongImg from '@/assets/images/kong.svg';
import guideImg from '@/assets/images/flow4Empty.svg';
import invalidFileImg from '@/assets/images/invalidFile.svg';
import './style.less';

export interface EntityImportModalProps {
  graphId: number;
  visible: boolean;
  onCancel: () => void;
  onOk: (data: any) => void;
}

type ViewType = 'table' | 'json';
const { Option } = Select;

const defaultLoading = { left: false, right: false };
const loadingReducer = (pre: typeof defaultLoading, next: Partial<typeof defaultLoading>) => ({ ...pre, ...next });

const EntityImportModal = (props: EntityImportModalProps) => {
  const { visible, graphId, onOk, onCancel } = props;
  const postfix = useRef<string | undefined>(); // as文件类型, csv | json
  const [sourceData, setSourceData] = useState<DsSourceItem[]>([]); // 已分类的数据源
  const [selectedSource, setSelectedSource] = useState<DsSourceItem>({} as DsSourceItem); // 选择的数据源
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]); // 勾选的数据
  const [selectedKey, setSelectedKey] = useState<string | undefined>(); // 选中查看的数据
  const [tableData, setTableData] = useState<PreviewColumn[]>([]); // 预览的表格数据
  const [viewType, setViewType] = useState<ViewType>('table'); // 预览的视图类型
  const [loading, dispatchLoading] = useReducer(loadingReducer, defaultLoading); // 左右loading
  const [errorMap, setErrorMap] = useState<Record<string, string>>({}); // 错误信息

  useEffect(() => {
    getSourceList();
  }, [graphId]);

  /**
   * 获取数据源
   */
  const getSourceList = async () => {
    dispatchLoading({ left: true });
    const { res, Description } = (await servicesCreateEntity.getFlowSource({ id: graphId, type: 'filter' })) || {};
    dispatchLoading({ left: false });
    if (!res) {
      // return Description && message.error(Description);
      return (
        Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        })
      );
    }
    const firstItem = res.df[0];
    setSourceData(res.df);

    if (!firstItem) return;
    setSelectedSource(firstItem);

    // rabbitmq的队列相当于一个抽取文件
    if (firstItem.data_source === DS_SOURCE.mq) {
      setCheckedKeys([firstItem.queue]);
      setViewType('json');
    }
  };

  /**
   * 清除数据
   */
  const clearData = () => {
    setViewType('table');
    setTableData([]);
    setCheckedKeys([]);
    setSelectedKey(undefined);
    setErrorMap({});
  };

  /**
   * 切换数据源
   * @param id 数据源id
   */
  const onSourceChange = (id: number) => {
    if (!id) {
      clearData();
      setSelectedSource({} as any);
    }

    setCheckedKeys([]);
    setSelectedKey(undefined);
    setErrorMap({});

    const source = _.find(sourceData, d => d.id === id);
    if (!source) return;
    setSelectedSource(source);

    if (source.data_source === DS_SOURCE.mq) {
      setCheckedKeys([source.queue]);
      setViewType('json');
    }
  };

  /**
   * 预览数据表
   * @param name 数据表名 | 文件docid | 队列名称
   */
  const onPreview = async (name?: string, source?: DsSourceItem) => {
    setSelectedKey(name);
    if (!name) {
      clearData();
      return;
    }
    const curSource = source || selectedSource;
    const params = {
      id: curSource.id,
      data_source: curSource.data_source,
      name
    };

    try {
      dispatchLoading({ right: true });
      const { res, ErrorCode, ErrorDetails } = (await servicesCreateEntity.getOtherPreData(params)) || {};
      dispatchLoading({ right: false });
      if (res) {
        setTableData(parseToTable(res));
        return;
      }
      setTableData([]);
      if (ErrorCode) {
        setErrorMap({ ...errorMap, [name]: ErrorDetails });
      }
    } catch {
      dispatchLoading({ right: false });
    }
  };

  /**
   * 树选择
   * @param keys 选中的key, 是json字符串列表
   */
  const onTreeChange = (keys: any[], fix?: string) => {
    setCheckedKeys(keys);
    postfix.current = fix;
  };

  /**
   * 点击确认添加
   */
  const onHandleOk = () => {
    if (!checkedKeys.length) {
      // return message.error(intl.get('createEntity.importNullTip'));
      return message.error({
        content: intl.get('createEntity.importNullTip'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
    let type = '';
    let data: any = checkedKeys;
    const selectedValue: any = { ...selectedSource };
    switch (true) {
      case [DS_SOURCE.hive, DS_SOURCE.mysql].includes(selectedValue.data_source):
        type = 'sql';
        break;
      case [DS_SOURCE.postgresql, DS_SOURCE.kingbasees, DS_SOURCE.sqlserver].includes(selectedValue.data_source):
        type = 'king';
        break;
      case selectedValue.data_source === DS_SOURCE.mq:
        type = 'rabbitmq';
        data = selectedValue;
        break;
      default:
        type = 'as';
        selectedValue.postfix = postfix.current || 'csv';
        data = checkedKeys.map((d: string) => [_.pick(JSON.parse(d), 'docid', 'name', 'type')]);
    }
    onOk({ type, selectedValue, data });
  };

  return (
    <TemplateModal
      title={intl.get('createEntity.importNodeBatchT')}
      className="flow-3-entity-import-modal"
      visible={visible}
      // visible
      width={1000}
      onOk={onHandleOk}
      onCancel={() => onCancel()}
    >
      <div className="m-main kw-flex">
        <div className="data-box kw-flex-column">
          <LoadingMask loading={loading.left} />

          {/* 数据源 */}
          <div className="rows kw-align-center kw-mt-5">
            <div className="row-label">{intl.get('workflow.information.dataName')}</div>
            <div className="row-content">
              <Select
                className="kw-w-100"
                // optionFilterProp="label"
                // allowClear
                // showArrow
                // showSearch
                value={selectedSource?.id}
                onChange={onSourceChange}
                getPopupContainer={triggerNode => triggerNode.parentElement}
                notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              >
                {_.map(sourceData, item => (
                  <Option key={item.id} value={item.id} label={item.dsname}>
                    <div className="kw-flex">
                      <div className="kw-mr-2">
                        <img className="source-icon" src={SOURCE_IMG_MAP[item.data_source]} alt="KWeaver" />
                      </div>
                      <div className="source-info">
                        <div className="kw-c-header kw-ellipsis" title={item.dsname}>
                          {item.dsname}
                        </div>
                        <div className="kw-c-subtext kw-ellipsis">{item.ds_path || '--'}</div>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {selectedSource.data_source === DS_SOURCE.mq ? (
            // 队列名称
            <div className="rows kw-align-center kw-mt-5">
              <div className="row-label">{intl.get('datamanagement.queue')}</div>
              <div className="row-content">
                <Input value={selectedSource.queue} disabled />
              </div>
            </div>
          ) : (
            // 数据列表
            <div className="rows tree-row kw-flex kw-mt-5">
              <div className="row-label">{intl.get('workflow.information.tables')}</div>
              <div className="row-content">
                {['mysql', 'hive'].includes(selectedSource.data_source) && (
                  <DataSheet
                    key={selectedSource.id}
                    source={selectedSource}
                    checkedValues={checkedKeys}
                    selectedKey={selectedKey}
                    errors={errorMap}
                    extraTip={intl.get('createEntity.predictTip')}
                    onChange={keys => setCheckedKeys(keys)}
                    onNameClick={onPreview}
                  />
                )}

                {['as7', 'sqlserver', 'kingbasees', 'postgresql'].includes(selectedSource.data_source) && (
                  <FileTree
                    key={selectedSource.id}
                    source={selectedSource}
                    checkedKeys={checkedKeys}
                    selectedKey={selectedKey}
                    errors={errorMap}
                    extraTip={intl.get('createEntity.predictTip')}
                    onChange={onTreeChange}
                    onRowClick={onPreview}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="preview-box kw-flex-column">
          <LoadingMask loading={loading.right} />

          <div className="kw-mb-3 kw-c-header">
            {intl.get('workflow.information.preview')}
            <span className="kw-ml-2 kw-c-subtext">
              {selectedSource.data_source === DS_SOURCE.mq
                ? intl.get('workflow.information.showSchema')
                : intl.get('workflow.information.previewSome')}
            </span>
          </div>

          <div className="view-wrap">
            <div className={classNames('kw-w-100 kw-h-100', { 'hide-view': viewType !== 'table' })}>
              <PreviewTable showLess data={tableData} shouldCheck={false} />
            </div>
            <div className={classNames('kw-w-100 kw-h-100', { 'hide-view': viewType !== 'json' })}>
              <PreviewJson data={selectedSource.json_schema} />
            </div>

            {(selectedSource.data_source === DS_SOURCE.mq
              ? !selectedSource.json_schema
              : !tableData.length && !loading.right) && (
              <div className="tip-container">
                <NoDataBox
                  imgSrc={selectedKey ? (errorMap[selectedKey] ? invalidFileImg : kongImg) : guideImg}
                  desc={
                    selectedKey
                      ? errorMap[selectedKey] || intl.get('workflow.information.dataEmpty')
                      : intl.get('workflow.information.addSourceTip')
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TemplateModal>
  );
};

export default EntityImportModal;
