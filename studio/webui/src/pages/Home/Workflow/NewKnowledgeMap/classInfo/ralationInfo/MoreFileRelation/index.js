/* eslint-disable max-lines */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select, ConfigProvider, Empty, Input, Modal, Button } from 'antd';
import { CaretRightOutlined, InfoCircleFilled } from '@ant-design/icons';

import kong from '@/assets/images/empty.svg';
import './style.less';

const { Option } = Select;

class MoreFileRelation extends Component {
  state = {
    first: true,
    equation_begin: '等于',
    equation_end: '等于',
    equation: '被包含',
    modalVisible: false,
    index: 0 // 要清空的列表的下标
  };

  componentDidUpdate(preProps) {
    if (this.props.moreFileData !== preProps.moreFileData) {
      const { moreFileData } = this.props;

      this.setState({
        equation_begin: moreFileData.equation_begin || '等于',
        equation_end: moreFileData.equation_end || '等于',
        equation: moreFileData.equation || '被包含'
      });
    }
  }

  /**
   * @description 清空多文件关系
   */
  emptyAttr = e => {
    const { moreFileData } = this.props;

    moreFileData.begin_class_prop = { value: '', Type: 0 };
    moreFileData.relation_begin_pro = { value: '', Type: 0 };
    moreFileData.relation_end_pro = { value: '', Type: 0 };
    moreFileData.end_class_prop = { value: '', Type: 0 };
    moreFileData.equation_begin = '';
    moreFileData.equation = '';
    moreFileData.equation_end = '';

    this.props.changeMoreFileData(moreFileData);

    this.setState({ moreFileData, modalVisible: false });
    setTimeout(() => {
      this.props.changeEdgeError();
    }, 0);
  };

  /**
   * @description 清空按钮是否可点击
   */
  clearIsDisable = () => {
    const { moreFileData } = this.props;

    if (moreFileData?.begin_class_prop?.value) return true;
    if (moreFileData?.end_class_prop?.value) return true;
    if (moreFileData?.relation_begin_pro?.value) return true;
    if (moreFileData?.relation_end_pro?.value) return true;

    return false;
  };

  /**
   * @description 选择起始点属性
   */
  selectStart = value => {
    const { moreFileData, entityName } = this.props;

    if (value) {
      moreFileData.begin_class_prop = { value, Type: 0 };
    } else {
      moreFileData.begin_class_prop = { value: '', Type: 0 };
    }

    // 默认值
    if (!entityName.value && !moreFileData.equation) moreFileData.equation = '被包含';
    this.props.changeMoreFileData(moreFileData);
    this.setState({ moreFileData });
    setTimeout(() => {
      this.props.changeEdgeError();
    }, 0);
  };

  /**
   * @description 选择起终点属性
   */
  selectEnd = value => {
    const { moreFileData } = this.props;

    if (value) {
      moreFileData.end_class_prop = { value, Type: 0 };
    } else {
      moreFileData.end_class_prop = { value: '', Type: 0 };
    }

    this.props.changeMoreFileData(moreFileData);
    this.setState({ moreFileData });
    setTimeout(() => {
      this.props.changeEdgeError();
    }, 0);
  };

  /**
   * @description 外联关系选择边属性
   */
  edgeAttrSelectTwo = (type, value) => {
    const { moreFileData } = this.props;

    if (type === 'start') {
      if (value) {
        moreFileData.relation_begin_pro = { value, Type: 0 };
      } else {
        moreFileData.relation_begin_pro = { value: '', Type: 0 };
      }
    }

    if (type === 'end') {
      if (value) {
        moreFileData.relation_end_pro = { value, Type: 0 };
      } else {
        moreFileData.relation_end_pro = { value: '', Type: 0 };
      }
    }

    if (type === 'equation_begin') {
      if (value) {
        moreFileData.equation_begin = value;
      } else {
        moreFileData.equation_begin = '';
      }
    }

    if (type === 'equation_end') {
      if (value) {
        moreFileData.equation_end = value;
      } else {
        moreFileData.equation_end = '';
      }
    }

    if (type === 'equation') {
      if (value) {
        moreFileData.equation = value;
      } else {
        moreFileData.equation = '';
      }
    }

    this.props.changeMoreFileData(moreFileData);
    this.setState({ moreFileData });
    setTimeout(() => {
      this.props.changeEdgeError();
    }, 0);
  };

