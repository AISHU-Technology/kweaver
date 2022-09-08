import React, { memo, useState, Fragment, useEffect } from 'react';
import { Modal, Button, Select, Input, DatePicker, Empty, InputNumber } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import intl from 'react-intl-universal';
import servicesSearchConfig from '@/services/searchConfig';
import IconFont from '@/components/IconFont';
import { showRangeType, verifyData, getDefaultRange } from './assistFunction';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;
const { RangePicker } = DatePicker;
// TODO 后端改成小写了？？？
const STRING = 'STRING';
const STRING0 = 'string';
const INT = 'INTEGER';
const INT0 = 'integer';
const BOOL = 'BOOLEAN';
const BOOL0 = 'bool';
const DOUBLE = 'DOUBLE';
const DOUBLE0 = 'double';
const FLOAT = 'FLOAT';
const FLOAT0 = 'float';
const DECIMAL = 'DECIMAL';
const DECIMAL0 = 'decimal';
const DATETIME = 'DATETIME';
const DATETIME0 = 'datetime';
const DATE = 'DATE';
const DATE0 = 'date';
const ERR_ADD = '请先添加';
const ERR_NULL = '不能为空';
const iconMap = proType => {
  switch (true) {
    case [STRING, STRING0].includes(proType):
      return 'icon-string';
    case [DATE, DATE0, DATETIME, DATETIME0].includes(proType):
      return 'icon-datetime-date';
    case [BOOL, BOOL0].includes(proType):
      return 'icon-boolen';
    case [FLOAT, FLOAT0, DOUBLE, DOUBLE0, DECIMAL, DECIMAL0].includes(proType):
      return 'icon-float-double-decimal';
    case [INT, INT0].includes(proType):
      return 'icon-int';
    default:
      return 'icon-string';
  }
};

