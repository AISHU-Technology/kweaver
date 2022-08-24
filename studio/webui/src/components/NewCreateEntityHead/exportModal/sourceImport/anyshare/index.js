/* eslint-disable max-lines */
/* eslint-disable */
/**
 * anyshare类导入
 *
 * @author Eden
 * @date 2021/05/13
 *
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select, Input, TreeSelect, ConfigProvider, Empty, message } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';

import kong from '@/assets/images/kong.svg';
import csvImage from '@/assets/images/csv.svg';
import jsonImage from '@/assets/images/json.svg';
import folderImage from '@/assets/images/Folder-blue.svg';

import './style.less';

const { Option } = Select;

const { SHOW_PARENT } = TreeSelect;

const { TextArea } = Input;

let treeKey = 0;
let treeKeyPre = 0;

class AnyShare extends Component {
  state = {
    postfix:
      this.props.selectedValue && this.props.selectedValue.extract_type === 'standardExtraction' ? 'csv' : 'json',
    fileNameTreeData: [], // 渲染的文件树
    saveData: [], // 预览的文件树
    selectedNameTreeData: [],
    selectedPreTreeData: undefined,
    textAreaData: {
      viewtype: 'non-json',
      data: []
    },
    selectType: [],
    selectTypeValue: undefined,
    loading: false,
    fileTypeLoading: false
  };

  componentDidMount() {
    this.getTreeData(this.props.selectedValue);

    this.props.setSaveData({
      data: undefined,
      type: 'as'
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedValue !== this.props.selectedValue) {
      this.setState(
        {
          selectedNameTreeData: [],
          selectedPreTreeData: undefined,
          textAreaData: {
            viewtype: 'non-json',
            data: []
          },
          postfix: this.props.selectedValue.extract_type === 'standardExtraction' ? 'csv' : 'json'
        },
        () => {
          this.getTreeData(this.props.selectedValue);
        }
      );

      this.props.setSaveData({
        data: undefined,
        type: 'as'
      });
    }
  }

  /**
   * @description 获取数据源文件数据
   */
  getTreeData = async data => {
    const { postfix } = this.state;

    const resquestData = {
      ds_id: data.id,
      data_source: data.data_source,
      postfix
    };

    treeKey++;

    this.setState({
      fileTypeLoading: true
    });

    const resData = await servicesCreateEntity.getDataList(resquestData);

    if (resData && resData.Code) {
      this.getTreeDataF(resData);

      return;
    }

    if (resData && resData.res && resData.res.output) {
      const { output } = resData.res;

      const fileNameTreeData = this.createTree(0, output, 'treeName');

      this.setState({
        fileNameTreeData
      });
    }

    this.setState({
      fileTypeLoading: false
    });
  };

  /**
   * @description 获取失败
   */
  getTreeDataF = resData => {
    const fileNameTreeData = this.createTree(0, [], 'treeName');

    this.setState({
      fileTypeLoading: false,
      fileNameTreeData
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
   * @description 创建文件树
   */
  createTree = (parentId, data, typeSelect, pAddress) => {
    let tree = [];
    let eachData = {};
    const { extract_type } = this.props.selectedValue;
    const { postfix } = this.state;

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        eachData = {
          title: (
            <div className="anyshare-filetree-row">
              <div className="anyshare-filetree-type">
                <img
                  className="file-image"
                  src={data[i].type === 'dir' ? folderImage : postfix === 'csv' ? csvImage : jsonImage}
                  alt="file"
                />
              </div>

              <div className="file-name">
                <span>{data[i].name}</span>
              </div>
            </div>
          ),
          name: data[i].name,
          type: data[i].type,
          value: typeSelect === 'pre' ? JSON.stringify(data[i]) : JSON.stringify([data[i], parentId]),
          isLeaf: data[i].type === 'file',
          pId: parentId,
          selectable: typeSelect !== 'pre' || data[i].type === 'file',
          disableCheckbox: extract_type === 'labelExtraction' && data[i].type !== 'file'
        };

        if (typeSelect === undefined || typeSelect === 'treeName') {
          eachData.address = `${data[i].name}`;
        } else {
          eachData.address = `${pAddress}/${data[i].name}`;
        }

        if (typeSelect !== 'pre') {
          eachData.value = JSON.stringify([...JSON.parse(eachData.value), eachData.address]);
        }

        eachData.id = eachData.value;

        tree = [...tree, eachData];
      }
    }

    return tree;
  };

  /**
   * @description 展开树
   * @param {object}  treeNode 选择的父节点
   */
  onLoadData = treeNode => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const { value, address } = treeNode;
      const { selectedValue } = this.props;
      const { postfix } = this.state;
      const docid = JSON.parse(value)[0].docid;
      let { fileNameTreeData } = this.state;

      const data = {
        docid,
        ds_id: selectedValue.id,
        postfix
      };

      const resData = await servicesCreateEntity.getChildrenFile(data);

      if (resData && resData.Code === 500013) {
        message.error(intl.get('createEntity.tokenError'));
      }

      if (resData && resData.res && resData.res.output) {
        fileNameTreeData = [...fileNameTreeData, ...this.createTree(value, resData.res.output, 'open', address)];
      }

      this.setState({
        fileNameTreeData
      });

      resolve();
    });
  };

  /**
   * @description 展开预览树
   * @param {object}  treeNode 选择的父节点
   */
  onLoadPreData = treeNode => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const { value } = treeNode;
      const { selectedValue } = this.props;
      let { saveData } = this.state;
      const { postfix } = this.state;

      const data = {
        docid: JSON.parse(value).docid,
        ds_id: selectedValue.id,
        postfix
      };

      const resData = await servicesCreateEntity.getChildrenFile(data);

      if (resData && resData.Code === 500013) {
        message.error(intl.get('createEntity.tokenError'));
      }

      if (resData && resData.res && resData.res.output) {
        saveData = [...saveData, ...this.createTree(value, resData.res.output, 'pre')];
      }

      this.setState({
        saveData
      });

      resolve();
    });
  };

  /**
   * @description 选择文件时调用
   * @param {Array} value
   */
  onChange = value => {
    let copyValue = value;

    copyValue = copyValue.map(item => {
      return JSON.parse(item);
    });

    const { selectedPreTreeData, postfix } = this.state;

    const { selectedValue } = this.props;

    let docId = [];

    selectedValue.postfix = postfix;

    treeKeyPre++;

    if (selectedValue.dataType === 'unstructured') {
      if (!selectedPreTreeData) {
        this.setState({
          selectedPreTreeData: undefined
        });
      } else {
        for (let i = 0; i < copyValue.length; i++) {
          docId = [...docId, copyValue[i][0].docid];
        }

        if (!docId.includes(selectedPreTreeData)) {
          this.setState({
            selectedPreTreeData: undefined
          });
        }
      }
    } else if (!selectedPreTreeData) {
      this.setState({
        selectedPreTreeData: undefined,
        textAreaData: {
          viewtype: 'non-json',
          data: []
        }
      });
    } else {
      for (let i = 0; i < copyValue.length; i++) {
        docId = [...docId, copyValue[i][0].docid];
      }

      if (!docId.includes(selectedPreTreeData)) {
        this.setState({
          selectedPreTreeData: undefined,
          textAreaData: {
            viewtype: 'non-json',
            data: []
          }
        });
      }
    }

    let list = [];

    if (copyValue && copyValue.length > 0) {
      for (let i = 0; i < copyValue.length; i++) {
        const { docid, type, name } = copyValue[i][0];

        list = [...list, { docid, type, name }];
        // if (selectedValue.extract_type === 'standardExtraction') {
        //   list = [...list, { docid, type, name }];

        //   // eslint-disable-next-line no-continue
        //   continue;
        // }

        // list = [...list, [docid, copyValue[i][2], name]];
      }
    }

    // 标注抽取
    if (selectedValue.extract_type === 'labelExtraction') {
      copyValue = [copyValue[copyValue.length - 1]];
    }

    this.setState({
      saveData: this.setPreSelect(copyValue),
      selectedNameTreeData: copyValue.map(item => {
        return JSON.stringify(item);
      })
    });

    this.props.setSaveData({
      data: copyValue,
      type: 'as',
      selectedValue: this.props.selectedValue
    });
  };

  /**
   * @description 选择预览数据
   * @param {string} value
   */
  preDataSelected = value => {
    this.getPreData(JSON.parse(value).docid);

    this.setState({
      selectedPreTreeData: value
    });
  };

  /**
   * @description 获取预览数据
   * @param {object} value 选择预览的数据
   */
  getPreData = async value => {
    const { selectedValue } = this.props;

    const data = {
      id: selectedValue.id,
      data_source: selectedValue.data_source,
      name: value
    };

    // 加载开始
    this.setState({
      loading: true
    });

    const res = await servicesCreateEntity.getOtherPreData(data);

    // 加载结束
    this.setState({
      loading: false
    });

    if (res && res.Code) {
      this.getPreDataF(res);

      return;
    }

    if (res && res.data) {
      this.setState({
        textAreaData: res
      });
    }
  };

  /**
   * @description 获取预览数据失败
   */
  getPreDataF = res => {
    if (res && res.Code === 500001) {
      message.error([intl.get('createEntity.fileNoexist')]);

      return;
    }

    if (res && res.Code === 500002) {
      message.error([intl.get('createEntity.sourceIncorrect')]);

      return;
    }

    if (res && res.Code === 500006) {
      message.error(intl.get('createEntity.sourceNoexist'));

      return;
    }

    if (res && res.Code === 500009) {
      message.error(intl.get('createEntity.fileNoExist'));

      return;
    }

    if (res && res.Code === 500013) {
      message.error(intl.get('createEntity.tokenError'));
    }
  };

  /**
   * @description 设置预览点下拉栏
   */
  setPreSelect = data => {
    let tree = [];
    let eachData = {};
    const { postfix } = this.state;

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        eachData = {
          title: (
            <div className="anyshare-filetree-row">
              <div className="anyshare-filetree-type">
                <img
                  className="file-image"
                  src={data[i][0] && data[i][0].type === 'dir' ? folderImage : postfix === 'csv' ? csvImage : jsonImage}
                  alt="file"
                />
              </div>

              <div className="file-name">
                <span>{data[i][0] && data[i][0].name}</span>
              </div>
            </div>
          ),
          name: data[i][0] && data[i][0].name,
          value: JSON.stringify(data[i][0]),
          id: JSON.stringify(data[i][0]),
          isLeaf: data[i][0] && data[i][0].type === 'file',
          pId: data[i][1],
          selectable: data[i][0] && data[i][0].type === 'file',
          type: data[i][0] && data[i][0].type
        };

        tree = [...tree, eachData];
      }
    }

    return tree;
  };

  /**
   * @description 改变文件类型
   */
  changeFileType = async postfix => {
    this.setState(
      {
        postfix,
        selectedNameTreeData: [],
        selectedPreTreeData: undefined,
        textAreaData: {
          viewtype: 'non-json',
          data: []
        }
      },
      () => {
        this.getTreeData(this.props.selectedValue);
      }
    );
  };

  /**
   * @description 显示转化
   */
  dataSourceShow = text => {
    if (text === 'as') {
      return 'AnyShare';
    }

    if (text === 'as7') {
      return 'AnyShare7';
    }

    if (text === 'mysql') {
      return 'MySQL';
    }

    if (text === 'hive') {
      return 'Hive';
    }
  };

  /**
   * @description 数据类型国际化
   * @param {string} data 数据类型的值
   */
  showDataType = data => {
    const { anyDataLang } = this.props;

    if (anyDataLang === 'zh-CN') {
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
   *
   * @param {string} value 模型国际化
   */
  showModelType = value => {
    if (value === 'Generalmodel') {
      return [intl.get('createEntity.Gmodel')];
    }

    if (value === 'AImodel') {
      return [intl.get('createEntity.AImodel')];
    }

    return value;
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => {
    const { fileTypeLoading } = this.state;

    if (fileTypeLoading) {
      return (
        <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
          <div className="tree-loading-data">
            <LoadingOutlined className="icon" />
          </div>
        </div>
      );
    }

    return (
      <div style={{ fontSize: 14, color: 'rgba(204,204,204,1)', textAlign: 'center', height: 80, marginTop: '6%' }}>
        <Empty image={kong} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
      </div>
    );
  };

  render() {
    const { selectedValue, anyDataLang } = this.props;
    const {
      fileNameTreeData,
      postfix,
      saveData,
      selectedNameTreeData,
      selectedPreTreeData,
      textAreaData,
      loading,
      fileTypeLoading
    } = this.state;

    return (
      <div className="anyshare">
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

        <div className="flex-type">
          <div className="file-type-name">
            <div className="name">
              <label>{[intl.get('createEntity.tables')]}</label>
            </div>

            <div className="icon-box">
              <IconFont
                type="icon-tongyishuaxin"
                className="icon"
                onClick={() => {
                  this.setState(
                    {
                      postfix,
                      selectedNameTreeData: [],
                      selectedPreTreeData: undefined,
                      textAreaData: {
                        viewtype: 'non-json',
                        data: []
                      }
                    },
                    () => {
                      this.getTreeData(selectedValue);
                    }
                  );
                }}
              />
            </div>

            <div className="content">
              <Select
                className="data-table file-type z-top"
                disabled={selectedValue.extract_type === 'labelExtraction'}
                value={postfix}
                onSelect={this.changeFileType}
                getPopupContainer={triggerNode => triggerNode.parentElement}
              >
                <Option value="csv">csv</Option>
                <Option value="json">json</Option>
              </Select>
            </div>
          </div>

          <div className="data-type select-tree-box">
            <div className={selectedValue.dataType === 'structured' ? 'content' : 'content un'}>
              <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                <TreeSelect
                  key={treeKey}
                  className={
                    selectedValue.extract_type === 'labelExtraction' ? 'data-table file no-checkBox' : 'data-table file'
                  }
                  treeDataSimpleMode
                  treeData={fileTypeLoading ? [] : fileNameTreeData}
                  showSearch={false}
                  treeCheckable={true}
                  open={true}
                  showCheckedStrategy={SHOW_PARENT}
                  placeholder={[intl.get('createEntity.select')]}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  value={selectedNameTreeData}
                  loadData={this.onLoadData}
                  onChange={this.onChange}
                  maxTagCount={2}
                  virtual={false}
                  listHeight={32 * 6}
                />
              </ConfigProvider>
            </div>
          </div>
        </div>

        <div className="preview">
          <div className="content-pre">
            {loading ? (
              <div className="loading">
                <LoadingOutlined className="icon" />
              </div>
            ) : null}

            <div className="title-pre">
              <span className="big">{[intl.get('createEntity.preview')]}</span>
              {selectedValue.dataType === 'unstructured' ? (
                <span className="little">{[intl.get('createEntity.modelData')]}</span>
              ) : (
                <span className="little">{[intl.get('createEntity.previewSome')]}</span>
              )}
            </div>

            <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
              <TreeSelect
                key={treeKeyPre}
                treeDataSimpleMode
                className="select-file"
                treeData={saveData}
                placeholder={[intl.get('createEntity.select')]}
                showCheckedStrategy={SHOW_PARENT}
                getPopupContainer={triggerNode => triggerNode.parentElement}
                loadData={this.onLoadPreData}
                onSelect={this.preDataSelected}
                value={selectedPreTreeData}
                title={selectedPreTreeData ? JSON.parse(selectedPreTreeData).name : ''}
              />
            </ConfigProvider>

            {textAreaData.viewtype === 'non-json' ? (
              <div className="table">
                {textAreaData.data && textAreaData.data.length > 0
                  ? textAreaData.data.map((item, index) => {
                      return (
                        <div className="row" key={index.toString()}>
                          {item.map((chilrdItem, chilrdIndex) => {
                            return (
                              <div className={index === 0 ? 'column title' : 'column'} key={chilrdIndex.toString()}>
                                <span key={chilrdIndex.toString()} title={chilrdItem.toString()}>
                                  {chilrdItem.toString().length > 10
                                    ? `${chilrdItem.toString().substring(0, 9)}...`
                                    : chilrdItem.toString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  : null}
              </div>
            ) : (
              <TextArea className="text-area" value={textAreaData.data} autoSize={true} disabled={true} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

AnyShare.defaultProps = {
  selectedValue: { dataType: '', extract_type: '' },
  setSaveData: () => {}
};

export default connect(mapStateToProps)(AnyShare);
