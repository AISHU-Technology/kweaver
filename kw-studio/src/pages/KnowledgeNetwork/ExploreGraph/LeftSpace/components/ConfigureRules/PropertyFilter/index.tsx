import React, { useMemo } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Select, Tooltip, DatePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import { ANALYSIS_PROPERTIES } from '@/enums';
import { NUMBERKEY, PROTYPE } from '../enums';
import './style.less';
import classNames from 'classnames';
import moment from 'moment';
type PropertyFilterType = {
  error?: boolean; // 规则是否有误
  propertyFilter: any; // 属性规则
  selfProperties: any; // 类的属性列表
  addOrChangeProperty: (data: any) => void; // 切换或添加属性
  onDeleteProperty: () => void; // 删除属性规则
};
const PropertyFilter = (props: PropertyFilterType) => {
  const { error, propertyFilter, selfProperties, addOrChangeProperty, onDeleteProperty } = props;
  // 过滤掉自动生产的属性
  const propertyList = useMemo(
    () => _.filter(selfProperties, p => !_.includes(ANALYSIS_PROPERTIES.defaultAtr, p.name)),
    [selfProperties]
  );

  // 返回属性的类型
  const getType = (key: string) => {
    if (_.includes(NUMBERKEY, key)) return 'number';
    return key;
  };

  // 切换时间
  const onChangeDate = (date: any, dateString: any) => {
    addOrChangeProperty({ op_value: dateString });
  };

  return (
    <div className=" graphPropertyFilterRoot">
      <div className="kw-align-center">
        {/* 属性下拉选择 */}
        <Select
          style={{ width: 168 }}
          listHeight={130}
          className={classNames({ errBor: error })}
          value={propertyFilter?.name}
          onChange={(_, { value, type }: any) =>
            addOrChangeProperty({ name: value, property_type: type, op_value: '' })
          }
          getPopupContainer={e => {
            return e.parentElement.parentElement;
          }}
        >
          {_.map(propertyList || [], (pro, i) => {
            return (
              <Select.Option key={i} value={pro?.name} type={pro?.type}>
                {pro?.alias || pro?.name}
              </Select.Option>
            );
          })}
        </Select>
        {/* 运算符 */}
        <Select
          style={{ width: 176, marginLeft: 14 }}
          listHeight={130}
          value={propertyFilter?.operation}
          onChange={e => addOrChangeProperty({ operation: e })}
          getPopupContainer={e => {
            return e.parentElement.parentElement;
          }}
        >
          {_.map(PROTYPE?.[getType(propertyFilter?.property_type)], (operation, index) => {
            return (
              <Select.Option value={operation?.value} key={index}>
                {operation.symbol || intl.get(operation?.label)}
              </Select.Option>
            );
          })}
        </Select>
        {/* 匹配值输入框 */}
        <div className="valueInputBox">
          {_.includes(['number', 'string'], getType(propertyFilter?.property_type)) && (
            <Input
              placeholder={intl.get('global.pleaseEnter')}
              style={{ width: 340 }}
              value={propertyFilter?.op_value}
              onChange={e => addOrChangeProperty({ op_value: e?.target?.value })}
            />
          )}
          {propertyFilter?.property_type === 'date' && (
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: 340 }}
              value={propertyFilter?.op_value ? moment(propertyFilter?.op_value, 'YYYY - MM - DD') : null}
              onChange={onChangeDate}
              getPopupContainer={(e: any) => {
                return e.parentElement.parentElement!;
              }}
            />
          )}
          {propertyFilter?.property_type === 'datetime' && (
            <DatePicker
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 340 }}
              value={propertyFilter?.op_value ? moment(propertyFilter?.op_value, 'YYYY-MM-DD HH:mm:ss') : null}
              showTime
              onChange={onChangeDate}
              getPopupContainer={(e: any) => {
                return e.parentElement.parentElement!;
              }}
              suffixIcon={<ClockCircleOutlined />}
            />
          )}
          {propertyFilter?.property_type === 'boolean' && (
            <Select
              style={{ width: 340 }}
              onChange={e => addOrChangeProperty({ op_value: e })}
              value={propertyFilter?.op_value || 'true'}
              getPopupContainer={e => {
                return e.parentElement.parentElement;
              }}
            >
              <Select.Option value="true">true</Select.Option>
              <Select.Option value="false">false</Select.Option>
            </Select>
          )}
        </div>
        {/* 删除按钮 */}
        <Tooltip title={intl.get('exploreGraph.clear')}>
          <IconFont type="icon-lajitong" className="kw-pointer kw-ml-3" onClick={() => onDeleteProperty()} />
        </Tooltip>
      </div>
    </div>
  );
};
export default PropertyFilter;
