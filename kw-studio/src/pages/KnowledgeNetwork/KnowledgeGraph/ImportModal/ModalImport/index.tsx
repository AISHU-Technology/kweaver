import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { getParam } from '@/utils/handleFunction';

import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import { Form, Upload, Input, Tooltip, Radio, Select, Spin } from 'antd';
import { FolderOpenOutlined, LoadingOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './index.less';

const layout = { labelCol: { span: 24 }, wrapperCol: { span: 24 } };
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

/**
 * 导入弹窗
 */
const ModalImport = forwardRef((props: any, ref) => {
  const {
    onClose,
    modalFeedbackData,
    setModalFeedbackData,
    fileData,
    setFileData,
    setBtnContent,
    fileReName,
    setFileReName,
    fileName,
    setFileName,
    step,
    setGraphId
  } = props;
  const [form] = Form.useForm();
  const [isShow, setIsShow] = useState(false);
  const [isInput, setIsInput] = useState(false); // 用户输入-true
  const [importType, setImportType] = useState<string>('create');
  const [graphList, setGraphList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    onSubmit
  }));

  useEffect(() => {
    form.setFieldsValue({ name: fileReName, file: { file: fileData } });
  }, [step]);

  useEffect(() => {
    getConfigGraph();
  }, []);

  /**
   * 获取图谱
   */
  const getConfigGraph = async () => {
    const { id } = getParam(['id']);
    const data = { page: 1, name: '', order: 'desc', size: 10000, rule: 'create', knw_id: id };
    try {
      setLoading(true);
      const { res } = (await servicesKnowledgeNetwork.graphGetByKnw(data)) || {};
      if (res) {
        setLoading(false);
        setGraphList(res?.df);
      }
    } catch (err: any) {
      setGraphList([]);
      setLoading(false);
    }
  };

  /**
   * 文件导入解析
   */
  const beforeUpload = (file: Blob, fileList: any) => {
    setFileData(file);
    setFileName(fileList?.[0]?.name);
    form.setFieldsValue({ file });
    const reader = new FileReader();
    reader.readAsText(file);
    let result: any = [];
    reader.onload = (event: any) => {
      result = JSON.parse(event?.target?.result);
      const name = result?.[0]?.config?.graph_name;
      setModalFeedbackData(result);
      // isInput-true导入的文件名就不需要显示 false-显示导入的文件名
      if (!isInput) {
        onCheckImportName(name);
      }
    };
  };

  /**
   * 导入图谱名是否重复(重复后加下划线+数字)
   */
  const onCheckImportName = async (value: string) => {
    const { id } = getParam(['id']);
    try {
      const data = { knw_id: id, page: 1, size: 1000, order: 'desc', name: '', rule: 'update' };
      const { res } = (await servicesKnowledgeNetwork.graphGetByKnw(data)) || {};
      const list = res?.df;
      const nameList = _.map(list, (item: any) => item?.name);
      // 导入的图谱名称有重复
      if (nameList.includes(value)) {
        const repeatNameArr: any = [];
        _.map(nameList, (item: any) => {
          // 名称重复找出后缀数字的最大值
          if (item.slice(0, value?.length) === value) {
            const parseNumber =
              typeof parseInt(item?.split('_')[1]) === 'number' && !Number.isNaN(parseInt(item?.split('_')[1]))
                ? parseInt(item?.split('_')[1])
                : 0;
            repeatNameArr.push(parseNumber);
          }
        });
        const filterName =
          [...new Set(repeatNameArr)]?.length === 1 && !repeatNameArr?.[0] ? [0] : repeatNameArr.filter(Boolean);
        const maxNumber = Math.max(...filterName);
        setFileReName(`${value}_${maxNumber + 1}`);
        form.setFieldsValue({ name: `${value}_${maxNumber + 1}` });
      } else {
        setFileReName(value);
        form.setFieldsValue({ name: value });
      }
    } catch (err) {
      //
    }
  };

  /**
   * 删除一个选中的文件
   */
  const onDeleteFile = () => {
    form.setFieldsValue({ file: [] });
    form.validateFields(['file']);
    setFileData([]);
    setFileName('');
    setModalFeedbackData({});
    if (!isInput) {
      form.resetFields();
      setFileReName('');
    }
  };

  /**
   * 提交导入数据
   */
  const onSubmit = () => {
    form
      .validateFields()
      .then(async (values: any) => {
        setBtnContent(true);
        if (values?.type === 'cover') setGraphId(values?.graph_id);
        if (_.isEmpty(values?.file?.file)) {
          form.setFields([{ name: 'file', errors: [intl.get('knowledge.pleaseSelect')] }]);
          setBtnContent(false);
          return;
        }
        if (values?.file?.file?.size > 1024 * 1024 * 10) {
          form.setFields([{ name: 'file', errors: [intl.get('knowledge.noExceed')] }]);
          setBtnContent(false);
          return;
        }
        if (values?.file?.file?.type !== 'application/json') {
          form.setFields([{ name: 'file', errors: [intl.get('knowledge.json')] }]);
          setBtnContent(false);
          return;
        }

        if (!modalFeedbackData?.[0]?.ds_basic_infos) {
          form.setFields([{ name: 'file', errors: [intl.get('knowledge.format')] }]);
          setBtnContent(false);
          return;
        }
        if (_.isEmpty(modalFeedbackData?.[0]?.ds_basic_infos)) {
          // 解析并检查文件内容中是否有ds_basic_infos(使用的数据源)
          setBtnContent(false);
          onClose(true, true);
          return;
        }

        if (!_.isEmpty(modalFeedbackData)) {
          setBtnContent(false);
          onClose(true);
        }
      })
      .catch((errorInfo: any) => {
        setBtnContent(false);
        const errorField = errorInfo?.errorFields?.[0]?.name?.[0];
        if (errorField) form.scrollToField(errorField);
      });
  };

  const onMouseOver = () => {
    setIsShow(true);
  };

  /**
   * 输入框变化
   */
  const onChange = (e: any) => {
    const value = e?.target?.value;
    if (value) {
      setIsInput(true);
      setFileReName(value);
    } else {
      setIsInput(false);
    }
  };

  const onChangeImportType = (value: string) => {
    setImportType(value);
    if (value === 'create') setGraphId('');
  };

  return (
    <div className="graph-import-modal-first-step-root">
      <div className="formContainer">
        <Form {...layout} form={form} name="importForm" initialValues={{ method: '1', type: 'create' }}>
          <Form.Item name="type" label={intl.get('knowledge.importType')}>
            <Radio.Group onChange={e => onChangeImportType(e?.target?.value)}>
              <Radio value="create">{intl.get('knowledge.newImport')}</Radio>
              <Radio value="cover">{intl.get('knowledge.coverImport')} </Radio>
            </Radio.Group>
          </Form.Item>
          {importType === 'create' ? (
            <Form.Item
              name="name"
              label={
                <>
                  {intl.get('exploreGraph.graphName')}
                  <Tooltip className="kw-ml-1" placement="top" title={intl.get('knowledge.underscore')}>
                    <IconFont type="icon-wenhao" style={{ opacity: '0.65' }} />
                  </Tooltip>
                </>
              }
              rules={[
                { type: 'string', max: 50, message: intl.get('searchConfig.max50') },
                { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('createEntity.onlyThreeType') }
              ]}
            >
              <Input placeholder={intl.get('knowledge.inputGraphName')} onChange={onChange} autoComplete="off" />
            </Form.Item>
          ) : (
            <Form.Item
              name="graph_id"
              label={intl.get('exploreGraph.graphName')}
              rules={[
                {
                  required: true,
                  message: intl.get('global.noNull')
                }
              ]}
            >
              <Select showSearch optionFilterProp="name" placeholder={intl.get('knowledge.selectCoverGa')}>
                {loading && (
                  <Select.Option disabled>
                    <div style={{ height: 84 }} className="kw-center">
                      <Spin indicator={antIcon} />
                    </div>
                  </Select.Option>
                )}
                {_.map(graphList, item => {
                  return (
                    <Select.Option value={item?.id} name={item?.name}>
                      {item?.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          )}

          <Form.Item label={intl.get('knowledge.selectFile')} name="file" required={true}>
            <Upload
              fileList={[]}
              accept="application/json"
              multiple={false}
              customRequest={() => false}
              beforeUpload={beforeUpload}
              className="file-input"
            >
              <Input
                onMouseOver={onMouseOver}
                onMouseLeave={() => setIsShow(false)}
                prefix={<FolderOpenOutlined style={{ opacity: '0.45', color: 'rgba(0,0,0,0.65)' }} />}
                value={fileName}
                placeholder={intl.get('knowledge.pleaseUpload')}
              />
            </Upload>
          </Form.Item>
        </Form>
        {_.isEmpty(fileData) ? null : (
          <div
            onMouseOver={onMouseOver}
            className={classNames('close-icon kw-pointer', { show: isShow })}
            onClick={onDeleteFile}
          >
            <IconFont type="icon-shibai" style={{ fontSize: 12, paddingTop: 5, opacity: '0.45' }} />
          </div>
        )}
        <div className="extraBox">
          <div className="fileExtra">
            <span className="extra-circle">•</span>
            {intl.get('knowledge.uploadJson')}
          </div>
          <div className="fileExtra">
            <span className="extra-circle">•</span>
            {intl.get('knowledge.uploadSize')}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModalImport;
