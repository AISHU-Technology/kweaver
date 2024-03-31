import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Form, Select, ConfigProvider, Button, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';

import { classifyConfig } from '../../assistFunction';
import './style.less';
import classNames from 'classnames';

const { Option } = Select;
const MoveClassifyContent = forwardRef((props: any, ref) => {
  const { authData, selectedRows, testData, setTestData, onHandleCancel, onChangeTable } = props;
  const [form] = Form.useForm();
  const [allClassify, setAllClassify] = useState<any>([]); // 资源分类下拉框数据
  const [selectedGraph, setSelectedGraph] = useState<any>([]); // 已选图谱
  const [selectedClassify, setSelectedClassify] = useState<any>([]); // 已选分类

  useEffect(() => {
    // 已选图谱
    const alreadySelected = _.map(selectedRows, (item: any) => {
      return item.kg_name;
    });
    setSelectedGraph(alreadySelected);
    // 全部资源
    const allSource = _.filter(testData?.props?.full_text?.search_config, (item: any) => {
      if (item?.class_name !== '全部资源') {
        return item?.class_name;
      }
    });
    setAllClassify(allSource);
  }, []);

  useImperativeHandle(ref, () => ({
    handleOk
  }));

  /**
   * 保存
   */
  const handleOk = async () => {
    if (_.isEmpty(selectedClassify)) {
      message.warning(intl.get('cognitiveSearch.classify.selectOne'));
    }
    form.validateFields().then(values => {
      const handleData = classifyConfig(testData, values, selectedRows, selectedGraph);
      setTestData(handleData);
      onChangeTable({ page: 1 }, handleData);
      onHandleCancel();
    });
  };

  /**
   * 分类选择
   */
  const onChange = (e: any) => {
    setSelectedClassify(e);
  };

  return (
    <div className="move-to-classify-modal-box">
      <div className="selected-graph-head">{intl.get('cognitiveSearch.classify.alreadyGraph')}</div>
      <div className="selected-graph kw-mb-6">
        {_.map(selectedGraph, (item: any, index: any) => {
          return (
            <div className="kw-flex graph-row" key={index}>
              <IconFont type="icon-color-zhishitupu11" className="graph-icon" style={{ fontSize: 16 }} />
              {/* {'kw-c-': !_.includes(authData, iem?.)} */}
              <div className={classNames('graph-name kw-ellipsis')} title={item}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
      <Form layout="vertical" form={form}>
        <Form.Item
          name="source"
          label={intl.get('cognitiveSearch.classify.resources')}
          colon={false}
          rules={[{ required: true, message: intl.get('cognitiveSearch.classify.selectOne') }]}
        >
          <Select
            showSearch
            placeholder={intl.get('cognitiveSearch.classify.pleaseSelect')}
            mode="multiple"
            onChange={onChange}
          >
            {_.map(allClassify, (item: any, index: any) => {
              return (
                <Option key={index} value={item?.class_name}>
                  {item?.class_name}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>

      {/* <UniversalModal.Footer
        source={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
              {intl.get('cognitiveSearch.cancel')}
            </Button>

            <Button type="primary" className="btn primary" onClick={handleOk}>
              {intl.get('cognitiveSearch.save')}
            </Button>
          </ConfigProvider>
        }
      /> */}
    </div>
  );
});

const MoveClassifyModal = (props: any) => {
  const { authData, visible, testData, setTestData, selectedRows, onHandleCancel, onChangeTable } = props;
  const MoveClassifyContentRef = useRef(null);
  return (
    <UniversalModal
      visible={visible}
      title={intl.get('cognitiveSearch.classify.move')}
      width={'480px'}
      destroyOnClose={true}
      maskClosable={false}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
            {intl.get('cognitiveSearch.cancel')}
          </Button>

          <Button
            type="primary"
            className="btn primary"
            onClick={() => (MoveClassifyContentRef.current as any).handleOk()}
          >
            {intl.get('cognitiveSearch.save')}
          </Button>
        </ConfigProvider>
      }
      onCancel={onHandleCancel}
      className="move-classify-modal-root"
    >
      <MoveClassifyContent
        ref={MoveClassifyContentRef}
        authData={authData}
        testData={testData}
        setTestData={setTestData}
        selectedRows={selectedRows}
        onHandleCancel={onHandleCancel}
        onChangeTable={onChangeTable}
      />
    </UniversalModal>
  );
};

export default MoveClassifyModal;
