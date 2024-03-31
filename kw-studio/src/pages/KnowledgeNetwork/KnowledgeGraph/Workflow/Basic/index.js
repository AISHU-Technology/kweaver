import React, { useState, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useLocation } from 'react-router-dom';
import { Spin, Form, Button, Input, message, ConfigProvider, Switch } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getParam, sessionStore } from '@/utils/handleFunction';
import { GRAPH_DB_TYPE, ONLY_KEYBOARD } from '@/enums';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import serviceWorkflow from '@/services/workflow';
import TrimmedInput from '@/components/TrimmedInput';
import servicesCreateEntity from '@/services/createEntity';
import './style.less';

const FormItem = Form.Item;
const { TextArea } = Input;
const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 }
};

const Basic = (props, ref) => {
  const { next, setBasicData, setGraphStepNum, setOntologyId, graphId, setGraphId, dataLoading, basicData } = props;
  const [form] = Form.useForm();
  const formSnapshot = useRef({}); // 保存时生成表单数据快照, 用于判断表单是否被修改
  const [disabled, setDisabled] = useState(false);
  const [nextLoad, setNextLoad] = useState(false);
  // const [showTip, setShowTip] = useState(false); // 关闭上传按钮的开关
  // const [uploadable, setUploadable] = useState({}); // 保存配置信息
  const location = useLocation();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  const knId = useMemo(() => {
    return location?.search
      ?.slice(1)
      ?.split('&')
      ?.filter(item => item?.includes('knId'))?.[0]
      ?.split('=')[1];
  }, [location?.search]);

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    isModify: () => {
      const field = ['graph_Name', 'graph_des'];

      return field.some(key => {
        // 将undefined和''统一转化为空字符串
        const oldValue = formSnapshot.current[key] || '';
        const curValue = form.getFieldValue(key) || '';

        return oldValue !== curValue;
      });
    },
    next: basicNext
  }));

  useEffect(() => {
    didMount();
  }, [graphId]);

  /** 获取系统配置信息 */
  // const getSysConfig = async () => {
  //   try {
  //     const res = await servicesKnowledgeNetwork.getSysConfig();
  //     if (res?.res) {
  //       const type = res?.res.graph_db_type || '';
  //       const eceph = res?.res.is_ECeph_available || false;
  //       setUploadable({ ad_graph_db_type: type, eceph_available: eceph });
  //       return { ad_graph_db_type: type, eceph_available: eceph };
  //     }
  //     return {};
  //   } catch (err) {
  //     //
  //     return {};
  //   }
  // };

  const didMount = async () => {
    form.setFieldsValue({ ...basicData });
    formSnapshot.current = { ...basicData };
    // const info = await getSysConfig();
    // 删除to_be_uploaded
  };

  /**
   * 创建本体
   */
  const createOntology = async id => {
    try {
      const data = {
        ontology_name: '',
        ontology_des: ''
      };
      const requestData = {
        graph_step: 'graph_otl',
        updateoradd: 'add',
        graph_process: [data]
      };
      const mess = await servicesCreateEntity.changeFlowData(id, requestData);
      if (mess && mess.ontology_id) {
        setOntologyId(mess.ontology_id);
        return true;
      }

      if (mess?.Code === 500002 || mess?.Code === 500001) {
        message.error(mess.Cause);
        return false;
      }
      return true;
    } catch (error) {
      message.error(error);
    }
  };

  /**
   * 发送请求保存数据
   * @param {Event} e 点击事件
   * @param {Boolean} isNext 是否是保存并下一步
   */
  const saveData = async (e, isNext = false) => {
    if (disabled || dataLoading || nextLoad) {
      return;
    }

    e?.preventDefault();
    await form.validateFields();

    if (form.getFieldError('password')[0] && form.getFieldError('username')[0]) {
      return;
    }

    setNextLoad(true);

    form.validateFields().then(async values => {
      const { graph_Name, graph_des, to_be_uploaded } = values;
      setDisabled(true);

      const body = {
        graph_step: 'graph_baseInfo',
        // graph_process: [{ graph_Name, graph_des: graph_des || '', to_be_uploaded: isUpLoad }],
        graph_process: { graph_Name, graph_des: graph_des || '' },
        knw_id:
          window.sessionStorage.getItem('selectedKnowledgeId') &&
          parseInt(window.sessionStorage.getItem('selectedKnowledgeId'))
      };

      if (!graphId) {
        // 新建
        const res = await serviceWorkflow.graphCreate(body);

        if (res && res.res) {
          const graph_id = parseInt(res.res.split(' ')[0]);
          setGraphId(graph_id);
          const buildOntology = await createOntology(graph_id);
          if (!buildOntology) return;
          const rul = `/knowledge/workflow/create?id=${
            res.res.split(' ')[0]
            // }&knId=${knId}&status=edit&to_be_uploaded=${isUpLoad}`;
          }&knId=${knId}&status=edit`;
          window.history.replaceState({}, 0, rul);
          setBasicData(body.graph_process);
          setGraphStepNum(1);
          isNext && next();
          formSnapshot.current = values;

          !isNext && message.success(intl.get('datamanagement.savedSuccessfully'));
        }

        if (res && res.Code) {
          if (res.Code === 500002) {
            form.setFields([
              {
                name: 'graph_Name',
                errors: [intl.get('global.repeatName')]
              }
            ]);
          } else if (res.Code === 500001) {
            message.error(res.Cause);
          } else if (res.Code === 500004) {
            form.setFields([
              {
                name: 'graph_Name',
                errors: [intl.get('global.repeatName')]
              }
            ]);
          } else if ([500007, 500008].includes(res.Code)) {
            message.error(intl.get('workflow.basic.dbErr'));
          } else if (res.Code === 500057) {
            message.error(intl.get('graphList.noNetworkIdErr')); // 单一无权限
          } else {
            next(res);
          }
        }
      } else {
        // 编辑
        const res = await serviceWorkflow.graphEdit(graphId, body);

        if (res && res.res) {
          setBasicData(body.graph_process);
          isNext && next();
          formSnapshot.current = values;
          !isNext && message.success(intl.get('datamanagement.savedSuccessfully'));
        }

        if (res && res.Code) {
          if (res.Code === 500002) {
            form.setFields([
              {
                name: 'graph_Name',
                errors: [intl.get('global.repeatName')]
              }
            ]);
          } else if (res.Code === 500001) {
            message.error(res.Cause);
          } else if (res.Code === 500004) {
            form.setFields([
              {
                name: 'graph_Name',
                errors: [intl.get('global.repeatName')]
              }
            ]);
          } else if ([500007, 500008].includes(res.Code)) {
            message.error(intl.get('workflow.basic.dbErr'));
          } else if (res.Code === 500057) {
            message.error(intl.get('graphList.noNetworkIdErr')); // 单一无权限
          } else {
            next(res);
          }
        }
      }

      setDisabled(false);
    });

    setNextLoad(false);
  };

  // 点击下一步
  const basicNext = e => {
    if (viewMode) {
      next();
    } else {
      saveData(e, true);
    }
  };

  // 点击保存
  const onSave = e => {
    saveData(e);
  };

  return (
    <div className="graph-basic-wrapper">
      <div className="g-basic">
        <Spin spinning={nextLoad} indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}>
          <Form {...layout} form={form} className="basic-from" colon={false}>
            <FormItem
              name="graph_Name"
              label={<span className="from-label">{intl.get('workflow.basic.graphName')}</span>}
              validateFirst={true}
              rules={[
                { required: true, message: intl.get('global.noNull') },
                {
                  type: 'string'
                },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                },
                {
                  validator: async (rule, value) => {
                    if (/\n|\r/g.test(value)) {
                      throw new Error(intl.get('workflow.basic.desConsists'));
                    }
                  }
                }
              ]}
            >
              <TrimmedInput disabled={viewMode} autoComplete="off" />
            </FormItem>

            <FormItem
              name="graph_des"
              label={<span className="from-label">{intl.get('workflow.basic.graphDescription')}</span>}
              validateFirst={true}
              rules={[
                {
                  type: 'string'
                },
                { max: 255, message: intl.get('workflow.basic.maxLong', { length: 255 }) },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                }
              ]}
            >
              <TextArea disabled={viewMode} rows={6} autoComplete="off" />
            </FormItem>

            {/* {uploadable?.ad_graph_db_type === GRAPH_DB_TYPE?.NEBULA && (
              <FormItem
                label={intl.get('uploadService.uploadRadio')}
                name="to_be_uploaded"
                extra={showTip && intl.get('uploadService.workflowUploadDes')}
                valuePropName="checked"
              >
                {uploadable?.eceph_available ? (
                <Switch disabled onChange={e => setShowTip(!e)}></Switch>
                ) : (
                  <span className="kw-c-subtext">{intl.get('uploadService.ecephTip')}</span>
                )}
              </FormItem>
            )} */}

            <ConfigProvider autoInsertSpaceInButton={false}>
              <div className="kw-content-center">
                {!viewMode && (
                  <Button className="ant-btn-default save-btn btn" onClick={onSave}>
                    {intl.get('workflow.save1')}
                  </Button>
                )}
                <Button type="primary" className="next-btn btn" onClick={basicNext}>
                  {intl.get('global.next')}
                </Button>
              </div>
            </ConfigProvider>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default forwardRef(Basic);
