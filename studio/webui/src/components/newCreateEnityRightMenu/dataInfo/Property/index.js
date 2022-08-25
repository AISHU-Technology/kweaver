import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Switch, Select } from 'antd';

import { MinusCircleFilled, MinusCircleOutlined } from '@ant-design/icons';

import './style.less';

const LIST = ['boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'string'];

const Property = props => {
  const { page, property, checkData, analyUrl, PAGESIZE } = props;
  const { deleteProperty, inputRef, canInput, changeInput, updateData, changeSelect, changeIndex } = props;
  const { currentIndex, isIncorrect, content } = checkData || {};
  const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型

  const startIndex = PAGESIZE * page - 10;
  const endIndex = PAGESIZE * page - 1;

  const showProperty = property.filter((item, index) => {
    return index >= startIndex && index <= endIndex;
  });

  return (
    <React.Fragment>
      {showProperty?.length > 0 &&
        _.map(showProperty, (item, index) => {
          return (
            <div
              className={isIncorrect && currentIndex === index ? 'add-attr add-attr-error' : 'add-attr'}
              key={index.toString()}
            >
              {(page === 1 && index === 0) || TYPE === 'view' ? (
                <MinusCircleOutlined className="no-delete" />
              ) : (
                <MinusCircleFilled
                  className="delete"
                  onClick={() => {
                    deleteProperty(startIndex + index);
                  }}
                />
              )}
              <Input
                ref={inputRef}
                className="attr-input"
                placeholder={[intl.get('createEntity.enterAttr')]}
                autoComplete="off"
                value={item[0]}
                disabled={canInput(page, index) || TYPE === 'view'}
                onChange={e => {
                  changeInput(e.target.value, startIndex + index, index);
                }}
                onBlur={() => updateData('isBatch')}
              />
              <Select
                className="attr-select"
                listHeight={32 * 3}
                getPopupContainer={triggerNode => triggerNode.parentElement}
                value={item[1]}
                disabled={(page === 1 && index === 0) || TYPE === 'view'}
                onChange={value => {
                  changeSelect(value, startIndex + index);
                }}
              >
                {_.map(LIST, item => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>
              <Switch
                className="switch"
                disabled={(page === 1 && index === 0) || TYPE === 'view'}
                checked={item[2]}
                onClick={value => {
                  changeIndex(value, startIndex + index);
                }}
              />
              {isIncorrect && currentIndex === index ? <div className="error-content">{content}</div> : null}
            </div>
          );
        })}
    </React.Fragment>
  );
};

export default Property;
