import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { SplitBox } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/split-box/style/index.css';
import TopBar from './TopBar';
import LeftList from './LeftList';
import GlossaryInfoTabs from './GlossaryInforTabs';
import './style.less';
import intl from 'react-intl-universal';
import CustomRelationModal from '@/pages/KnowledgeNetwork/Glossary/GlossaryContent/CustomRelationModal';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { getCustomRelationList, getTermRootNode } from '@/services/glossaryServices';
import NoDataBox from '@/components/NoDataBox';
import classNames from 'classnames';
import LoadingMask from '@/components/LoadingMask';
import { message } from 'antd';
import TipModal from '@/components/TipModal';

type GlossaryContentType = {
  closeDetailPage: () => void;
  closeCreateModal: () => void;
  handleChangeSelectKn: (id: any) => void;
  openCreateModal: (data?: any) => void;
  onChangePageSign: (value: string) => void;
};
const GlossaryContent = forwardRef<any, GlossaryContentType>((props, ref) => {
  const {
    glossaryStore: { glossaryData, mode, selectedTerm },
    initStore,
    setGlossaryStore
  } = useGlossaryStore();
  const { closeDetailPage, openCreateModal, onChangePageSign, handleChangeSelectKn } = props;
  const [exitTerm, setExistTerm] = useState<boolean | null>(null); // 是否存在术语
  const [creating, setCreating] = useState<boolean>(false); // 是否处于创建状态
  const [customRelationModalProps, setCustomRelationModalProps] = useState({
    visible: false
  });
  const [exitModal, setExitModal] = useState({
    visible: false,
    id: undefined as any
  });
  const leftListRef = useRef<any>();
  const prefixCls = 'glossaryContentRoot';
  const prefixLocal = 'glossary';

  useImperativeHandle(ref, () => ({
    openExitModalVisible: (id: any) => {
      setExitModal(preState => ({
        visible: true,
        id
      }));
    }
  }));

  useEffect(() => {
    onChangePageSign('glossary-detail');
    return () => {
      initStore();
      onChangePageSign('');
    };
  }, []);

  // useEffect(() => {
  //   glossaryData && getCustomRelationData();
  // }, [glossaryData]);

  useEffect(() => {
    if (glossaryData?.id) {
      getRootNode();
      getCustomRelationData();
    }
  }, [glossaryData?.id]);

  const getRootNode = async () => {
    try {
      const data = await getTermRootNode(glossaryData!.id);
      if (data && data.res.length > 0) {
        setExistTerm(true);
      } else {
        setExistTerm(false);
      }
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      setExistTerm(false);
      message.error(errorTip);
    }
  };

  const getCustomRelationData = async () => {
    try {
      const data = await getCustomRelationList(glossaryData!.id);
      setGlossaryStore(preStore => ({
        ...preStore,
        customRelationList: data.res
      }));
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const openCustomRelationModal = () => {
    setCustomRelationModalProps(prevState => ({
      ...prevState,
      visible: true
    }));
  };
  const closeCustomRelationModal = () => {
    setCustomRelationModalProps(prevState => ({
      ...prevState,
      visible: false
    }));
  };

  const refreshTerm = (termId: string) => {
    leftListRef.current.refreshTerm(termId);
  };

  const createTermTip = useMemo(() => {
    return intl.get(`${prefixLocal}.createTermTips`).split('|');
  }, []);
  const createCustomRelationTip = useMemo(() => {
    return intl.get(`${prefixLocal}.createCustomRelationTip`).split('|');
  }, []);

  const onTermDataSourceChange = (data: any) => {
    if (data.length === 0) {
      setExistTerm(false);
      return;
    }
    if (data.length === 1 && data[0].key === 'temp') {
      setExistTerm(false);
      return;
    }
    if (!exitTerm) {
      setExistTerm(true);
    }
  };

  const renderContent = () => {
    if (exitTerm === null) {
      return <LoadingMask loading />;
    }
    if (!exitTerm) {
      if (mode === 'view') {
        return (
          <div className="kw-w-100 kw-h-100 kw-center">
            <NoDataBox imgSrc={require('@/assets/images/kong.svg').default} desc={intl.get('global.noContent')} />
          </div>
        );
      }
      if (!creating) {
        return (
          <div className={`${prefixCls}-noDataBox kw-flex-item-full-height`}>
            <NoDataBox
              style={{ marginTop: 280 }}
              imgSrc={require('@/assets/images/addTerm.svg').default}
              desc={
                <div>
                  {createTermTip[0]}
                  <span className="kw-c-primary kw-pointer" onClick={() => setCreating(true)}>
                    {createTermTip[1]}
                  </span>
                  {createTermTip[2]}
                </div>
              }
            />
          </div>
        );
      }
    }
    return (
      <div className="kw-flex kw-flex-item-full-height kw-w-100">
        <SplitBox defaultSize={416} minSize={416} maxSize={560}>
          <LeftList onTermDataSourceChange={onTermDataSourceChange} ref={leftListRef} />
          {selectedTerm && selectedTerm.length > 0 && selectedTerm[0] ? (
            <GlossaryInfoTabs
              setSelectedNodeByTerm={leftListRef.current.setSelectedNodeByTerm}
              refreshTerm={refreshTerm}
              openCustomRelationModal={openCustomRelationModal}
            />
          ) : (
            <div className={`${prefixCls}-noDataBox`}>
              {!exitTerm ? (
                <NoDataBox
                  style={{ marginTop: 280 }}
                  imgSrc={require('@/assets/images/empty.svg').default}
                  desc={intl.get('global.noContent')}
                />
              ) : (
                <NoDataBox
                  style={{ marginTop: 280 }}
                  imgSrc={require('@/assets/images/clickView.svg').default}
                  desc={intl.get('glossary.clickTerm')}
                />
              )}
            </div>
          )}
        </SplitBox>
      </div>
    );
  };

  const returnList = () => {
    closeDetailPage();
    setGlossaryStore(preStore => ({
      ...preStore,
      glossaryData: null
    }));
  };

  return (
    <div className={classNames(prefixCls, 'kw-flex-column')}>
      <TopBar goBack={returnList} openCreateModal={openCreateModal} openCustomRelationModal={openCustomRelationModal} />
      {renderContent()}
      <CustomRelationModal
        visible={customRelationModalProps.visible}
        closeCustomRelationModal={closeCustomRelationModal}
      />
      <TipModal
        title={intl.get('global.existTitle')}
        content={intl.get('glossary.exitTips')}
        open={exitModal.visible}
        onCancel={() => {
          setExitModal(preState => ({
            ...preState,
            visible: false
          }));
        }}
        onOk={() => {
          handleChangeSelectKn(exitModal.id);
          returnList();
        }}
      />
    </div>
  );
});
export default GlossaryContent;
