import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { withRouter } from 'react-router-dom';
import { Form, Input, ConfigProvider, Button } from 'antd';

import servicesCreateEntity from '@/services/createEntity';

import './style.less';

class EditEntityModal extends Component {
  componentDidMount() {
    this.props.onEditEntityModalRef(this);

    this.formeRef.current.setFieldsValue({
      entityname: this.props.ontology_name ? this.props.ontology_name : this.props.graphName,
      entitydescribe: this.props.ontology_des
    });
  }

  formeRef = React.createRef();

  /**
   * @description 提交表单
   */
  onFinish = value => {
    const { ontology_id, setEditNewName } = this.props;
    setEditNewName(value.entityname);

    const data = {
      ontology_name: value.entityname,
      ontology_des: value.entitydescribe || ''
    };

    // 流程模块
    if (this.isFlow()) {
      this.flowHanle(value);

      return;
    }

    // 创建本体模块
    // if (ontology_id) {
    //   this.changeEntity(data, ontology_id);

    //   return;
    // }

    // this.addEntity(data);
  };

  /**
   * @description 创建本体
   */
  // addEntity = async data => {
  //   const res = await servicesCreateEntity.addEntity(data);

  //   if (res && res.res) {
  //     this.addEntityT(res, data);

  //     return;
  //   }

  //   if (res && res.Code === 500002) {
  //     this.addEntityF();
  //   }
  // };

  /**
   * @description 创建成功执行
   */
  addEntityT = (res, data) => {
    this.props.setOntologyId(res.res.ontology_id);
    this.props.setName(data.ontology_name);
    this.props.setDes(data.ontology_des);

    this.props.setEditEntityModal(false);
  };

  /**
   * @description 创建失败执行
   */
  addEntityF = () => {
    this.formeRef.current.setFields([
      {
        name: 'entityname',
        errors: [intl.get('createEntity.repeatName')]
      }
    ]);
  };

  /**
   * @description 修改本体名称或描述
   */
  changeEntity = async (data, id) => {
    const res = await servicesCreateEntity.changeEntityTent(data, id);

    if (res && res.res) {
      this.changeEntityT(data);

      return;
    }

    if (res && res.Code === 500002) {
      this.addEntityF();
    }
  };

  /**
   * @description 修改成功执行
   */
  changeEntityT = data => {
    this.props.setName(data.ontology_name);
    this.props.setDes(data.ontology_des);

    this.props.setEditEntityModal(false);
  };

  /**
   * @description 流程里本体控制
   */
  flowHanle = value => {
    const { ontology_id } = this.props;

    // 修改本体
    if (ontology_id) {
      this.flowEditEntity(value);

      return;
    }

    // this.flowAddEntity(value);
  };

  /**
   * @description 流程添加本体
   */
  flowAddEntity = async value => {
    // 创建本体
    const data = {
      ontology_name: value.entityname,
      ontology_des: value.entitydescribe || ''
    };

    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'add',
      graph_process: [data]
    };

    const resData = await servicesCreateEntity.changeFlowData(this.props.graphId, requestData);

    if (resData && resData.Code === 500002) {
      this.addEntityF();
    }

