import React, { useState, useRef } from 'react';
import { Modal, Tooltip, ConfigProvider, Button } from 'antd';

import _ from 'lodash';

import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import UniversalModal from '@/components/UniversalModal';

import ModalSourceMatch from './ModalSourceMatch';
import ModalImport from './ModalImport';

import './style.less';

const ImportModal = (props: any) => {
  const {
    step,
    visible,
    knowledge,
    modalFeedbackData,
    setModalFeedbackData,
    onClose,
    fileData,
    setFileData,
    btnContent,
    setBtnContent,
    setFileReName,
    fileReName,
    onNext,
    onHandleClose,
    knData,
    closeModalFeedback,
    setIsVisibleImport,
    onPrev,
    setStep,
    onTabSkip
  } = props;

  const [fileName, setFileName] = useState(''); // 文件读取加载
  const [usedSourceList, setUsedSourceList] = useState([]); // 导入图谱使用的数据源
  const [dataTypeList, setDataTypeList] = useState<any>([]); // 匹配类型相同的数据源
  const [sourceMapping, setSourceMapping] = useState<any>({}); // 新旧数据源映射
  const [selectedId, setSelectedId] = useState([]);
  const [graphId, setGraphId] = useState<any>(); // 覆盖图谱id

  const ModalImportRef = useRef(null);
  const ModalSourceMatchRef = useRef(null);

  const titleContent = () => {
    return (
      <>
        {step === 0 ? (
          intl.get('knowledge.importKnowledgeNetwork')
        ) : (
          <div className="kw-flex title-tips">
            <Format.Title level={3} className="kw-format-text-no-height-3 kw-mr-1">
              {intl.get('knowledge.sourceMatch')}
            </Format.Title>
            <Tooltip
              title={
                <>
                  <div>{intl.get('knowledge.sourceMatchTip')}</div>
                  <div>{intl.get('knowledge.matchRun')}</div>
                </>
              }
            >
              <IconFont type="icon-wenhao" style={{ opacity: '0.45', fontSize: '14px' }} />
            </Tooltip>
          </div>
        )}
      </>
    );
  };

  return (
    <UniversalModal
      wrapClassName="modalImportRoot"
      open={visible}
      title={titleContent()}
      maskClosable={false}
      destroyOnClose={true}
      onCancel={() => setIsVisibleImport(false)}
      footerData={
        step === 0 ? (
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button type="default" onClick={() => setIsVisibleImport(false)}>
              {intl.get('global.cancelS')}
            </Button>
            <Button type="primary" disabled={btnContent} onClick={() => (ModalImportRef.current as any).onSubmit()}>
              {btnContent ? intl.get('knowledge.importing') : intl.get('cognitiveSearch.next')}
            </Button>
          </ConfigProvider>
        ) : (
          <>
            <Button onClick={onPrev}>{intl.get('global.previous')}</Button>
            <Button onClick={() => (ModalSourceMatchRef.current as any).onOk('run')} disabled={_.isEmpty(selectedId)}>
              {intl.get('knowledge.importRun')}
            </Button>
            <Button type="primary" onClick={() => (ModalSourceMatchRef.current as any).onOk('ok')}>
              {intl.get('analysisService.importService.import')}
            </Button>
          </>
        )
      }
      afterClose={() => {
        setFileReName('');
        setFileData([]);
        setStep(0);
        setFileName('');
      }}
    >
      <div style={{ display: step === 1 ? 'none' : 'block' }}>
        <ModalImport
          ref={ModalImportRef}
          knowledge={knData}
          modalFeedbackData={modalFeedbackData}
          setModalFeedbackData={setModalFeedbackData}
          onClose={onClose}
          fileData={fileData}
          setFileData={setFileData}
          btnContent={btnContent}
          setBtnContent={setBtnContent}
          setFileReName={setFileReName}
          fileReName={fileReName}
          fileName={fileName}
          setFileName={setFileName}
          setIsVisibleImport={setIsVisibleImport}
          step={step}
          setGraphId={setGraphId}
        />
      </div>

      <div style={{ display: step === 0 ? 'none' : 'block' }}>
        <ModalSourceMatch
          graphId={graphId}
          ref={ModalSourceMatchRef}
          fileData={fileData}
          modalFeedbackData={modalFeedbackData}
          onHandleClose={onHandleClose}
          knData={knData}
          closeModalFeedback={closeModalFeedback}
          fileReName={fileReName}
          onPrev={onPrev}
          usedSourceList={usedSourceList}
          setUsedSourceList={setUsedSourceList}
          dataTypeList={dataTypeList}
          setDataTypeList={setDataTypeList}
          sourceMapping={sourceMapping}
          setSourceMapping={setSourceMapping}
          onTabSkip={onTabSkip}
          onSetSelectedId={setSelectedId}
        />
      </div>
    </UniversalModal>
  );
};

export default ImportModal;