  /**
   * @description 自定义属性空白页
   */
  attrCustomizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty
        image={kong}
        description={
          <div>
            <div style={{ fontWeight: 400, color: 'rgba(0, 0, 0, 0.85)' }}>
              {[intl.get('workflow.knowledge.noData')]}
            </div>
            <div>{[intl.get('workflow.knowledge.ConfigFirst')]}</div>
          </div>
        }
      />
    </div>
  );

  render() {
    const { startNode, endNode, moreFileData, attrSelect, entityName } = this.props;
    const { equation_end, equation_begin, modalVisible, equation } = this.state;
    const { anyDataLang } = this.props;

    return (
      <div>
        {moreFileData?.begin_class_prop && (
          <div>
            <div className="title-relation">
              <span>{[intl.get('workflow.knowledge.RelationMap')]}</span>

              <span
                className={this.clearIsDisable() ? 'clear' : 'disable-click'}
                onClick={e => {
                  e.stopPropagation();
                  if (this.clearIsDisable()) {
                    this.setState({ modalVisible: true });
                  }
                }}
              >
                {[intl.get('workflow.knowledge.empty')]}
              </span>
            </div>

            <div className="Relational-mapping">
              {entityName?.value ? (
                <div className="more-file">
                  <div className="select-title">
                    <div className="start">{intl.get('workflow.knowledge.begin')}</div>
                    <div className="relation">{intl.get('workflow.knowledge.rel')}</div>
                    <div className="end">{intl.get('workflow.knowledge.end')}</div>
                  </div>
                  <div className="select-description">
                    <div className="entity-pro">{intl.get('workflow.knowledge.VeAttr')}</div>
                    <div className="left-line">
                      <div className="arrowhead"></div>
                    </div>
                    <div className={anyDataLang === 'zh-CN' ? 'relation-pro' : 'en-relation-pro'}>
                      {intl.get('workflow.knowledge.relationAttr')}
                    </div>
                    <div className="right-line">
                      <div className="arrowhead"></div>
                    </div>
                    <div className="entity-pro">{intl.get('workflow.knowledge.VeAttr')}</div>
                  </div>

                  <div className="select-box">
                    <div className={anyDataLang === 'zh-CN' ? 'line' : 'en-line'}>
                      <Input.Group compact>
                        <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                          <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            className={
                              moreFileData.begin_class_prop && moreFileData.begin_class_prop.Type
                                ? 'select has-errors ant-select-focused'
                                : 'select'
                            }
                            dropdownStyle={{ maxHeight: 170 }}
                            listHeight={165}
                            placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            onChange={value => {
                              this.selectStart(value);
                            }}
                            value={(moreFileData.begin_class_prop && moreFileData.begin_class_prop.value) || undefined}
                            title={(moreFileData.begin_class_prop && moreFileData.begin_class_prop.value) || undefined}
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            {startNode &&
                              startNode.properties &&
                              startNode.properties.map(item => {
                                return (
                                  <Option key={item[0]} title={item}>
                                    {item[0]}
                                  </Option>
                                );
                              })}
                          </Select>
                          <Select
                            className="rel-select"
                            value={moreFileData.equation_begin || equation_begin}
                            onChange={value => {
                              this.setState({ equation_begin: value });
                              this.edgeAttrSelectTwo('equation_begin', value);
                            }}
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            <Option key="等于" value="等于">
                              {intl.get('workflow.knowledge.equal')}
                            </Option>
                            <Option key="被包含" value="被包含">
                              {intl.get('workflow.knowledge.Included')}
                            </Option>
                          </Select>
                          <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            className={
                              moreFileData && moreFileData.relation_begin_pro && moreFileData.relation_begin_pro.Type
                                ? 'select-relation has-errors'
                                : 'select-relation'
                            }
                            dropdownStyle={{ maxHeight: 170 }}
                            listHeight={165}
                            placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            onChange={value => {
                              this.edgeAttrSelectTwo('start', value);
                            }}
                            value={
                              (moreFileData &&
                                moreFileData.relation_begin_pro &&
                                moreFileData.relation_begin_pro.value) ||
                              undefined
                            }
                            title={
                              (moreFileData &&
                                moreFileData.relation_begin_pro &&
                                moreFileData.relation_begin_pro.value) ||
                              undefined
                            }
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            {attrSelect &&
                              attrSelect.length > 0 &&
                              attrSelect.map((item, attrIndex) => {
                                return (
                                  <Option key={item} title={item}>
                                    {item}
                                  </Option>
                                );
                              })}
                          </Select>
                        </ConfigProvider>
                      </Input.Group>
                    </div>

                    <div className="relation-line"></div>

                    <div className={anyDataLang === 'zh-CN' ? 'line other' : 'en-line'}>
                      <Input.Group compact>
                        <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                          <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            className={
                              moreFileData && moreFileData.relation_end_pro && moreFileData.relation_end_pro.Type
                                ? 'select-relation has-errors ant-select-focused'
                                : 'select-relation'
                            }
                            dropdownStyle={{ maxHeight: 170 }}
                            listHeight={165}
                            placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            onChange={value => {
                              this.edgeAttrSelectTwo('end', value);
                            }}
                            value={
                              (moreFileData && moreFileData.relation_end_pro && moreFileData.relation_end_pro.value) ||
                              undefined
                            }
                            title={
                              (moreFileData && moreFileData.relation_end_pro && moreFileData.relation_end_pro.value) ||
                              undefined
                            }
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            {attrSelect &&
                              attrSelect.length > 0 &&
                              attrSelect.map(item => {
                                return (
                                  <Option key={item} title={item}>
                                    {item}
                                  </Option>
                                );
                              })}
                          </Select>
                          <Select
                            className="rel-select"
                            value={moreFileData.equation_end || equation_end}
                            onChange={value => {
                              this.setState({
                                equation_end: value
                              });
                              this.edgeAttrSelectTwo('equation_end', value);
                            }}
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            <Option key="等于" value="等于">
                              {intl.get('workflow.knowledge.equal')}
                            </Option>
                            <Option key="包含" value="包含">
                              {intl.get('workflow.knowledge.contain')}
                            </Option>
                          </Select>
                          <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            className={
                              moreFileData.end_class_prop && moreFileData.end_class_prop.Type
                                ? 'select has-errors'
                                : 'select'
                            }
                            dropdownStyle={{ maxHeight: 170 }}
                            listHeight={165}
                            placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            onChange={value => {
                              this.selectEnd(value);
                            }}
                            value={(moreFileData.end_class_prop && moreFileData.end_class_prop.value) || undefined}
                            title={(moreFileData.end_class_prop && moreFileData.end_class_prop.value) || undefined}
                            suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                          >
                            {endNode &&
                              endNode.properties &&
                              endNode.properties.map(item => {
                                return (
                                  <Option key={item[0]} title={item[0]}>
                                    {item[0]}
                                  </Option>
                                );
                              })}
                          </Select>
                        </ConfigProvider>
                      </Input.Group>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="default-box">
                  <div className="default-title">
                    <div className="start">{intl.get('workflow.knowledge.begin')}</div>
                    <div className="end">{intl.get('workflow.knowledge.end')}</div>
                  </div>
                  <div className="default-description">
                    <div className="start">{intl.get('workflow.knowledge.VeAttr')}</div>
                    <span className="middle-line">
                      <div className="arrowhead"></div>
                    </span>
                    <div className="end">{intl.get('workflow.knowledge.VeAttr')}</div>
                  </div>
                  <div className="select-box">
                    <Input.Group compact>
                      <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                        <Select
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                          className={
                            moreFileData.begin_class_prop && moreFileData.begin_class_prop.Type
                              ? 'select has-errors ant-select-focused'
                              : 'select'
                          }
                          dropdownStyle={{ maxHeight: 170 }}
                          listHeight={165}
                          placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                          onChange={value => {
                            this.selectStart(value);
                          }}
                          value={(moreFileData.begin_class_prop && moreFileData.begin_class_prop.value) || undefined}
                          title={(moreFileData.begin_class_prop && moreFileData.begin_class_prop.value) || undefined}
                          suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                        >
                          {startNode &&
                            startNode.nodeInfo &&
                            startNode.nodeInfo.attrSelect &&
                            startNode.nodeInfo.attrSelect.map(item => {
                              return (
                                <Option key={item} title={item}>
                                  {item}
                                </Option>
                              );
                            })}
                        </Select>

                        <Select
                          value={moreFileData.equation || equation}
                          className="other"
                          onChange={value => {
                            this.setState({
                              equation: value
                            });
                            this.edgeAttrSelectTwo('equation', value);
                          }}
                          suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                        >
                          <Option key="被包含" value="被包含">
                            {intl.get('workflow.knowledge.Included')}
                          </Option>
                          <Option key="等于" value="等于">
                            {intl.get('workflow.knowledge.equal')}
                          </Option>
                          <Option key="包含" value="包含">
                            {intl.get('workflow.knowledge.contain')}
                          </Option>
                        </Select>

                        <Select
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                          className={
                            moreFileData.end_class_prop && moreFileData.end_class_prop.Type
                              ? 'select has-errors'
                              : 'select'
                          }
                          dropdownStyle={{ maxHeight: 170 }}
                          listHeight={165}
                          placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                          onChange={value => {
                            this.selectEnd(value);
                          }}
                          value={(moreFileData.end_class_prop && moreFileData.end_class_prop.value) || undefined}
                          title={(moreFileData.end_class_prop && moreFileData.end_class_prop.value) || undefined}
                          suffixIcon={<CaretRightOutlined className="ant-select-suffix" rotate={90} />}
                        >
                          {endNode &&
                            endNode.nodeInfo &&
                            endNode.nodeInfo.attrSelect &&
                            endNode.nodeInfo.attrSelect.map(item => {
                              return (
                                <Option key={item} title={item}>
                                  {item}
                                </Option>
                              );
                            })}
                        </Select>
                      </ConfigProvider>
                    </Input.Group>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <Modal
          className="delete-create-info-45679"
          visible={modalVisible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="clearEdgeInfo" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  });
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button
                className="add-modal-save"
                type="primary"
                key="ok"
                onClick={e => {
                  this.emptyAttr(e);
                }}
              >
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          closable={false}
        >
          <div className="title-content">
            <InfoCircleFilled className="icon" />
            <span className="title-word">{[intl.get('workflow.knowledge.emptyOper')]}</span>
          </div>
          <div className="content-word">{[intl.get('workflow.knowledge.emptyInfo')]}</div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

export default connect(mapStateToProps)(MoreFileRelation);
