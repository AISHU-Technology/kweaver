import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Form, Select, Input, ConfigProvider, Button, message } from 'antd';
import type { SelectProps } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { addList, onUpdateData, onHandleTree } from '../../assistFunction';
import UniversalModal from '@/components/UniversalModal';
import './style.less';

const { Option } = Select;
const NAME_REG = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
export const CreateEditContent = forwardRef((props: any, ref) => {
  const {
    authData,
    setSelectMes,
    operateType,
    editMes,
    setTestData,
    onChangeTable,
    testData,
    onNotUpdate,
    onHandleCancel,
    setTreeData
  } = props;
  const [form] = Form.useForm();
  const [graphSelect, setGraphSelect] = useState<any>([]); // 图谱选择
  const [sourceName, setSourceName] = useState(''); // 没改之前的分类名
  const [options, setOptions] = useState<SelectProps['options']>([]);

  useImperativeHandle(ref, () => ({
    handleOk
  }));

  useEffect(() => {
    // 可选择图谱（第一步添加的）
    const firstStepData = testData?.props?.data_source_scope;
    const selectedGraph = _.map(firstStepData, (item: any) => ({
      value: item?.kg_name,
      label: item?.kg_name,
      disabled: !_.includes(authData?.data, String(item?.kg_id))
    }));
    setOptions(selectedGraph);
  }, [testData?.props?.data_source_scope]);

  useEffect(() => {
    if (operateType === 'edit') {
      form.setFieldsValue(editMes);
      setSourceName(editMes?.classify);
      setGraphSelect(editMes?.resource);
    }
  }, [operateType, editMes]);

  /**
   * 确定
   */
  const handleOk = () => {
    if (_.isEmpty(graphSelect)) {
      message.warning(intl.get('cognitiveSearch.classify.selectResource'));
    }
    form.validateFields().then(async values => {
      const { classify, type, resource } = values;
      let handleUpdate: any = [];
      if (operateType === 'edit') {
        handleUpdate = onUpdateData(testData, values, sourceName, editMes?.id);
      } else {
        handleUpdate = addList(testData, values);
      }
      // 分类名称重复
      if (handleUpdate === 'repeat') {
        form.setFields([{ name: 'classify', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      setTestData(handleUpdate);
      setSelectMes(classify);
      onChangeTable({ page: 1 }, handleUpdate, classify);
      const filterData = _.filter(
        handleUpdate?.props?.full_text?.search_config,
        (item: any) => item?.class_name !== '全部资源'
      );
      const sortData = _.map(filterData, (item: any) => onHandleTree(item, authData));
      setTreeData(sortData);
      onHandleCancel();
      onNotUpdate();
    });
  };

  /**
   * 选择资源
   */
  const onSourceSelect = (e: any) => {
    setGraphSelect(e);
  };

  return (
    <>
      <Form layout="vertical" form={form} initialValues={{ type: intl.get('cognitiveSearch.resource.know') }}>
        <Form.Item
          name="classify"
          label={<div className="form-label">{intl.get('cognitiveSearch.classify.categoryName')}</div>}
          rules={[
            {
              required: true,
              message: intl.get('global.noNull')
            },
            {
              validator: async (rule, value) => {
                if (!value) return Promise.resolve();
                if (value === '全部资源') {
                  throw new Error(intl.get('cognitiveSearch.classify.nameProhibit'));
                }
                if (value.length > 50) {
                  return Promise.reject([intl.get('cognitiveSearch.max50')]);
                }
                if (!NAME_REG.test(value)) {
                  return Promise.reject([intl.get('cognitiveSearch.onlyThreeType')]);
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input className="kw-ellipsis" placeholder={intl.get('cognitiveSearch.classify.enter')} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="type"
          rules={[{ required: true, message: intl.get('global.noNull') }]}
          label={<div className="form-label">{intl.get('cognitiveSearch.resource.resourceType')}</div>}
        >
          <Select placeholder={intl.get('cognitiveSearch.select')} disabled>
            <Option key={'知识图谱'} value={'知识图谱'}>
              知识图谱
            </Option>
          </Select>
        </Form.Item>
        <Form.Item
          label={intl.get('cognitiveSearch.resource.addResource')}
          name="resource"
          rules={[{ required: true, message: intl.get('cognitiveSearch.resource.selectResource') }]}
        >
          <Select
            placeholder={intl.get('cognitiveSearch.resource.selectResource')}
            mode="multiple"
            options={options}
            onChange={(e: any) => onSourceSelect(e)}
          />
        </Form.Item>
      </Form>

      {/* <UniversalModal.Footer
        source={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button
              className="ant-btn-default btn normal"
              onClick={() => {
                onHandleCancel();
              }}
            >
              {intl.get('cognitiveSearch.cancel')}
            </Button>

            <Button type="primary" className="btn primary" onClick={handleOk}>
              {intl.get('cognitiveSearch.save')}
            </Button>
          </ConfigProvider>
        }
      /> */}
    </>
  );
});

const CreateClassifyModal = (props: any) => {
  const {
    visible,
    authData,
    testData,
    setTestData,
    onHandleCancel,
    operateType,
    onChangeTable,
    setSelectMes,
    editMes,
    setTreeData,
    onNotUpdate
  } = props;

  const CreateEditContentRef = useRef(null);

  return (
    <>
      <UniversalModal
        className="search-create-edit-modal"
        visible={visible}
        onCancel={onHandleCancel}
        title={
          operateType === 'create'
            ? intl.get('cognitiveSearch.classify.addCategory')
            : intl.get('cognitiveSearch.classify.editCategory')
        }
        width={'480px'}
        destroyOnClose={true}
        maskClosable={false}
        footer={null}
        footerData={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button
              className="ant-btn-default btn normal"
              onClick={() => {
                onHandleCancel();
              }}
            >
              {intl.get('cognitiveSearch.cancel')}
            </Button>

            <Button
              type="primary"
              className="btn primary"
              onClick={() => (CreateEditContentRef.current as any).handleOk()}
            >
              {intl.get('cognitiveSearch.save')}
            </Button>
          </ConfigProvider>
        }
      >
        <CreateEditContent
          ref={CreateEditContentRef}
          authData={authData}
          operateType={operateType}
          onHandleCancel={onHandleCancel}
          testData={testData}
          setTestData={setTestData}
          setSelectMes={setSelectMes}
          editMes={editMes}
          setTreeData={setTreeData}
          onChangeTable={onChangeTable}
          onNotUpdate={onNotUpdate}
        />
      </UniversalModal>
    </>
  );
};

export default CreateClassifyModal;
