import React, { useEffect, useMemo, useState } from 'react';
import './style.less';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import { PreviewCanvas, PreviewJson, PreviewTable } from '@/components/SourceImportComponent';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';
import ParsingSetting from '@/components/ParsingSetting';
import RuleSettingModal from './RuleSettingModal';
import TimePickerSetting from '@/components/TimePickerSetting';
import Format from '@/components/Format';
import ParamCodeEditor from '@/components/ParamCodeEditor';
import { SwapOutlined } from '@ant-design/icons';
import _ from 'lodash';
import classNames from 'classnames';

const DataBoardTypes = ['table', 'json', 'canvas'] as const;

export type DataBoardType = (typeof DataBoardTypes)[number];

export type DataFileProps = {
  file_name?: any; // 文件名
  // file_name?: string; // 文件名
  partition_usage?: any;
  partition_infos?: any;
  data_source?: string; // 数据源类型
  extract_type?: string; // 抽取类型
  ds_id?: number; // 数据源id
};

export interface DataBoardProps {
  dataFile?: DataFileProps; // 数据文件自身的信息
  data: any; // 面板的数据源
  type?: DataBoardType; // 显示类型
  error: string; // 错误信息
  loading?: boolean; // 加载状态
  file?: any;
  // tableHeaderCheckedKey?: string[]; // 表头选中的key
  tableHeaderCheckedKey?: any; // 表头选中的key
  onTableHeaderCheckboxChange?: (checkedKey: string[]) => void; // 表头选中值变化事件

  // hive 数据库才配置的分区相关props
  partitionData?: Record<string, any>; // 分区字段
  onPartitionChange?: (fields: string[]) => void; // 分区字段值变化事件

  onRefreshData?: () => void; // 同步数据回调
  currentSelectedDS?: any;
  selectFileType?: string;
  parsingChange?: any;
  setParsingChange?: any;
  requestId?: any;
  setRequestId?: any;
  onParsingChange?: any;
  defaultParsingRule?: any;
  parsingSet?: any;
  setParsingSet?: (data: any) => void;
  parsingTreeChange?: any;
  editData?: any;
  currentParse?: any;
  onBlur?: () => void;
  requestIdRef?: any;
  arFileSave?: any;
  setArFileSave?: (data: any) => void;
  onSetTimeToPreview?: (data: any) => void;
  operateType?: string;
}

