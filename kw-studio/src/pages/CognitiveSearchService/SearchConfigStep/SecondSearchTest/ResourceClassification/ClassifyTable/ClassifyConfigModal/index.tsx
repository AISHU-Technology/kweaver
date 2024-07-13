import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Button, Checkbox, ConfigProvider } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import empty from '@/assets/images/empty.svg';
import NoDataBox from '@/components/NoDataBox';
import { fuzzyMatch } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';
import { onClassifyConfig } from '../../assistFunction';
import './style.less';

const ClassifyContent = forwardRef((props: any, ref) => {
  const { testData, setTestData, onHandleCancel, configRecord, onChangeTable } = props;
  const searchInput = useRef();
  const [classifyList, setClassifyList] = useState<any>([]); // 所有分类
  const [matchData, setMatchData] = useState<any>([]); // 搜索匹配的数据
  const [selectedNames, setSelectedNames] = useState<any>([]); // 选择的分类名称
  const [searchQuery, setSearchQuery] = useState(''); // 搜索的文字

  useEffect(() => {
    if (_.isEmpty(configRecord)) return;
    const fullText = _.cloneDeep(testData?.props?.full_text?.search_config);
    const allClassify = _.filter(fullText, (item: any) => item?.class_name !== '全部资源');
    setClassifyList(allClassify);
    setMatchData(allClassify);
  }, [testData?.props?.full_text?.search_config]);

  useImperativeHandle(ref, () => ({
    onHandleOk
  }));

  /**
   * 搜索
   */
  const onSearch = (e: any) => {
    const value = e?.target?.value;
    setSearchQuery(value);
    const matchClassify = _.filter(classifyList, (item: any) => fuzzyMatch(value, item?.class_name));
    setMatchData(matchClassify);
  };

  /**
   * 复选框会选择
   */
  const onChange = (isCheck: any, name: string) => {
    // 所有勾选的分类
    let allSelectedNames: any = [];
    if (isCheck) {
      allSelectedNames = [...selectedNames, name];
    } else {
      allSelectedNames = _.filter(selectedNames, (item: any) => item !== name);
    }
    setSelectedNames(allSelectedNames);
  };

  /**
   * 保存
   */
  const onHandleOk = () => {
    // 分类为空点击保存 无需更新任何
    if (_.isEmpty(matchData) && !searchQuery) {
      onHandleCancel();
      return;
    }
    const handleData = onClassifyConfig(testData, selectedNames, configRecord);
    setTestData(handleData);
    onChangeTable({ page: 1 }, handleData);
    onHandleCancel();
  };

  return (
    <div className="classify-config-modal-root">
      <div className="kw-flex config-title">
        <div>{intl.get('cognitiveSearch.classify.already')}</div>
        <div className="kw-c-primary kw-ellipsis name-length-limit" title={configRecord?.kg_name}>
          {configRecord?.kg_name}
        </div>
      </div>
      <div className="all-classify">
        <div className="classify-search">
          <SearchInput
            ref={searchInput}
            allowClear={true}
            placeholder={intl.get('cognitiveSearch.classify.search')}
            prefix={<IconFont type="icon-sousuo" className="search-icon kw-pointer" style={{ opacity: '0.25' }} />}
            onChange={onSearch}
            debounce
            className="input-first-left kw-mb-2 kw-pt-2"
          />
        </div>
        {_.isEmpty(matchData) && !searchQuery ? (
          <div className="kw-center no-data">
            <img src={empty} alt="" className="no-data-img" />
            <div>{intl.get('cognitiveSearch.classify.noCategory')}</div>
          </div>
        ) : (
          <>
            {_.isEmpty(matchData) && searchQuery ? (
              <NoDataBox type="NO_RESULT" />
            ) : (
              <div className="classify-data">
                {_.map(matchData, (item: any, index: any) => {
                  return (
                    <div className="kw-flex each-classify" key={index}>
                      <Checkbox onChange={(e: any) => onChange(e, item?.class_name)}>
                        <div className="classify-name kw-ellipsis" title={item?.class_name}>
                          {item?.class_name}
                        </div>
                      </Checkbox>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* <div className="kw-mt-8">
        <UniversalModal.Footer
          source={
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
                {intl.get('cognitiveSearch.cancel')}
              </Button>

              <Button type="primary" className="btn primary" onClick={onHandleOk}>
                {intl.get('cognitiveSearch.save')}
              </Button>
            </ConfigProvider>
          }
        />
      </div> */}
    </div>
  );
});

const ClassifyConfigModal = (props: any) => {
  const { visible, onHandleCancel, testData, setTestData, configRecord, onChangeTable } = props;
  const ClassifyContentRef = useRef(null);
  return (
    <UniversalModal
      className="classify-config-setting-modal-root"
      open={visible}
      onCancel={onHandleCancel}
      title={intl.get('cognitiveSearch.classify.category')}
      maskClosable={false}
      width={480}
      destroyOnClose={true}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
            {intl.get('cognitiveSearch.cancel')}
          </Button>

          <Button
            type="primary"
            className="btn primary"
            onClick={() => (ClassifyContentRef.current as any).onHandleOk()}
          >
            {intl.get('cognitiveSearch.save')}
          </Button>
        </ConfigProvider>
      }
    >
      <ClassifyContent
        ref={ClassifyContentRef}
        testData={testData}
        setTestData={setTestData}
        onHandleCancel={onHandleCancel}
        configRecord={configRecord}
        onChangeTable={onChangeTable}
      />
    </UniversalModal>
  );
};

export default ClassifyConfigModal;