    if (resData && resData.res && resData.res.ontology_id) {
      this.props.setOntologyId(resData.res.ontology_id);
      this.changeEntityT(data);

      // 初始化数据
      if (!this.props.ontoData[0]) {
        this.props.setOntoData([
          {
            entity: [],
            edge: [],
            used_task: [],
            ontology_name: value.entityname,
            ontology_des: value.entitydescribe,
            id: resData.res.ontology_id
          }
        ]);
      }
    }
  };

  /**
   * @description 流程编辑本体
   */
  flowEditEntity = async value => {
    const data = {
      ontology_name: value.entityname,
      ontology_des: value.entitydescribe || '',
      id: this.props.ontology_id
    };
    this.props.setName(value.entityname);

    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'update_otl_name',
      graph_process: [data]
    };

    const resData = await servicesCreateEntity.changeFlowData(this.props.graphId, requestData);

    if (resData && resData.Code === 500002) {
      this.addEntityF();
    }

    if (resData && resData.res) {
      this.changeEntityT(data);
    }
  };

  /**
   * @description 是否在流程中
   */
  isFlow = () => {
    if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
      return true;
    }

    return false;
  };

  /**
   * @description 流程中新建本体保存并退出
   */
  saveAndQuit = () => {
    this.formeRef &&
      this.formeRef.current &&
      this.formeRef.current
        .validateFields()
        .then(() => {
          if (this.props.ontology_id) {
            return;
          }

          // 创建本体
          const data = {
            ontology_name: this.formeRef.current.getFieldValue('entityname'),
            ontology_des: this.formeRef.current.getFieldValue('entitydescribe') || ''
          };

          const requestData = {
            graph_step: 'graph_otl',
            updateoradd: 'add',
            graph_process: [data]
          };

          servicesCreateEntity.changeFlowData(this.props.graphId, requestData);
        })
        .catch(() => {});
  };

  render() {
    const { ontology_id } = this.props;

    return (
      <div className="edit-entity-modal">
        <Form layout="vertical" onFinish={this.onFinish} ref={this.formeRef}>
          <Form.Item
            label={[intl.get('createEntity.ontologyName')]}
            name="entityname"
            className="entity-name"
            rules={[
              { required: true, message: [intl.get('createEntity.inputNotEmpty')] },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const reg = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g;

                  if (!getFieldValue('entityname')) {
                    return Promise.resolve();
                  }

                  if (value && !reg.test(getFieldValue('entityname'))) {
                    return Promise.reject([intl.get('createEntity.onlyThreeType')]);
                  }

                  if (value.length > 50) {
                    return Promise.reject([intl.get('createEntity.noMoreThan50')]);
                  }

                  return Promise.resolve();
                }
              })
            ]}
          >
            <Input autoComplete="off" className="entity-input" placeholder={[intl.get('createEntity.inputEnName')]} />
          </Form.Item>

          <Form.Item
            label={[intl.get('createEntity.ontologyDescription')]}
            name="entitydescribe"
            className="entity-describe"
            rules={[
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const reg =
                    /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`{}[\];:,.?·“”’‘'"<>|/~！@#￥%…&*（）—+。={}|【】：；、《》？，。/\n\\\s]+$)|-/g;

                  if (!getFieldValue('entitydescribe')) {
                    return Promise.resolve();
                  }

                  if (value && !reg.test(getFieldValue('entitydescribe'))) {
                    return Promise.reject([intl.get('createEntity.onlyKeyBoad')]);
                  }

                  if (value.length > 150) {
                    return Promise.reject([intl.get('createEntity.noMoreThan150')]);
                  }

                  return Promise.resolve();
                }
              })
            ]}
          >
            <Input.TextArea className="des-input" placeholder={[intl.get('createEntity.inputDes')]} />
          </Form.Item>

          {this.isFlow() ? (
            <Form.Item className="bottom-button">
              {typeof ontology_id !== 'number' ? (
                <ConfigProvider autoInsertSpaceInButton={false}>
                  <Button
                    className="ant-btn-default cancel quit"
                    onClick={() => {
                      this.props.setEditEntityModal(false);

                      this.props.prev();
                    }}
                  >
                    {[intl.get('createEntity.previous')]}
                  </Button>
                </ConfigProvider>
              ) : null}

              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button
                  className="ant-btn-default cancel"
                  onClick={() => {
                    typeof ontology_id !== 'number'
                      ? this.props.setQuitVisible(true)
                      : this.props.setEditEntityModal(false);
                  }}
                >
                  {typeof ontology_id === 'number'
                    ? [intl.get('createEntity.cancel')]
                    : [intl.get('createEntity.signout')]}
                </Button>
              </ConfigProvider>

              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button type="primary" htmlType="submit" className="save">
                  {typeof ontology_id === 'number' ? [intl.get('createEntity.ok')] : [intl.get('createEntity.create')]}
                </Button>
              </ConfigProvider>
            </Form.Item>
          ) : (
            <Form.Item className="bottom-button">
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button
                  className="ant-btn-default cancel"
                  onClick={() => {
                    this.props.setEditEntityModal(false);

                    if (typeof ontology_id !== 'number') {
                      this.props.history.push('/home/data-management/onto');
                    }
                  }}
                >
                  {typeof ontology_id === 'number'
                    ? [intl.get('createEntity.cancel')]
                    : [intl.get('createEntity.signout')]}
                </Button>
              </ConfigProvider>

              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button type="primary" htmlType="submit" className="save">
                  {typeof ontology_id === 'number' ? [intl.get('createEntity.ok')] : [intl.get('createEntity.create')]}
                </Button>
              </ConfigProvider>
            </Form.Item>
          )}
        </Form>
      </div>
    );
  }
}

EditEntityModal.defaultProps = {
  setOntologyId: () => {},
  setName: () => {},
  setDes: () => {},
  setEditEntityModal: () => {},
  onEditEntityModalRef: () => {}
};

export default withRouter(EditEntityModal);