const DataBoard: React.FC<DataBoardProps> = props => {
  const {
    dataFile = {},
    data = [],
    type = 'table',
    file = {},
    error = '',
    loading = false,
    tableHeaderCheckedKey = [],
    onTableHeaderCheckboxChange,

    partitionData = {},
    onPartitionChange,
    onRefreshData,
    currentSelectedDS,
    selectFileType,
    parsingChange,
    setParsingChange,
    requestId,
    setRequestId,
    requestIdRef,
    onParsingChange,
    defaultParsingRule,
    currentParse,
    parsingTreeChange,
    onBlur,
    editData,
    arFileSave,
    setArFileSave,
    onSetTimeToPreview,
    operateType
  } = props;
  const [extractModal, setExtractModal] = useState({
    visible: false
  });
  const [modelDataShowType, setModelDataShowType] = useState<'canvas' | 'table'>('canvas');

  /**
   * 刷新数据按钮点击事件
   */
  const refreshData = async () => {
    onRefreshData?.();
  };

  const handleModalOk = (keys: string[], type?: string) => {
    if (type === 'partition') {
      onPartitionChange && onPartitionChange(keys);
    }
    if (type === 'extraction') {
      onTableHeaderCheckboxChange && onTableHeaderCheckboxChange(keys);
    }
  };

  const imgDesc = useMemo(() => {
    if (_.isEmpty(dataFile)) {
      return {
        img: require('@/assets/images/flow4Empty.svg').default,
        desc: intl.get('workflow.knowledgeMap.addDataFileTip')
      };
    }
    if (error) {
      return {
        img: require('@/assets/images/invalidFile.svg'),
        desc: error
      };
    }
    return {
      img: require('@/assets/images/empty.svg'),
      desc: intl.get('workflow.information.dataEmpty')
    };
  }, [dataFile, error]);
  const prefixCls = 'data-board';
  const prefixLocale = 'workflow.knowledgeMap';
  return (
    <div className={`${prefixCls}-root kw-flex-column kw-w-100 kw-h-100 kw-pl-6 kw-pr-6`}>
      <LoadingMask loading={loading} />

      {/* 流程四数据源右侧解析规则 */}
      {['as', 'as7'].includes(currentSelectedDS?.current?.data_source) &&
      currentSelectedDS?.current?.dataType === 'structured' &&
      selectFileType === 'csv' &&
      dataFile?.file_name?.split('.')[1] === 'csv' &&
      !_.isEmpty(dataFile) ? (
        <ParsingSetting
          parsingChange={parsingChange}
          setParsingChange={setParsingChange}
          onChange={onParsingChange}
          setRequestId={setRequestId}
          requestId={requestId}
          requestIdRef={requestIdRef}
          editData={editData}
          parsingFileSet={currentParse}
          defaultParsingRule={defaultParsingRule}
          selectedKey={file?.key}
          onBlur={onBlur}
        />
      ) : null}
      {type === 'table' && data.length > 0 && (
        <>
          <div>
            <div className="kw-mb-2">
              <Format.Title>
                {operateType
                  ? intl.get('domainData.searchResult')
                  : dataFile.file_name || intl.get(`${prefixLocale}.sampleData`)}
              </Format.Title>
            </div>
            <div className="kw-flex">
              <div className="kw-flex table-head-btn">
                <Button type="primary" onClick={() => setExtractModal(prevState => ({ ...prevState, visible: true }))}>
                  <IconFont type="icon-setting" />
                  {intl.get('workflow.information.extraction')}
                </Button>
                <Button onClick={refreshData} className="kw-ml-2">
                  <IconFont type="icon-tongyishuaxin" />
                  {intl.get(`${prefixLocale}.refreshData`)}
                </Button>
              </div>

              <div className="kw-flex table-warning">
                <IconFont type="icon-Warning" className="icon" style={{ color: '#FAAD14' }} />
                {intl.get('workflow.information.showOnly')}
              </div>
            </div>
          </div>
          <div className="kw-flex-item-full-height kw-mt-3">
            <PreviewTable
              data={data}
              checkedKeys={tableHeaderCheckedKey}
              shouldCheck={true}
              onCheck={onTableHeaderCheckboxChange}
              selectFile={dataFile}
              partitionMes={[partitionData]}
            />
          </div>
        </>
      )}
      {type === 'json' && (
        <>
          <div className="kw-mb-2">
            <Format.Title>{intl.get(`${prefixLocale}.jsonSchema`)}</Format.Title>
          </div>
          <ParamCodeEditor height="100%" value={data} className="kw-flex-item-full-height" disabled />
        </>
      )}
      {type === 'canvas' && (
        <>
          <div className="kw-mb-2">
            <Format.Title>{intl.get(`${prefixLocale}.modelData`)}</Format.Title>
            <Format.Button
              type="text"
              size="small"
              onClick={() => {
                setModelDataShowType(prevState => {
                  return prevState === 'table' ? 'canvas' : 'table';
                });
              }}
            >
              <SwapOutlined />
              {intl.get('workflow.information.viewChange')}
            </Format.Button>
          </div>
          {modelDataShowType === 'canvas' ? (
            <PreviewCanvas graphData={data.graphData} />
          ) : (
            <PreviewTable data={data.tableData} shouldCheck={false} />
          )}
        </>
      )}
      {(error || !data || (data.length === 0 && !loading)) && (
        <div className="kw-w-100 kw-h-100 kw-center">
          <NoDataBox imgSrc={imgDesc.img} desc={imgDesc.desc} />
        </div>
      )}

      {/* 时间设置 */}
      {currentSelectedDS?.current?.data_source === 'AnyRobot' && (dataFile?.file_name || !_.isEmpty(editData)) ? (
        <TimePickerSetting
          arFileSave={arFileSave}
          setArFileSave={setArFileSave}
          selectedKey={dataFile?.file_name}
          onSetTimeToPreview={onSetTimeToPreview}
          editData={editData}
          type="four"
        />
      ) : null}

      <RuleSettingModal
        visible={extractModal.visible}
        data={data}
        checkedKeys={tableHeaderCheckedKey!}
        onOk={handleModalOk}
        partitionMes={[partitionData]} // partitionMes 存放所有表的分区数据
        selectFile={dataFile}
        onCancel={() => {
          setExtractModal(prevState => ({ ...prevState, visible: false }));
        }}
        partitionModal={''} // 控制抽取设置弹框左侧的菜单选中项, 默认选中抽取规则菜单项
      />
    </div>
  );
};

export default DataBoard;
