/**
 * @description 本体导入
 * @author Eden
 * @date 2021/05/11
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Select, ConfigProvider, Empty, message } from 'antd';

import servicesCreateEntity from '@/services/createEntity';

import GraphShow from '../graphShow';

import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

class EntityImport extends Component {
  state = {
    selectData: [],
    graphData: '',
    selectValue: undefined
  };

  componentDidMount() {
    this.getSelectData();
  }

  /**
   * @description  获取下拉数据
   */
  getSelectData = async () => {
    this.props.openLoading();

    const data = await servicesCreateEntity.getAllNoumenon();

    if (data && data.res && data.res.df) {
      this.setState({
        selectData: data.res.df
      });
    }

    // 初始化数据
    this.props.setSaveData({
      data: undefined,
      type: 'entity'
    });

    this.props.closedLoading();
  };

  /**
   * @description 选择本体名称
   * @param {string} value
   */
  onChange = async value => {
    let data = '';

    const resData = await servicesCreateEntity.getAllNoumenonData(value);

    if (resData && resData.res && resData.res.df) {
      data = resData.res.df[0];
      data.inPutType = 'entity';
    }

    this.setState({
      graphData: data,
      selectValue: value
    });

    if (resData && resData.Code === 500403) {
      message.error(intl.get('graphList.authErr'));
    }

    // 将预测出点数据传回父组件
    this.props.setSaveData({
      data,
      type: 'entity'
    });
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={[intl.get('createEntity.noData')]} />
    </div>
  );

  render() {
    const { selectData, selectValue, graphData } = this.state;
    const { saveData } = this.props;

    return (
      <div className="entity-import">
        {/* <div className="title-ontolog-name">
          <label className="name">{[intl.get('createEntity.ontologyName')]}</label>
        </div> */}
        <div className={saveData && saveData.data === '' ? 'select-false' : 'select-true'}>
          <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
            <Select
              className="entity-select"
              placeholder={[intl.get('createEntity.inputOrSelect')]}
              showSearch
              allowClear
              getPopupContainer={triggerNode => triggerNode.parentElement}
              value={selectValue}
              onChange={this.onChange}
            >
              {selectData.map((item, index) => {
                return (
                  <Option value={item.ontology_name} key={index.toString()} data={item}>
                    {item.ontology_name}
                  </Option>
                );
              })}
            </Select>
          </ConfigProvider>
        </div>

        <div className="preview">
          <div className="content">
            <GraphShow graphData={graphData} />
          </div>
        </div>
      </div>
    );
  }
}

export default EntityImport;
