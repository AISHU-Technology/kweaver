import React, { useRef, useState } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, Dropdown, Menu, Tooltip } from 'antd';

import { EXTRACT_TYPE } from '@/enums';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import SqlExtractModal from './SqlExtractModal/SqlExtractModal';
import AddDataFileModal from './AddDataFileModal/AddDataFileModal';
import OperationTooltip from './OperationTooltip/OperationTooltip';
import KnowledgeMapX6, { KnowledgeMapX6RefProps } from './KnowledgeMapX6/KnowledgeMapX6';
import { DataFileType } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

import './style.less';

/**
 * 知识图谱右侧容器
 * @constructor
 */
const KMRightContainer = (props: any) => {
  const {
    defaultParsingRule,
    parsingSet,
    setParsingSet,
    parsingTreeChange,
    setParsingTreeChange,
    onX6BlankClick,
    arFileSave,
    setArFileSave
  } = props;
  const [dataFileModal, setDataFileModal] = useState({
    visible: false,
    isEdit: true,
    editData: [] as DataFileType[]
  });
  const [sqlModalProps, setSqlModalProps] = useState({
    visible: false,
    editData: null as DataFileType | null
  });
  const {
    knowledgeMapStore: { selectedG6Edge, selectedG6Node, currentDataFile, selectedModel, graphKMap, viewMode }
  } = useKnowledgeMapContext();
  const [selectFileType, setSelectFileType] = useState('csv'); // 选择的文件类型 csv|json
  const x6ContainerRef = useRef<KnowledgeMapX6RefProps | null>(null);
  const isAutoMapPropsSign = useRef<boolean>(false); // 是否进行自动属性映射
  const [currentParse, setCurrentParse] = useState<any>([]); // 未保存时解析规则
  const prefixCls = 'km-right-container';
  const prefixLocale = 'workflow.knowledgeMap';
  const onMenuItemClick = ({ key }: { key: string }) => {
    if (key === '1') {
      let editData: DataFileType[] = [];
      if (!_.isEmpty(currentDataFile) && currentDataFile[0].extract_type === EXTRACT_TYPE.MODEL) {
        editData = currentDataFile;
      }
      setDataFileModal(preState => ({
        ...preState,
        isEdit: false,
        visible: true,
        editData
      }));
      setParsingSet([]);
      setArFileSave([]);
    }
    if (key === '2') {
      setSqlModalProps(preState => ({
        ...preState,
        visible: true,
        editData: null
      }));
    }
  };

  /**
   * 编辑数据文件
   */
  const handleEditDataFile = (dataFile: DataFileType) => {
    if (dataFile.extract_type === EXTRACT_TYPE.SQL) {
      setSqlModalProps(prevState => ({
        ...prevState,
        visible: true,
        editData: dataFile
      }));
    } else {
      setDataFileModal(prevState => ({
        ...prevState,
        visible: true,
        isEdit: true,
        editData: [dataFile]
      }));
    }
  };

  const getDeleteBtnDisabled = () => {
    let disabled = true;
    if (selectedG6Node.length > 0) {
      graphKMap.entity.forEach(entity => {
        if (entity.name === selectedG6Node[0]._sourceData.name) {
          entity.property_map.forEach(item => {
            if (item.entity_prop) {
              disabled = false;
            }
          });
        }
      });
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData } = selectedG6Edge[0];
      graphKMap.edge.forEach(edge => {
        if (_.isEqual(edge.relations, edgeData._sourceData.relations)) {
          edge.property_map.forEach(item => {
            if (item.entity_prop) {
              disabled = false;
            }
          });
          if (disabled) {
            if (edge.relation_map.equation || edge.relation_map.equation_begin || edge.relation_map.equation_end) {
              disabled = false;
            }
          }
        }
      });
    }
    if (selectedModel.length > 0) {
      graphKMap.files.forEach(file => {
        if (selectedModel.includes(file.extract_model as any)) {
          disabled = false;
        }
      });
    }
    return disabled;
  };

  return (
    <div className="kw-w-100 kw-h-100 kw-bg-white kw-flex-column">
      {!viewMode && (
        <div className={`${prefixCls}-tools kw-pl-1 kw-w-100 kw-border-b kw-align-center`}>
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu onClick={onMenuItemClick}>
                <Menu.Item key="1">{intl.get(`${prefixLocale}.quickSelect`)}</Menu.Item>
                <Menu.Item disabled={selectedModel.length > 0} key="2">
                  {intl.get(`${prefixLocale}.sqlCreate`)}
                </Menu.Item>
              </Menu>
            }
            disabled={selectedG6Node.length === 0 && selectedG6Edge.length === 0 && selectedModel.length === 0}
            trigger={['click']}
          >
            <Tooltip title={intl.get(`${prefixLocale}.addFile`)}>
              <Format.Button
                type="icon"
                disabled={selectedG6Node.length === 0 && selectedG6Edge.length === 0 && selectedModel.length === 0}
              >
                <IconFont style={{ fontSize: 16 }} type="icon-tianjiashuju2" />
              </Format.Button>
            </Tooltip>
          </Dropdown>
          <Tooltip title={intl.get(`${prefixLocale}.autoPropsMap`)}>
            <Format.Button
              type="icon"
              onClick={() => {
                x6ContainerRef.current?.autoMapProps();
              }}
              disabled={currentDataFile.length === 0 || selectedModel.length > 0}
            >
              <IconFont style={{ fontSize: 16 }} type="icon-tianjialianjie1" />
            </Format.Button>
          </Tooltip>
          <Tooltip
            title={
              selectedModel.length === 0
                ? intl.get(`${prefixLocale}.deletePropsMap`)
                : intl.get(`${prefixLocale}.clearAllDataFile`)
            }
          >
            <Format.Button
              type="icon"
              onClick={() => {
                x6ContainerRef.current?.clearMap();
              }}
              disabled={getDeleteBtnDisabled()}
            >
              <IconFont style={{ fontSize: 16 }} type="icon-lajitong" />
            </Format.Button>
          </Tooltip>
        </div>
      )}

      <div className="kw-flex-item-full-height">
        {selectedG6Node.length > 0 || selectedG6Edge.length > 0 || selectedModel.length > 0 ? (
          <KnowledgeMapX6
            onEditDataFile={handleEditDataFile}
            ref={x6ContainerRef}
            isAutoMapPropsSignRef={isAutoMapPropsSign}
            parsingSet={parsingSet}
            setParsingSet={setParsingSet}
            defaultParsingRule={defaultParsingRule}
            selectFileType={selectFileType}
            setCurrentParse={setCurrentParse}
            onX6BlankClick={onX6BlankClick}
            // isEdit={dataFileModal.isEdit}
            arFileSave={arFileSave}
            setArFileSave={setArFileSave}
          />
        ) : (
          <OperationTooltip />
        )}
      </div>

      {dataFileModal.visible && (
        <AddDataFileModal
          onCancel={() => {
            setDataFileModal(preState => ({
              ...preState,
              visible: false
            }));
            setCurrentParse([]);
            setArFileSave([]);
          }}
          editData={dataFileModal.editData}
          isAutoMapPropsSignRef={isAutoMapPropsSign}
          x6ContainerRef={x6ContainerRef}
          defaultParsingRule={defaultParsingRule}
          parsingSet={parsingSet}
          setParsingSet={setParsingSet}
          selectFileType={selectFileType}
          setSelectFileType={setSelectFileType}
          parsingTreeChange={parsingTreeChange}
          setParsingTreeChange={setParsingTreeChange}
          currentParse={currentParse}
          setCurrentParse={setCurrentParse}
          arFileSave={arFileSave}
          setArFileSave={setArFileSave}
        />
      )}

      {sqlModalProps.visible && (
        <SqlExtractModal
          onCancel={() => {
            setSqlModalProps(preState => ({
              ...preState,
              visible: false,
              editData: null
            }));
          }}
          editData={sqlModalProps.editData}
          listData={[]}
          isAutoMapPropsSignRef={isAutoMapPropsSign}
          x6ContainerRef={x6ContainerRef}
        />
      )}
    </div>
  );
};

export default KMRightContainer;
