/* eslint-disable max-lines */
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Radio, Space, Select, Input, Dropdown, Menu, message, Form, Button } from 'antd';
import type { RadioChangeEvent } from 'antd';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import _ from 'lodash';
import servicesCreateEntity from '@/services/createEntity';
import { formatConversion, editConversion, onPartitionError, onHandleSelectFormat } from './assistFunction';
import { EXAMPLE_SHOW } from './enums';
import { copyToBoard } from '@/utils/handleFunction';
import HOOKS from '@/hooks';
import './style.less';
import FormItem from 'antd/lib/form/FormItem';
import LoadingMask from '@/components/LoadingMask';

const { Option } = Select;
const PartitionConfig: React.ForwardRefRenderFunction<unknown, any> = (
  {
    partitionMes,
    selectFile,
    setHiveSave,
    setSearchQuery,
    searchQuery,
    hiveSave,
    handleSelectData,
    setHandleSelectData,
    selectData,
    setSelectData,
    radioOpen,
    setRadioOpen
  },
  ref
) => {
  const [form] = Form.useForm();
  const language = HOOKS.useLanguage();
  const [addCount, setAddCount] = useState<any>([0]); // 新建配置的数量
  const [nowNumber, setNowNumber] = useState(0);
  const [isShowDrop, setIsShowDrop] = useState(false); // 示例下拉框
  const [showExample, setShowExample] = useState<any>(-1);
  const [showDrop, setShowDrop] = useState<any>(-1);
  const [inputPreview, setInputPreview] = useState(''); // 预览
  const [handleMes, setHandleMes] = useState<any>({}); // 对partitionMes格式处理后的数据
  const [allSelectMes, setAllSelectMes] = useState([]);
  const [open, setOpen] = useState(false);
  const [saveData, setSaveData] = useState<any>([]); // 保存的数据
  const [saveSelectInput, setSaveSelectInput] = useState<any[]>([]); // select和input填入的数据整合到一起
  const [selectAll, setSelectAll] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  useImperativeHandle(ref, () => ({
    onSave
  }));

  useEffect(() => {
    onSelectFile();
    document.addEventListener('click', () => {
      setOpen(false);
      setShowDrop(-1);
    });
  }, []);

  const onSelectFile = () => {
    const newData = _.filter(partitionMes, (item: any) => {
      return item.table_name === selectFile?.file_name;
    });
    setSaveData(newData);
    onSelectMes(newData);
  };

  /**
   * 获取下拉框中的数据
   */
  const onSelectMes = async (save?: any) => {
    try {
      setLoading(true);
      const data = {
        ds_id: selectFile?.ds_id,
        table_name: selectFile?.file_name
      };
      const { res } = await servicesCreateEntity.getHivePartition(data); // 获取分区表名接口
      setLoading(false);
      if (res) {
        setAllSelectMes(res);
        const newData = _.filter(res, (item: any) => !handleSelectData.includes(item));
        setSelectData(newData);
        onHandleSaveSelect(res, newData, save);
      }
    } catch (err) {
      if (!err?.type) return;
      const { Description } = err.response || {};
      // message.error(Description);
      message.error({
        content: Description,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
  };

  const onHandleSaveSelect = (res: any, data: any, save?: any) => {
    // 没关弹窗时保存的数据
    if (!_.isEmpty(hiveSave)) {
      onHandleData(hiveSave, res, data);
      return;
    }
    // 编辑 | 保存后再打开弹窗 时显示的数据
    if (_.isEmpty(selectFile?.partition_infos) && _.isEmpty(save || saveData)) {
      return;
    }
    if (_.isEmpty(save || saveData)) {
      setRadioOpen(selectFile?.partition_usage === true ? 1 : 0);
    } else {
      setRadioOpen((save || saveData)?.[0]?.isOpen === true ? 1 : 0);
    }
    const arrReduce = _.reduce(
      save || saveData,
      (pre: any, key: any) => {
        return { ...pre, ...key.value };
      },
      {}
    );
    setHandleMes(saveData);
    onHandleData(_.isEmpty(arrReduce) ? selectFile?.partition_infos : arrReduce, res, data);
  };

  /**
   * 数据格式处理 转化成form可写入的格式
   */
  const onHandleData = (data: any, res?: any, n?: any) => {
    const { editSaveAll, newAddCount } = editConversion(data);
    form.setFieldsValue(editSaveAll);
    setNowNumber(Object.keys(editSaveAll).length / 2 - 1);
    setSelectAll(Object.keys(data).length);

    const searchArr = _.filter(Object.entries(editSaveAll), (item: any) => {
      if (item[0].includes('input_')) {
        item[0] = item[0].split('_')[1];
        return item;
      }
    });
    setSearchQuery(searchArr);
    setAddCount(newAddCount);
    onHandleSelect(editSaveAll, '', res);
  };

  const onChange = (e: RadioChangeEvent) => {
    setRadioOpen(e.target.value);
  };

  /**
   * 新建配置
   */
  const onAddPartition = (number: any) => {
    const nowCounts = nowNumber + number;
    setNowNumber(nowCounts);
    setAddCount([...addCount, nowCounts]);
  };

  /**
   * 删除
   */
  const onDelete = (data: number) => {
    const newFilterArray = _.filter(addCount, (i: number) => i !== data);
    setAddCount(newFilterArray);

    const arrReduce = _.reduce(
      saveData,
      (pre: any, key: any) => {
        return { ...pre, ...key.value };
      },
      {}
    );

    const { editSaveAll } = editConversion(_.isEmpty(saveData) ? selectFile?.partition_infos : arrReduce);
    const newEditAll = _.filter(Object.entries(editSaveAll), (i: any) => {
      return parseInt(i[0].split('_')[1]) !== data;
    });
    const newEditSaveAll = _.reduce(
      newEditAll,
      (pre: any, key: any) => {
        pre[key[0]] = key[1];
        return pre;
      },
      {}
    );
    const editMes = [...saveSelectInput, ...Object.entries(newEditSaveAll)];
    setSaveSelectInput(editMes);
    const { handleInputMes } = onHandleSelectFormat(
      _.isEmpty(saveSelectInput) ? editMes : saveSelectInput,
      true,
      newFilterArray
    );
    const partition_infos = formatConversion(handleInputMes);
    setHiveSave(_.isEmpty(partition_infos) ? newEditSaveAll : partition_infos);
    setSelectAll(
      _.isEmpty(partition_infos) ? Object.keys(newEditSaveAll).length / 2 : Object.keys(partition_infos).length
    );
    onHandleSelect(_.isEmpty(partition_infos) ? newEditSaveAll : partition_infos, data, newFilterArray);
  };

  /**
   * 示例
   */
  const onExample = (data: number) => {
    setShowExample(data);
    setIsShowDrop(true);
  };

  /**
   * 复制
   */
  const onCopy = (data: any) => {
    copyToBoard(data);
    // message.success(intl.get('exploreGraph.success'));
    message.success({
      content: intl.get('exploreGraph.success'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  };

  /**
   * 搜索框
   */
  const onSearchChange = (e: any, number: any) => {
    const { value } = e.target;
    const saveInput = [...searchQuery, [number, value]];
    setSearchQuery(saveInput);
    if (value) {
      setIsShowDrop(false);
      const saveAllMes = [...saveSelectInput, [`input_${number}`, value]];
      const { handleInputMes } = onHandleSelectFormat(saveAllMes);
      setSaveSelectInput(saveAllMes);
      const partition_infos = formatConversion(handleInputMes);
      setHiveSave(partition_infos);
    }
  };

  /**
   * 处理选择框中的数据展示
   */
  const onHandleSelect = (editSaveAll: any, newFilterArray?: any, res?: any, row?: any, handleInputMes?: any) => {
    const inputValueArr: any = [];
    _.filter(Object.entries(_.isEmpty(handleInputMes) ? editSaveAll : handleInputMes), (item: any) => {
      if (
        item[0].includes('select_') &&
        (newFilterArray || addCount).includes(parseInt(item[0].split('_')[1])) &&
        row !== parseInt(item[0].split('_')[1])
      ) {
        inputValueArr.push(item[1]);
      }
    });

    setHandleSelectData(inputValueArr); // 选择一个就将选择的增加一个(去重)
    const newSelectData = _.filter(
      _.isEmpty(allSelectMes) ? res : allSelectMes,
      (item: any) => !inputValueArr.includes(item)
    );
    setSelectData(newSelectData);
  };

  /**
   * 选择框
   */
  const onSelect = (e: any, data: any) => {
    if (e) {
      const saveAllMes = [...saveSelectInput, [`select_${data}`, e]];
      const { handleInputMes } = onHandleSelectFormat(saveAllMes);
      setSaveSelectInput(saveAllMes);
      const partition_infos = formatConversion(handleInputMes);
      onHandleSelect(partition_infos, '', '', '', handleInputMes);
      setSelectAll(Object.keys(partition_infos).length);
      setHiveSave(partition_infos);
    }
  };

  /**
   * 预览
   */
  const onPreview = async (item: any) => {
    try {
      const previewExa = _.filter(searchQuery, (i: any) => {
        return parseInt(i[0]) === parseInt(item);
      });
      const value = _.isEmpty(previewExa) ? '' : previewExa[previewExa.length - 1][1];

      if (!value) {
        form.setFields([
          {
            name: `input_${item}`,
            errors: [intl.get('workflow.information.correct')]
          }
        ]);
        setOpen(false);
        return;
      }
      const { res } = await servicesCreateEntity.previewPartition({ expression: value });

      if (res === undefined) {
        form.setFields([
          {
            name: `input_${item}`,
            errors: [intl.get('workflow.information.correct')]
          }
        ]);
        setOpen(false);
        return;
      }
      setOpen(true);
      if (res) {
        setShowDrop(item);
        setInputPreview(res);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 保存
   */
  const onSave = async () => {
    return form.validateFields().then(async (values: any) => {
      try {
        let partition_infos: any = {};
        if (_.isEmpty(values)) {
          partition_infos = _.isEmpty(hiveSave)
            ? _.isEmpty(handleMes)
              ? selectFile?.partition_infos
              : handleMes
            : hiveSave;
        } else {
          partition_infos = formatConversion(values);
        }
        // 开关关闭 不调检查的接口
        if (radioOpen === 0) {
          return {
            table_name: selectFile?.file_name,
            value: partition_infos,
            isOpen: false
          };
        }
        const data = {
          ds_id: selectFile?.ds_id,
          table_name: selectFile?.file_name,
          partition_infos
        };
        const { res } = await servicesCreateEntity.checkPartition(data);
        // partition_name_error 有值说明没有分区字段
        // partition_expression_error 有值说明该分区字段的变量是错误的
        const allData = values || hiveSave || saveData || selectFile?.partition_infos;
        if (!_.isEmpty(res?.partition_expression_error)) {
          const keyArr = onPartitionError(allData, res, 'variable');
          _.map(keyArr, (i: any) => {
            form.setFields([
              {
                name: `input_${i.split('_')[1]}`,
                errors: [intl.get('workflow.information.correct')]
              }
            ]);
          });
          return;
        }
        if (!_.isEmpty(res?.partition_name_error)) {
          const keyArr = onPartitionError(allData, res, 'select');
          _.map(keyArr, (i: any) => {
            form.setFields([
              {
                name: `input_${i.split('_')[1]}`,
                errors: [intl.get('workflow.information.notExist')]
              }
            ]);
          });
          return;
        }
        setHiveSave({});
        return {
          table_name: selectFile?.file_name,
          value: partition_infos,
          isOpen: radioOpen === 1
        };
      } catch (err) {
        // if (!err?.type) return;
        // const { Description } = err?.response || {};
        // Description && message.error(Description);
      }
    });
  };

  const selectAfter = (item: any) => (
    <div className="kw-center">
      <span className="example kw-pointer" onClick={() => onExample(item)}>
        {intl.get('workflow.information.example')}
      </span>
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item key={inputPreview}>{inputPreview}</Menu.Item>
          </Menu>
        }
        visible={showDrop === item}
        trigger={['click']}
        placement="bottomRight"
        className="drop-down-show"
        getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
      >
        <div className="kw-c-primary kw-pointer preview-time" onClick={() => onPreview(item)}>
          {intl.get('workflow.information.previewExample')}
        </div>
      </Dropdown>
    </div>
  );

  /**
   * 选择框获取焦点时 更新下拉框里的数据
   */
  const onClickRow = (item: any) => {
    if (_.isEmpty(selectFile?.partition_infos) && _.isEmpty(selectFile?.partition_usage) && _.isEmpty(hiveSave)) {
      return;
    }
    const arrReduce = _.reduce(
      saveData,
      (pre: any, key: any) => {
        return { ...pre, ...key.value };
      },
      {}
    );

    if (_.isEmpty(hiveSave)) {
      const { editSaveAll } = editConversion(_.isEmpty(saveData) ? selectFile?.partition_infos : arrReduce);
      onFocusSelect(editSaveAll, item);
    } else {
      const { editSaveAll } = editConversion(hiveSave);
      onFocusSelect(editSaveAll, item);
    }
  };

  const onFocusSelect = (editSaveAll: any, item: any) => {
    const editMes = [...saveSelectInput, ...Object.entries(editSaveAll)];
    setSaveSelectInput(editMes);
    const { handleInputMes } = onHandleSelectFormat(_.isEmpty(saveSelectInput) ? editMes : saveSelectInput);
    const partition_infos = formatConversion(handleInputMes); // 全部数据
    onHandleSelect(_.isEmpty(partition_infos) ? editSaveAll : partition_infos, '', '', item, handleInputMes);
    setHiveSave(_.isEmpty(partition_infos) ? editSaveAll : partition_infos);
  };
  return (
    <div className="partition-config-root">
      <LoadingMask loading={loading} />
      <Format.Title className="kw-mb-5">{intl.get('workflow.information.partition')}</Format.Title>
      <div className="partition-wrap">
        <Radio.Group onChange={onChange} value={radioOpen}>
          <Space direction="vertical">
            <Radio value={0} className="kw-mb-3">
              {intl.get('workflow.information.off')}
            </Radio>
            <Radio value={1}>{intl.get('workflow.information.open')}</Radio>
          </Space>
        </Radio.Group>
        {radioOpen === 1 ? (
          <div className="field-and-variable-box">
            {_.map(addCount, (item: any, index: any) => (
              <Form form={form} key={index}>
                <div className="field-and-variable">
                  <div className="kw-flex kw-mt-5 radio-open">
                    <Form.Item
                      name={`select_${item}`}
                      colon={false}
                      label={
                        <div className="kw-mr-4" style={language === 'zh-CN' ? { width: '55px' } : { width: '105px' }}>
                          {intl.get('workflow.information.field')}
                        </div>
                      }
                      validateFirst={true}
                      rules={[{ required: true, message: intl.get('workflow.information.selectPartition') }]}
                    >
                      <Select
                        placeholder={intl.get('global.pleaseSelect')}
                        className="kw-mr-5 select-partition"
                        allowClear
                        onChange={e => onSelect(e, item)}
                        onFocus={() => onClickRow(item)}
                      >
                        {selectData?.map((item: any) => {
                          return (
                            <Option key={item} value={item}>
                              {item}
                            </Option>
                          );
                        })}
                      </Select>
                    </Form.Item>
                    <IconFont
                      title={intl.get('configSys.delete')}
                      onClick={() => (addCount.length === 1 ? null : onDelete(item))}
                      type="icon-lajitong"
                      className="kw-mt-2"
                      style={
                        addCount.length === 1
                          ? { opacity: 0.25, cursor: 'not-allowed' }
                          : { opacity: 1, cursor: 'pointer' }
                      }
                    />
                  </div>

                  <>
                    <div className="kw-flex radio-open">
                      <div className="partition-input">
                        <FormItem
                          name={`input_${item}`}
                          colon={false}
                          label={
                            <div
                              className="variable-text kw-mr-4"
                              style={language === 'zh-CN' ? { width: '55px' } : { width: '105px' }}
                            >
                              {intl.get('workflow.information.variable')}
                            </div>
                          }
                          rules={[{ required: true, message: intl.get('workflow.information.correct') }]}
                        >
                          <Input
                            placeholder={intl.get('global.pleaseEnter')}
                            allowClear={true}
                            onChange={e => onSearchChange(e, item)}
                            addonAfter={selectAfter(item)}
                          />
                        </FormItem>
                        {isShowDrop && item === showExample ? (
                          <div
                            className="partition-example kw-mt-1"
                            style={{
                              width: language === 'zh-CN' ? '662px' : '613px',
                              left: language === 'zh-CN' ? '82px' : '130px'
                            }}
                          >
                            <div className="drop-header kw-pb-3 kw-pt-3 kw-flex kw-mb-3">
                              <div className="variable-example">{intl.get('workflow.information.variableExample')}</div>
                              <IconFont
                                className="kw-pointer"
                                type="icon-guanbiquxiao"
                                style={{ fontSize: '20px', opacity: 0.25 }}
                                onClick={() => setIsShowDrop(false)}
                              />
                            </div>
                            {EXAMPLE_SHOW.map((item: any) => {
                              return (
                                <div key={item.type}>
                                  <div>
                                    <span className="kw-c-watermark partition-type">
                                      {language === 'en-US' ? (
                                        'type'
                                      ) : (
                                        <>
                                          {intl.get('workflow.information.type').split('|')[0]}
                                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                          {intl.get('workflow.information.type').split('|')[1]}{' '}
                                        </>
                                      )}
                                      ：
                                    </span>
                                    {item.type}
                                  </div>
                                  <div className="kw-center kw-mb-5">
                                    <div className="regular-expression kw-flex">
                                      <span className="kw-c-watermark">
                                        {intl.get('workflow.information.regular')}：
                                      </span>
                                      <span
                                        title={item.regular}
                                        className="regular-time kw-ellipsis"
                                        style={{ maxWidth: language === 'en-US' ? '410px' : '500px' }}
                                      >
                                        {item.regular}
                                      </span>
                                    </div>
                                    <IconFont
                                      title={intl.get('datamanagement.copy')}
                                      type="icon-copy"
                                      className="kw-pointer regular-copy"
                                      onClick={() => onCopy(item.regular)}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                </div>
              </Form>
            ))}

            <div className=" kw-mt-4">
              <Button
                onClick={() => onAddPartition(1)}
                className={`add-btn ${selectAll === allSelectMes.length ? 'kw-c-subtext' : 'kw-c-primary'}`}
                disabled={selectAll === allSelectMes.length}
                style={{ border: 'none', background: '#fff', padding: '0px' }}
              >
                <IconFont type="icon-Add" className="kw-mr-2" />
                {intl.get('workflow.information.newConfig')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default forwardRef(PartitionConfig);
