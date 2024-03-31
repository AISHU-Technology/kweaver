import React, { memo, useState, useRef } from 'react';

import intl from 'react-intl-universal';
import _ from 'lodash';

import IconFont from '@/components/IconFont';
import { Modal, message, Spin, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getParam } from '@/utils/handleFunction';
import intentionService from '@/services/intention';

import NoDataBox from '@/components/NoDataBox';
import smileSvg from '@/assets/images/xiaolian.svg';

import './style.less';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const ModalContent = memo((props: any) => {
  const { testId, testSuccess, setIsAgain, isAgain } = props;
  const [searchData, setSearchData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [searchValue, setSearchValue] = useState('');

  /**
   *  搜索
   */
  const onSearch = async (e: any) => {
    const { value } = e === '' ? { value: searchValue } : e.target;
    const { id } = getParam(['id']);
    setName(value);
    if (loading) {
      return;
    }
    if (!value) {
      return;
    }
    try {
      setLoading(true);
      const data = { intentpool_id: testId, query_text: value };
      const { res } = await intentionService.testIntentModel(data);
      if (res) {
        setSearchData(res);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (err?.ErrorDetails[0]?.detail === 'parse query_text failed because the model agent is None') {
        setIsAgain(isAgain + 1);
        return;
      }
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  return (
    <div>
      <div className="test-modal-title kw-pt-5 kw-pb-5 kw-pl-8">
        <Input
          value={searchValue}
          prefix={<IconFont onClick={() => onSearch('')} type="icon-sousuo" className="kw-c-watermark" />}
          className="search-input"
          onChange={e => {
            e.persist();
            setSearchValue(e?.target?.value);
          }}
          onPressEnter={(e: any) => {
            onSearch(e);
          }}
          allowClear={true}
          placeholder={intl.get('intention.enter')}
        />
      </div>

      <div className="test-modal-body">
        {
          <div>
            {loading || !testSuccess ? (
              <div className="kw-mt-9 loading">
                <Spin indicator={antIcon} />
                {!testSuccess && (
                  <div className="kw-mt-3">
                    {intl.get('intention.load')}
                    {/* {status === 1 ? intl.get('intention.load') : intl.get('global.loadFail')} */}
                  </div>
                )}
              </div>
            ) : searchData ? (
              <div>{JSON.stringify(searchData)}</div>
            ) : name && !searchData ? (
              <div className="empty-data-box">
                <NoDataBox.NO_RESULT />
              </div>
            ) : (
              !name && (
                <div className="no-query-box kw-center">
                  <div>
                    <img src={smileSvg} alt="" />
                    <div>{intl.get('intention.keywords')}</div>
                  </div>
                </div>
              )
            )}
          </div>
        }
      </div>
    </div>
  );
});

const TestIntentionModal = (props: any) => {
  const { isTestModal, handleCancel, testId, testSuccess, name, setName, setIsAgain, isAgain } = props;
  return (
    <Modal
      visible={isTestModal}
      onCancel={handleCancel}
      wrapClassName="task-test-modal"
      focusTriggerAfterClose={false}
      closable={true}
      maskClosable={false}
      width="800px"
      footer={null}
      destroyOnClose={true}
    >
      <ModalContent
        handleCancel={handleCancel}
        testId={testId}
        testSuccess={testSuccess}
        name={name}
        setName={setName}
        setIsAgain={setIsAgain}
        isAgain={isAgain}
      />
    </Modal>
  );
};

export default TestIntentionModal;
