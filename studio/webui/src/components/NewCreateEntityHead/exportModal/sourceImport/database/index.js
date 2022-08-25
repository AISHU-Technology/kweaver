/**
 * 数据库类导入
 *
 * @author Eden
 * @date 2021/05/13
 *
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select, ConfigProvider, Empty, message, Tree } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';
import IconFont from '@/components/IconFont';

import DataSheet from '@/assets/images/DataSheet.svg';
import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

class DataBase extends Component {
  state = {
    dataList: [],
    preSelectData: undefined,
    tableData: [],
    loading: false,
    tree: [],
    fileTypeLoading: false
  };

  componentDidMount() {
    this.getTreeData(this.props.selectedValue);

    this.props.setSaveData({
      data: undefined,
      type: 'sql'
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedValue !== this.props.selectedValue) {
      this.getTreeData(this.props.selectedValue);

      this.props.setSaveData({
        data: undefined,
        type: 'sql'
      });
    }
  }

  /**
   * @description 根据数据表获取数据
   */
  getTreeData = async data => {
    if (!data || !data.data_source) {
      return;
    }

    const resquestData = {
      ds_id: data.id,
      data_source: data.data_source
    };

    this.setState({
      fileTypeLoading: true,
      preSelectData: undefined,
      dataList: [],
      tableData: []
    });

    const resData = await servicesCreateEntity.getDataList(resquestData);

    if (resData && resData.Code) {
      this.getTreeDataF(resData);

      return;
    }

    if (resData && resData.res && resData.res.output) {
      this.getTree(resData.res.output);
    }

    this.setState({
      fileTypeLoading: false
    });
  };

  /**
   * @description 获取列表数据失败
   */
  getTreeDataF = resData => {
    this.getTree([]);

    this.setState({
      fileTypeLoading: false
    });

    if (resData && resData.Code === 500001) {
      message.error([intl.get('createEntity.fileNoexist')]);

      return;
    }

    if (resData && resData.Code === 500002) {
      message.error([intl.get('createEntity.sourceIncorrect')]);

      return;
    }

    if (resData && resData.Code === 500006) {
      message.error(intl.get('createEntity.sourceNoexist'));

      return;
    }

    if (resData && resData.Code === 500009) {
      message.error(intl.get('createEntity.fileNoExist'));

      return;
    }

    if (resData && resData.Code === 500013) {
      message.error(intl.get('createEntity.tokenError'));
    }
  };

  /**
   * @description  构建树数据
   */
  getTree = output => {
    let tree = [];
    let each = {};

    if (output && output.length > 0) {
      for (let i = 0; i < output.length; i++) {
        each = {
          title: (
            <div>
              <img src={DataSheet} alt="file" className="icon-file" />
              {output[i]}
            </div>
          ),
          key: output[i]
        };

        tree = [...tree, each];
      }
    }

    this.setState({
      tree
    });
  };

  /**
   * @description 选择文件
   * @param {Array} selectedKeys 选择的文件
   */
  onTreeCheck = selectedKeys => {
    const { preSelectData } = this.state;

    if (!selectedKeys.includes(preSelectData)) {
      this.setState({
        preSelectData: undefined,
        tableData: []
      });
    }

    this.setState({
      dataList: selectedKeys
    });

    this.props.setSaveData({
      data: selectedKeys,
      type: 'sql',
      selectedValue: this.props.selectedValue
    });
  };

  /**
   *@description 选择预览数据
   *@param {string} value 需要预览的值
   */
  onSelect = async value => {
    const { selectedValue } = this.props;

    this.setState({
      preSelectData: value
    });

    const data = {
      id: selectedValue.id,
      data_source: selectedValue.data_source,
      name: value
    };

    // 加载开始
    this.setState({
      loading: true
    });

    const resData = await servicesCreateEntity.getOtherPreData(data);

    // 加载结束
    this.setState({
      loading: false
    });

    if (resData && resData.Code) {
      this.onSelectF(resData);

      return;
    }

    if (resData && resData.res && !this.state.fileTypeLoading) {
      this.setState({
        tableData: resData.res
      });
    }

    if (this.state.fileTypeLoading) {
      this.setState({
        preSelectData: undefined
      });
    }
  };

  /**
   * @description 预览失败
   */
  onSelectF = resData => {
    if (resData && resData.Code === 500001) {
      message.error([intl.get('createEntity.fileNoexist')]);

      return;
    }

    if (resData && resData.Code === 500002) {
      message.error([intl.get('createEntity.sourceIncorrect')]);

      return;
    }

    if (resData && resData.Code === 500006) {
      message.error(intl.get('createEntity.sourceNoexist'));

      return;
    }

    if (resData && resData.Code === 500009) {
      message.error(intl.get('createEntity.fileNoExist'));

      return;
    }

    if (resData && resData.Code === 500013) {
      message.error(intl.get('createEntity.tokenError'));
    }
  };

  /**
   * @description 数据类型国际化
   * @param {string} data 数据类型的值
   */
  showDataType = data => {
    const { anyDataLang } = this.props;

    if (anyDataLang && anyDataLang === 'zh-CN') {
      if (data === 'structured') {
        return '结构化';
      }

      if (data === 'unstructured') {
        return '非结构化';
      }
    }

    return data;
  };

  /**
   * @description 显示转化
   */
  dataSourceShow = text => {
    if (text === 'as') {
      return 'AnyShare';
    }

    if (text === 'mysql') {
      return 'MySQL';
    }

    if (text === 'hive') {
      return 'Hive';
    }
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => {
    return (
      <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
        <Empty image={kong} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
      </div>
    );
  };

  render() {
    const { selectedValue, anyDataLang } = this.props;
    const { dataList, preSelectData, tableData, loading, tree, fileTypeLoading } = this.state;

    return (
      <div className="data-base">
        <div className="basic-info">
          <div className="head">{[intl.get('createEntity.basicInfo')]}</div>

          <div className="info">
            <div className="line">
              <label className="start">{[intl.get('createEntity.dataType')]}</label>：
              <span className="tent" title={this.showDataType(selectedValue.dataType)}>
                {this.showDataType(selectedValue.dataType)}
              </span>
            </div>
            <div className="line">
              <label className="start">{[intl.get('createEntity.dataSource')]}</label>：
              <span className="tent" title={this.dataSourceShow(selectedValue.data_source)}>
                {this.dataSourceShow(selectedValue.data_source)}
              </span>
            </div>
            <div className="line">
              <label className="start">{[intl.get('createEntity.exMethod')]}</label>：
              <span
                className="tent"
                title={
                  selectedValue.extract_type === 'labelExtraction'
                    ? [intl.get('datamanagement.labelExtraction')]
                    : [intl.get('datamanagement.standardExtraction')]
                }
              >
                {selectedValue.extract_type === 'labelExtraction'
                  ? [intl.get('datamanagement.labelExtraction')]
                  : [intl.get('datamanagement.standardExtraction')]}
              </span>
            </div>
            <div className="line">
              <label className="start">
                {anyDataLang === 'zh-CN' ? (
                  <>
                    <span>路</span>
                    <span className="line-right">径</span>
                  </>
                ) : (
                  [intl.get('createEntity.path')]
                )}
              </label>
              ：
              <span className="tent" title={this.showDataType(selectedValue.ds_path)}>
                {this.showDataType(selectedValue.ds_path)}
              </span>
            </div>
          </div>
        </div>

        <div className="tip">
          <ExclamationCircleOutlined className="icon" />
          <span>{[intl.get('createEntity.fileTip')]}</span>
        </div>

        {/* 选择数据表 */}
        <div className="select-area">
          <div className="tree-select-name">
            <div className="title-name">
              <label>{[intl.get('createEntity.tables')]}</label>
            </div>

            <div className="icon-box">
              <IconFont
                type="icon-tongyishuaxin"
                className="icon"
                onClick={() => {
                  this.getTreeData(selectedValue);
                }}
              />
            </div>
          </div>

          <div className="tree-select-area">
            {fileTypeLoading ? (
              <div className="loading">
                <LoadingOutlined className="icon" />
              </div>
            ) : tree.length > 0 ? (
              <Tree checkable treeData={tree} onCheck={this.onTreeCheck} checkedKeys={dataList} selectable={false} />
            ) : (
              <Empty
                image={kong}
                description={[intl.get('createEntity.noData')]}
                style={{ marginTop: 20, fontSize: 14, color: 'rgba(204,204,204,1)' }}
              />
            )}
          </div>
        </div>

        {/* 预览 */}
        <div className="preview">
          <div className="content-pre">
            {loading ? (
              <div className="loading">
                <LoadingOutlined className="icon" />
              </div>
            ) : null}

            <div className="title-pre ">
              <span className="big">{[intl.get('createEntity.preview')]}</span>
              <span className="little">{[intl.get('createEntity.previewSome')]}</span>
            </div>

            <div className="select">
              <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                <Select
                  className="select-box"
                  value={preSelectData}
                  placeholder={[intl.get('createEntity.select')]}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  onSelect={value => {
                    this.onSelect(value);
                  }}
                >
                  {dataList && dataList.length > 0
                    ? dataList.map((item, index) => {
                        return (
                          <Option key={index.toString()} value={item}>
                            <img src={DataSheet} alt="file" className="icon-file" />
                            {item}
                          </Option>
                        );
                      })
                    : null}
                </Select>
              </ConfigProvider>
            </div>

            <div className="table">
              {tableData && tableData.length > 0
                ? tableData.map((item, index) => {
                    return (
                      <div className="row" key={index.toString()}>
                        {item.map((chilrdItem, chilrdIndex) => {
                          return (
                            <div key={chilrdIndex.toString()} className={index === 0 ? 'column title' : 'column'}>
                              <span title={chilrdItem.toString()}>{chilrdItem.toString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

DataBase.defaultProps = {
  selectedValue: { dataType: '', extract_type: '' },
  setSaveData: () => {}
};

export default connect(mapStateToProps)(DataBase);
