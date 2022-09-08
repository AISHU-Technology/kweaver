import React, { Component } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select, ConfigProvider, Empty } from 'antd';

import servicesCreateEntity from '@/services/createEntity';

import GraphShow from '../graphShow';
import { handleUnStructDataSourceData, setSourceAndTarget, showError } from './assistFunction';

import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

class ModelImport extends Component {
  state = {
    selectType: [],
    textAreaData: [],
    selectTypeValue: '',
    graphData: {
      entity: [],
      edge: []
    }
  };

  componentDidMount() {
    this.getSelectList();
  }

  /**
   * @description 获取模型
   */
  getSelectList = async () => {
    const data = await servicesCreateEntity.fetchModelList();

    if (data && data.res) {
      const models = Object.entries(data.res);
      const initValue = models[0] ? models[0][0] : '';

      this.setState({
        selectType: models,
        selectTypeValue: initValue
      });

      await this.selectModel(initValue);
    }
  };

  /**
   * @description 选择模型
   */
  selectModel = async selectTypeValue => {
    const res = await servicesCreateEntity.getModelPreview(selectTypeValue);

    if (res && res.res && res.res.modelspo) {
      this.setState({
        textAreaData: res.res.modelspo,
        selectTypeValue
      });
    }

    this.renderGraph(selectTypeValue);
  };

  /**
   * @description 渲染知识图谱数据
   */
  renderGraph = async model => {
    const reqdata = {
      model,
      file_list: []
    };

    const res = await servicesCreateEntity.unstructuredData(reqdata);

    if (res && res.Code) {
      showError(res.Code);

      this.props.setSaveData({
        data: '',
        type: 'model'
      });

      return;
    }

    if (res && res.res && res.res.entity_list.length > 0) {
      this.renderGraphT(res, model);
    }
  };

  /**
   * @description 接口成功时执行
   */
  renderGraphT = (res, model) => {
    const resData = res.res;

    // eslint-disable-next-line prefer-const
    let { nodes, edges } = handleUnStructDataSourceData(resData, model);

    edges = setSourceAndTarget(nodes, edges);

    this.setState({
      graphData: {
        entity: nodes,
        edge: edges
      }
    });

    // 将预测数据传入父组件
    this.props.setSaveData({
      data: {
        entity: nodes,
        edge: edges
      },
      type: 'model'
    });
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', height: 80, marginBottom: 30 }}>
      <Empty image={kong} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
    </div>
  );

  render() {
    const { selectType, selectTypeValue, textAreaData, graphData } = this.state;
    const { anyDataLang } = this.props;

    return (
      <div className="model-import">
        <div className="data-type">
          {/* <div className="name">
            <label>{[intl.get('createEntity.selectModel')]}</label>
          </div> */}

          <div className="content-model-part">
            <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
              <Select
                className="data-table-disabled"
                placeholder={[intl.get('createEntity.select')]}
                getPopupContainer={triggerNode => triggerNode.parentElement}
                value={selectTypeValue}
                onSelect={value => {
                  this.selectModel(value);
                }}
              >
                {selectType.map(([key, value]) => {
                  const showValue = anyDataLang === 'en-US' ? key : value;

                  return (
                    <Option value={key} key={key}>
                      {showValue}
                    </Option>
                  );
                })}
              </Select>
            </ConfigProvider>
          </div>
        </div>

        <div className="preview">
          <div className="title-pre">
            <span className="big">{[intl.get('createEntity.preview')]}</span>
            <span className="little">{[intl.get('createEntity.modelData')]}</span>
          </div>

          <div className="content-pre">
            <div className="table">
              {textAreaData.length > 0
                ? textAreaData.map((item, index) => {
                    return (
                      <div className={index === 0 ? 'row-title' : 'row'} key={index.toString()}>
                        {index === 0 ? (
                          <>
                            <div className="title">
                              <span key={index.toString()}>{intl.get('createEntity.tableTitle1')}</span>
                            </div>
                            <div className="title">
                              <span key={index.toString()}>{intl.get('createEntity.tableTitle2')}</span>
                            </div>
                            <div className="title">
                              <span key={index.toString()}>{intl.get('createEntity.tableTitle3')}</span>
                            </div>
                          </>
                        ) : (
                          item.map((chilrdItem, chilrdIndex) => {
                            return (
                              <div className="column-un" key={chilrdIndex.toString()}>
                                <div className="name" title={chilrdItem.alias}>
                                  {chilrdItem.alias}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </div>

        <div className="graph-show">
          <GraphShow graphData={graphData} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

ModelImport.defaultProps = {
  setSaveData: () => {}
};

export default connect(mapStateToProps, null)(ModelImport);
