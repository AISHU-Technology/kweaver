import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Select, Tooltip, DatePicker, Row, Col, InputNumber } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import IconFont from '@/components/IconFont';
import NumberInput from '@/components/NumberInput';
import HOOKS from '@/hooks';
import { ANALYSIS_PROPERTIES, ONLY_KEYBOARD } from '@/enums';
import {
  NUMBERKEY,
  PROTYPE,
  VARIABLE,
  TIME_VARIABLE,
  PARAM_TYPE,
  TIME_TYPE,
  defaultParam_custom,
  defaultSysTime
} from '../enums';

import './style.less';

const { Option } = Select;
type PropertyFilterType = {
  saveParamNames: any;
  existError: any;
  error?: boolean; // 规则是否有误
  checkParam?: boolean; // 触发校验
  propertyFilter: any; // 属性规则
  selfProperties: any; // 类的属性列表
  divider: { height: number };
  setExistError: (data: any) => void;
  addOrChangeProperty: (data: any) => void; // 切换或添加属性
  onDeleteProperty: () => void; // 删除属性规则
  getPopupContainer?: any;
};
// const DESC_REG = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

const PropertyFilter = (props: PropertyFilterType) => {
  const rules = {
    name: [
      { required: true, message: intl.get('global.noNull') },
      { pattern: /^[_a-z]+$/, message: intl.get('function.paramNameRule') },
      { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
      {
        validator: (value: any) => {
          // 后端特别规定参数名不能与其他参数重名
          if (['direction', 'steps', 'vids'].includes(value)) {
            throw new Error('该名字不可用');
          }
        }
      }
    ],
    alias: [
      { required: true, message: intl.get('global.noNull') },
      { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/, message: intl.get('global.onlyNormalName') },
      { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
    ],
    description: [
      { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
      { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
    ]
  };
  const { error, checkParam, propertyFilter, divider, selfProperties, saveParamNames, getPopupContainer } = props;
  const { existError, setExistError } = props;
  const { addOrChangeProperty, onDeleteProperty } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerSize = HOOKS.useSize(document.getElementById('serviceRulesId'));

  const [field, errors, { setFields }]: any = HOOKS.useForm(['name', 'alias', 'example', 'description'], {
    rules
  });

  const errormsg = useMemo(() => {
    const namesLength = _.filter(saveParamNames, p => p === propertyFilter?.custom_param?.name)?.length;
    if (namesLength >= 2 && existError?.proId === propertyFilter?.proId) {
      return intl.get('function.existParam');
    }
    return '';
  }, [existError]);

  // 过滤掉自动生产的属性
  const propertyList = useMemo(
    () => _.filter(selfProperties, p => !_.includes(ANALYSIS_PROPERTIES.defaultAtr, p.name)),
    [selfProperties]
  );

  useEffect(() => {
    // 属性存在报错行
    let errorLine = 0;
    if (errors?.name || errors?.alias || errormsg) errorLine += 1;
    if (errors?.description) errorLine += 1;
    if (errormsg) setExistError({ ...existError, msg: errormsg });
    addOrChangeProperty({ ...propertyFilter, errorLine });
  }, [errors, errormsg]);

  useEffect(() => {
    setFields({ ...propertyFilter?.custom_param });
  }, [propertyFilter?.custom_param]);

  useEffect(() => {
    if (checkParam) {
      const param = propertyFilter?.custom_param;
      if (param?.name === '' && param?.alias === '') {
        setFields({ name: '', alias: '' });
        return;
      }
      if (param?.name === '') setFields({ name: '' });
      if (param?.alias === '') setFields({ alias: '' });
    }
  }, [checkParam]);

  // 返回属性的类型
  const getType = (key: string) => {
    if (_.includes(NUMBERKEY, key)) return 'number';
    return key;
  };

  // 切换时间
  const onChangeDate = (date: any, dateString: any) => {
    addOrChangeProperty({ op_value: dateString });
  };

  // 属性变量
  const getVarableType = (type: any) => {
    if (['datetime', 'date'].includes(type)) return TIME_VARIABLE;
    return VARIABLE;
  };

  // 修改参数
  const onChangeCustom = (e: any, type: any) => {
    if (type === 'name') {
      setExistError({ proId: propertyFilter?.proId });
    }

    setFields({ [type]: e.target.value });
    addOrChangeProperty({ custom_param: { ...propertyFilter?.custom_param, [type]: e?.target?.value } });
  };

  const container = () => {
    if (containerSize.height >= 417) {
      return document.getElementById('serviceRulesId')!;
    }

    return document.getElementsByClassName('ant-modal')?.[0] as any;
  };

  return (
    <div className="kw-mb-6 servicePropertyFilterRoot">
      <div className="kw-align-center" id="servicePropertyFilterRoot">
        {/* 横线 */}
        <div
          style={{
            height: divider?.height,
            width: 80,
            background: 'rgba(0,0,0,0.1)'
          }}
        />
        {/* 属性下拉选择 */}
        <Select
          style={{ width: 168 }}
          listHeight={130}
          className={classNames({ errBor: error })}
          value={propertyFilter?.name}
          onChange={(_, { value, type }: any) => {
            const init = {
              type: PARAM_TYPE?._CONSTANT,
              custom_param: defaultParam_custom,
              time_param: {},
              op_value: ''
            };
            addOrChangeProperty({ ...init, name: value, property_type: type });
          }}
          getPopupContainer={() => document.getElementById('serviceRulesId')!}
        >
          {_.map(propertyList || [], (pro, i) => {
            return (
              <Option key={i} value={pro?.name} type={pro?.type}>
                {pro?.alias || pro?.name}
              </Option>
            );
          })}
        </Select>
        {/* 运算符 */}
        <Select
          style={{ width: 176, marginLeft: 14 }}
          listHeight={130}
          value={propertyFilter?.operation}
          onChange={e => addOrChangeProperty({ operation: e })}
          getPopupContainer={() => document.getElementById('serviceRulesId')!}
        >
          {_.map(PROTYPE?.[getType(propertyFilter?.property_type)], (operation, index) => {
            return (
              <Option value={operation?.value} key={index}>
                {operation.symbol || intl.get(operation?.label)}
              </Option>
            );
          })}
        </Select>
        {/* 变量类型 */}
        <Select
          style={{ width: 176, marginLeft: 14 }}
          value={propertyFilter?.type}
          onChange={e => {
            const time_param = e === PARAM_TYPE?._SYSTIME ? defaultSysTime : {};
            addOrChangeProperty({ type: e, time_param });
          }}
          getPopupContainer={() => document.getElementById('serviceRulesId')!}
        >
          {_.map(getVarableType(propertyFilter?.property_type), item => {
            return (
              <Option value={item?.value} key={item?.label}>
                {intl.get(item?.label)}
              </Option>
            );
          })}
        </Select>
        {/* 常量输入框 */}
        {propertyFilter?.type === PARAM_TYPE?._CONSTANT ? (
          <div className="valueInputBox" key={isOpen.toString()}>
            {_.includes(['number', 'string'], getType(propertyFilter?.property_type)) && (
              <Input
                placeholder={intl.get('global.pleaseEnter')}
                style={{ width: 200 }}
                value={propertyFilter?.op_value}
                onChange={e => addOrChangeProperty({ op_value: e?.target?.value })}
              />
            )}
            {propertyFilter?.property_type === 'date' && (
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: 200 }}
                value={propertyFilter?.op_value ? moment(propertyFilter?.op_value, 'YYYY - MM - DD') : null}
                onChange={onChangeDate}
                getPopupContainer={container}
                onOpenChange={open => {
                  setIsOpen(open);
                }}
              />
            )}
            {propertyFilter?.property_type === 'datetime' && (
              <DatePicker
                format="YYYY-MM-DD HH:mm:ss"
                value={propertyFilter?.op_value ? moment(propertyFilter?.op_value, 'YYYY-MM-DD HH:mm:ss') : null}
                showTime
                style={{ width: 200 }}
                onChange={onChangeDate}
                getPopupContainer={container}
                onOpenChange={open => {
                  setIsOpen(open);
                }}
                suffixIcon={<ClockCircleOutlined />}
              />
            )}
            {propertyFilter?.property_type === 'boolean' && (
              <Select
                style={{ width: 200 }}
                onChange={e => addOrChangeProperty({ op_value: e })}
                value={propertyFilter?.op_value || 'true'}
                getPopupContainer={() => document.getElementById('serviceRulesId')!}
              >
                <Option value="true">true</Option>
                <Option value="false">false</Option>
              </Select>
            )}
          </div>
        ) : (
          <div style={{ width: 200, marginLeft: 14 }} />
        )}
        <div>
          {/* 删除按钮 */}
          <Tooltip title={intl.get('exploreGraph.clear')}>
            <IconFont
              type="icon-lajitong"
              className="kw-pointer kw-ml-3 deleteIcon"
              onClick={() => onDeleteProperty()}
            />
          </Tooltip>
        </div>
      </div>
      {/* 自定义变量 */}
      {propertyFilter?.type === PARAM_TYPE?._CUSTOMVAR && (
        <div className="kw-mt-2 customBox" style={{ paddingLeft: 80 }}>
          <Row>
            <Col>
              <Input
                className={classNames('kw-mb-1', { errInput: !!errors?.name || !!errormsg })}
                value={propertyFilter?.custom_param?.name}
                style={{ width: 358 }}
                addonBefore={intl.get('cognitiveService.neighbors.paramName')}
                placeholder={intl.get('function.variableName')}
                onChange={e => onChangeCustom(e, 'name')}
              />
              <span className="kw-c-error" style={{ display: 'block' }}>
                {errors?.name || errormsg}
              </span>
            </Col>
            <Col>
              <Input
                className={classNames('kw-mb-1 kw-ml-3', { errInput: !!errors?.alias })}
                value={propertyFilter?.custom_param?.alias}
                style={{ width: 392 }}
                addonBefore={intl.get('function.showName')}
                placeholder={intl.get('function.enterAlias')}
                onChange={e => onChangeCustom(e, 'alias')}
              />
              <span className="kw-c-error kw-pl-3" style={{ display: 'block' }}>
                {errors?.alias}
              </span>
            </Col>
            <Input
              className="kw-mb-1"
              style={{ width: 762 }}
              value={propertyFilter?.custom_param?.example}
              addonBefore={intl.get('cognitiveService.neighbors.paramExample')}
              placeholder={intl.get('cognitiveService.neighbors.enterExample')}
              onChange={e => onChangeCustom(e, 'example')}
            />
            <Col>
              <Input
                className={classNames('', { errInput: !!errors?.description })}
                value={propertyFilter?.custom_param?.description}
                style={{ width: 762 }}
                addonBefore={intl.get('cognitiveService.neighbors.paramDesc')}
                placeholder={intl.get('cognitiveService.neighbors.enterDesc')}
                onChange={e => onChangeCustom(e, 'description')}
              />
              <span className="kw-c-error" style={{ display: 'block' }}>
                {errors?.description}
              </span>
            </Col>
          </Row>
        </div>
      )}
      {/* 系统时间变量 */}
      {propertyFilter?.type === PARAM_TYPE?._SYSTIME && (
        <div className="kw-mt-2" style={{ paddingLeft: 80 }}>
          <Select
            style={{ width: 168 }}
            placeholder={intl.get('cognitiveService.neighbors.selectSystem')}
            value={propertyFilter?.time_param?.type}
            listHeight={4 * 32}
            onChange={e => addOrChangeProperty({ time_param: { ...propertyFilter?.time_param, type: e } })}
            getPopupContainer={() => document.getElementById('serviceRulesId')!}
          >
            {_.map(TIME_TYPE, item => {
              return (
                <Option value={item?.value} key={item?.value}>
                  {intl.get(item?.label)}
                </Option>
              );
            })}
          </Select>
          <NumberInput
            defaultValue={0}
            step={1} // 设置每次增减的步长为1
            precision={0} // 设置小数点后的精度为0，只保留整数
            className="kw-mb-1 kw-ml-3"
            placeholder={intl.get('cognitiveService.neighbors.enterOffset')}
            style={{ width: 176 }}
            value={propertyFilter?.time_param?.offset}
            onChange={(e: any) => {
              const intValue = Math.floor(e);
              addOrChangeProperty({ time_param: { ...propertyFilter?.time_param, offset: intValue } });
            }}
            onBlur={e => {
              const intValue = Math.floor(e);
              addOrChangeProperty({ time_param: { ...propertyFilter?.time_param, offset: intValue } });
            }}
          />
        </div>
      )}
    </div>
  );
};
export default PropertyFilter;
