import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, message, Tooltip, Button, ConfigProvider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import AllClassify from './AllClassify';
import ClassifyContainGraph from './ClassifyContainGraph';
import intl from 'react-intl-universal';
import servicesSearchConfig from '@/services/searchConfig';
import Empty from '@/assets/images/empty.svg';
import fullTip from '@/assets/images/fullTip.svg';
import UniversalModal from '@/components/UniversalModal';
import servicesPermission from '@/services/rbacPermission';
import './style.less';

export const SearchRangeContent = forwardRef((props: any, ref) => {
  const {
    visible,
    onHandleCancel,
    testData,
    setTestData,
    onSaveDefault,
    onAuthError,
    checked,
    setChecked,
    setIsOpenQA
  } = props;
  const saveRef = useRef<any>(null);
  const [graphUnderClassify, setGraphUnderClassify] = useState<any>([]); // 某一分类下的图谱数据信息
  const [showForm, setShowForm] = useState('all'); // 展示全部分类(all)/具体分类下的数据(concrete)
  const [fullContent, setFullContent] = useState<any>([]); // 搜索范围弹窗未关闭时，保存的数据(full_text)
  const [allContent, setAllContent] = useState<any>([]); // 搜索范围弹窗未关闭时，保存的数据(data_source_scope)
  const [isShowAll, setIsShowAll] = useState(false); // 展示全部资源
  const [authData, setAuthData] = useState<{ checked: boolean; data: any[] }>({ checked: false, data: [] }); // 有权限的数据

  useImperativeHandle(ref, () => ({
    onSave
  }));

  useEffect(() => {
    // 资源分类弹窗校验权限
    const dataIds = _.map(testData?.props?.data_source_scope, item => String(item.kg_id));
    let error = false;
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');

    //   const newGraphData = _.filter(testData?.props?.data_source_scope, item => {
    //     const hasAuth = _.includes(codesData?.[item.kg_id]?.codes, 'KG_VIEW');
    //     if (!hasAuth) error = true;
    //     return hasAuth;
    //   });
    //   const ids = _.map(newGraphData, item => String(item?.kg_id));
    //   setAuthData({ checked: true, data: ids });
    //   if (error) {
    //     onAuthError({ range: true });
    //     message.error(intl.get('global.graphNoPeromission'));
    //   }
    // });
    const ids = _.map(testData?.props?.data_source_scope, item => String(item?.kg_id));
    setAuthData({ checked: true, data: ids });
    if (error) {
      onAuthError({ range: true });
      message.error(intl.get('global.graphNoPeromission'));
    }
  }, [testData?.props?.full_text?.search_config, testData]);

  useEffect(() => {
    // 将全部资源放到最前面
    const searchConfig = _.cloneDeep(testData?.props?.full_text?.search_config);
    const allResource = _.filter(searchConfig, (item: any) => item?.class_name === '全部资源');
    const positionChange = _.filter(searchConfig, (item: any) => item?.class_name !== '全部资源');
    setFullContent([...allResource, ...positionChange]);
  }, [testData?.props?.full_text?.search_config]);

  /**
   * 保存
   * P_BUTTON 搜索范围保存
   */
  const onSave = () => {
    const saveConfig = saveRef?.current?.onSave();
    testData.props.full_text.search_config = saveConfig;
    setTestData(testData);
    message.success(intl.get('configSys.saveSuccess'));
    onHandleCancel();
    onSaveDefault();
  };

  /**
   * 页面展示判断
   * @param data 分类下的图谱信息
   * @param type all-全部分类页面 concrete-具体分类下的图谱展示页面
   */
  const onShowGraphMessage = (data: any, type: string) => {
    setGraphUnderClassify(data);
    setShowForm(type);
    setIsShowAll(false);
  };

  return (
    <div className="range-box kw-flex">
      <AllClassify
        authData={authData}
        isVisible={showForm === 'all'}
        testData={testData}
        onShowGraphMessage={onShowGraphMessage}
        setShowForm={setShowForm}
        fullContent={fullContent}
      />
      <ClassifyContainGraph
        isVisible={showForm === 'concrete'}
        authData={authData}
        onShowGraphMessage={onShowGraphMessage}
        graphUnderClassify={graphUnderClassify}
        setGraphUnderClassify={setGraphUnderClassify}
        isShowAll={isShowAll}
        setShowForm={setShowForm}
        fullContent={fullContent}
        setFullContent={setFullContent}
        allContent={allContent}
        setAllContent={setAllContent}
        testData={testData}
        setTestData={setTestData}
        checked={checked}
        setChecked={setChecked}
        setIsOpenQA={setIsOpenQA}
        ref={saveRef}
      />

      {/* <UniversalModal.Footer
        source={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="foot-btn" type="default" onClick={() => onHandleCancel()}>
              {intl.get('cognitiveSearch.cancel')}
            </Button>
            <Button className="foot-btn" type="primary" onClick={onSave}>
              {intl.get('cognitiveSearch.save')}
            </Button>
          </ConfigProvider>
        }
      /> */}
    </div>
  );
});

const SearchRange = (props: any) => {
  const { visible, onHandleCancel, testData, setTestData, onSaveDefault, onAuthError, setIsOpenQA } = props;
  const SearchRangeContentRef = useRef(null);

  const titleModal = () => {
    return (
      <div style={{ color: '#000' }}>
        {intl.get('cognitiveSearch.full.searchRange')}
        <span className="quest-icon kw-ml-2">
          <Tooltip placement="top" arrowPointAtCenter title={intl.get('cognitiveSearch.searchEntities')}>
            <QuestionCircleOutlined />
          </Tooltip>
        </span>
      </div>
    );
  };

  return (
    <UniversalModal
      className="search-range-wrap-root"
      open={visible}
      title={titleModal()}
      okText={intl.get('cognitiveSearch.save')}
      destroyOnClose={true}
      width={'100vw'}
      style={{ height: '100%', top: '0px', margin: 0, padding: 0, maxWidth: 'unset' }}
      onCancel={onHandleCancel}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="foot-btn" type="default" onClick={() => onHandleCancel()}>
            {intl.get('cognitiveSearch.cancel')}
          </Button>
          <Button className="foot-btn" type="primary" onClick={() => (SearchRangeContentRef.current as any).onSave()}>
            {intl.get('cognitiveSearch.save')}
          </Button>
        </ConfigProvider>
      }
      maskClosable={false}
    >
      <SearchRangeContent
        ref={SearchRangeContentRef}
        visible={visible}
        onHandleCancel={onHandleCancel}
        testData={testData}
        setTestData={setTestData}
        onSaveDefault={onSaveDefault}
        onAuthError={onAuthError}
        setIsOpenQA={setIsOpenQA}
      />
    </UniversalModal>
  );
};

export default SearchRange;