const ModalContent = props => {
  const { graphId, selectClass, onOk, setVisible } = props;
  const [conditions, setConditions] = useState([{}]); // 所有条件 { pro, type, rangeType, value }
  const [proList, setProList] = useState([]); // 所有属性列表
  const [loading, setLoading] = useState(false); // 获取属性列表loading

  useEffect(() => {
    if (!graphId || !selectClass.class) return;

    getAllPro(graphId, selectClass.class);
  }, [graphId, selectClass]);

  /**
   * 获取所有属性列表
   * @param {Number} id 图谱id
   * @param {String} cName 类名
   */
  const getAllPro = async (id, cName) => {
    setLoading(true);

    const { res } = (await servicesSearchConfig.entityPropertiesGet({ id: parseInt(id), class: cName })) || {};

    setLoading(false);
    res && setProList(res);
  };

  /**
   * 添加条件
   */
  const onAdd = () => {
    const [hasErr, newData] = verifyData(conditions, ERR_ADD);

    if (hasErr) {
      setConditions(newData);

      return;
    }

    setConditions(pre => [{}, ...pre]);
  };

  /**
   * 属性变更
   * @param {Object} item 属性
   * @param {Number} index 索引
   */
  const onProChange = (item, index) => {
    const copyData = [...conditions];
    const { p_name, p_type } = item;

    copyData[index].pro = p_name;
    copyData[index].type = p_type;
    copyData[index].rangeType = getDefaultRange(p_type);
    copyData[index].isErr = false;
    copyData[index].value = [BOOL, BOOL0].includes(p_type) ? ['True'] : [];

    setConditions(copyData);
  };

  /**
   * 筛选范围变更
   * @param {String} value 筛选范围
   * @param {Number} index 索引
   */
  const onRangeChange = (value, index) => {
    const copyData = [...conditions];

    copyData[index].rangeType = value;
    setConditions(copyData);
  };

  /**
   * 条件值变更
   * @param {Any} value 条件值
   * @param {Number} index 索引
   */
  const onValueChange = (value, index) => {
    const copyData = [...conditions];

    copyData[index].value = value;
    copyData[index].isErr = false;
    setConditions(copyData);
  };

  /**
   * 数字输入框变化
   * @param {String} type int、double、float、decimal
   * @param {Number} index 索引
   * @param {String} value 输入值
   * @param {String} flag 标记 start起始值 end结束值
   */
  const onNumChange = (type, index, value, flag) => {
    let curValue = [];
    const copyData = [...conditions];

    if (!flag) {
      curValue = [value];
    }

    if (flag === 'start') {
      curValue = [value, copyData[index].value[1]];
    }

    if (flag === 'end') {
      curValue = [copyData[index].value[0], value];
    }

    copyData[index].value = curValue;
    curValue.every(Boolean) && (copyData[index].isErr = false);
    setConditions(copyData);
  };

  /**
   * 时间变化
   * @param {Array | String} date 时间 YYYY-MM-DD HH:mm:ss
   * @param {Number} index 索引
   */
  const onDateChange = (date, index) => {
    const copyData = [...conditions];

    copyData[index].value = typeof date === 'string' ? [date] : date;
    copyData[index].isErr = false;
    setConditions(copyData);
  };

  /**
   * 删除条件
   * @param {Number} index 删除的索引, -1表示删除所有
   */
  const onDelete = index => {
    if (index === -1) {
      setConditions([{}]);

      return;
    }

    const newData = [...conditions];

    newData.splice(index, 1);
    setConditions(newData.length ? newData : [{}]);
  };

  /**
   * 点击开始筛选
   */
  const onFilter = () => {
    const [hasErr, newData] = verifyData(conditions, ERR_NULL);

    if (hasErr) {
      setConditions(newData);

      return;
    }

    onOk(conditions);
    setVisible(false);
  };

  /**
   * 渲染属性下拉选项, 带图标
   * @param {Object} item 属性
   */
  const renderOption = ({ p_name, p_type }) => (
    <span className="pro-option">
      <IconFont className={`pro-icon ${p_type}`} type={iconMap(p_type)} />
      {p_name}
    </span>
  );

  /**
   * 渲染筛选条件
   * @param {Object} item 筛选条件
   * @param {Number} index 索引
   */
  const renderRow = (item, index) => {
    const { pro, type, rangeType, value, isErr } = item;

    return (
      <Fragment key={`${index}`}>
        <div className="row">
          {/* 属性选择 */}
          <div className={`pro-select ${!pro && isErr && 'has-err'}`}>
            <Select
              placeholder={intl.get('search.placeInput')}
              showSearch
              value={pro}
              onChange={(_, option) => onProChange(option.data, index)}
              getPopupContainer={triggerNode => triggerNode.parentElement}
              notFoundContent={
                <Empty
                  image={loading ? <LoadingOutlined className="loading-icon" /> : kongImg}
                  description={loading ? false : intl.get('searchConfig.nodata')}
                />
              }
            >
              {proList.map(item => (
                <Option key={item.p_name} value={item.p_name} data={item} label={item.p_name}>
                  {renderOption(item)}
                </Option>
              ))}
            </Select>
          </div>

          {rangeType && (
            <>
              {/* 范围选择 */}
              <div className="range-select">
                {[STRING, STRING0, BOOL, BOOL0].includes(type) ? (
                  <Input readOnly value={showRangeType('=')} />
                ) : (
                  <Select
                    value={rangeType}
                    onChange={v => onRangeChange(v, index)}
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                  >
                    <Option value={'<'}>{showRangeType('<')}</Option>
                    <Option value={'~'}>{showRangeType('~')}</Option>
                    <Option value={'>'}>{showRangeType('>')}</Option>
                    <Option value={'='}>{showRangeType('=')}</Option>
                  </Select>
                )}
              </div>

              {/* 输入 */}
              <div className="input-value-box">
                {/* string */}
                {[STRING, STRING0].includes(type) && (
                  <Input
                    className={`${!value[0] && isErr && 'has-err'}`}
                    value={value[0]}
                    onChange={e => onValueChange([e.target.value], index)}
                  />
                )}

                {/* 数字 */}
                {[INT, INT0, DOUBLE, DOUBLE0, FLOAT, FLOAT0, DECIMAL, DECIMAL0].includes(type) && (
                  <>
                    {rangeType === '~' ? (
                      <>
                        <InputNumber
                          className={`half-width ${!value[0] && isErr && 'has-err'}`}
                          controls={false}
                          value={value[0]}
                          precision={[INT, INT0].includes(type) ? 0 : undefined} // int整数
                          stringMode={![INT, INT0].includes(type)} // double小数点高精度
                          onChange={value => onNumChange(type, index, value, 'start')}
                        />

                        <span className="range-line"></span>

                        <InputNumber
                          className={`half-width ${!value[1] && isErr && 'has-err'}`}
                          controls={false}
                          value={value[1]}
                          precision={[INT, INT0].includes(type) ? 0 : undefined} // int整数
                          stringMode={![INT, INT0].includes(type)} // double小数点高精度
                          onChange={value => onNumChange(type, index, value, 'end')}
                        />
                      </>
                    ) : (
                      <InputNumber
                        className={`${!value[0] && isErr && 'has-err'}`}
                        controls={false}
                        value={value[0]}
                        precision={[INT, INT0].includes(type) ? 0 : undefined} // int整数
                        stringMode={![INT, INT0].includes(type)} // double小数点高精度
                        onChange={value => onNumChange(type, index, value)}
                      />
                    )}
                  </>
                )}

                {/* Boolean */}
                {[BOOL, BOOL0].includes(type) && (
                  <Select
                    value={value[0]}
                    onChange={value => onValueChange([value], index)}
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                  >
                    <Option value={'True'}>True</Option>
                    <Option value={'False'}>False</Option>
                  </Select>
                )}

                {/* 时间 */}
                {[DATETIME, DATETIME0, DATE, DATE0].includes(type) && (
                  <>
                    {rangeType === '~' ? (
                      <RangePicker
                        className={`${(!value.length || !value.every(Boolean)) && isErr && 'has-err'}`}
                        suffixIcon={<IconFont type="icon-datetime-date" />}
                        showTime={[DATETIME, DATETIME0].includes(type)}
                        value={value.map(v => (v ? moment(v) : ''))}
                        separator={intl.get('search.to')}
                        onChange={(_, date) => onDateChange(date, index)}
                      />
                    ) : (
                      <DatePicker
                        className={`${!value[0] && isErr && 'has-err'}`}
                        suffixIcon={<IconFont type="icon-datetime-date" />}
                        showTime={[DATETIME, DATETIME0].includes(type)}
                        value={value[0] ? moment(value[0]) : ''}
                        onChange={(_, date) => onDateChange(date, index)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* 删除 */}
              <div className="del-btn" onClick={() => onDelete(index)}>
                <IconFont type="icon-lajitong" />
              </div>
            </>
          )}
        </div>
        <p className="err-msg">
          {isErr ? (isErr === ERR_ADD ? intl.get('search.addErr') : intl.get('search.emptyErr')) : ''}
        </p>
      </Fragment>
    );
  };

  return (
    <div className="m-content">
      <h2>{intl.get('search.filterCondition')}</h2>

      <div className="m-center">
        <div className="add-more" onClick={onAdd}>
          <IconFont type="icon-Add" />
          <span>{intl.get('search.addCondition')}</span>
        </div>

        <div className="scroll-wrapper">
          <div className="form-box">{conditions.map(renderRow)}</div>
        </div>
      </div>

      <div className="footer">
        <Button className="ant-btn-default" onClick={() => onDelete(-1)}>
          {intl.get('search.deleteAll')}
        </Button>
        <Button type="primary" onClick={onFilter}>
          {intl.get('search.startFilter')}
        </Button>
      </div>
    </div>
  );
};

const FilterModal = props => {
  const { visible, setVisible } = props;

  return (
    <Modal
      className="normal-search-filter-modal"
      visible={visible}
      width={800}
      destroyOnClose
      footer={null}
      focusTriggerAfterClose={false}
      maskClosable={false}
      onCancel={() => setVisible(false)}
    >
      <ModalContent {...props} />
    </Modal>
  );
};

FilterModal.defaultProps = {
  visible: false,
  graphId: 0,
  selectClass: {},
  setVisible: () => {},
  onOk: () => {}
};

export default memo(FilterModal);
