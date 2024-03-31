import React, { useEffect, memo, useRef, useState, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Tag, Dropdown, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './style.less';
import { ONLY_KEYBOARD } from '@/enums';

export interface LabelsProps {
  value: Array<string>;
  selectOption: Array<string>;
  onChange: (tag: Array<string>) => void;
}

// const TEST = /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@$&%^&()_+`'{}[\];,.~！@￥%…&· （）—+。={}【】：；‘’“”、《》？，]+$)|-/;
const Tags = (props: LabelsProps) => {
  const { value, selectOption } = props;
  const { onChange } = props;

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [errorText, setErrorText] = useState('');
  const [dropVisible, setDropVisible] = useState(false);
  const inputRef = useRef<any>(null);

  // 过滤下拉选项
  const filteredOptions = useMemo(() => {
    if (inputValue) {
      const options = _.filter(selectOption, o => !value?.includes(o));
      return _.filter(options, item => item.includes(inputValue));
    }
    return _.filter(selectOption, o => !value?.includes(o));
  }, [inputValue, selectOption, value]);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  /**
   * 删除标签
   */
  const handleClose = (removedTag: string) => {
    const newTags = value.filter((tag: string) => tag !== removedTag);
    onChange(newTags);
  };

  /**
   * 点击新建切换
   */
  const showInput = () => {
    setInputVisible(true);
    setDropVisible(true);
  };

  /**
   * 选中后写入标签
   */
  const handleInputConfirm = (selectItem: any) => {
    const _value = selectItem || inputValue?.trim();

    if (!_value) {
      setInputValue(undefined);
      setInputVisible(false);
      return;
    }

    if (_value?.length > 50) {
      setDropVisible(false);
      setErrorText(intl.get('global.lenErr', { len: 50 }));
      return;
    }

    if (!ONLY_KEYBOARD.test(_value)) {
      setErrorText(intl.get('global.onlyKeyboard'));
      setDropVisible(false);
      return;
    }

    if (errorText) return;

    onChange([...value, _value]);
    setInputVisible(false);
    setInputValue(undefined);
  };

  // 监听输入的变化
  const changeInputValue = (e: any) => {
    const _value = e.target.value;
    setDropVisible(true);
    setInputValue(_value);

    if (_value && _.includes(value, _value)) {
      setDropVisible(false);
      setErrorText(intl.get('global.repeatName'));
      return;
    }

    setErrorText('');
  };

  const inputOptions = (
    <div className="labelsSelectContent">
      {_.isEmpty(filteredOptions) ? (
        <div className="kw-mt-2 kw-ml-3">{intl.get('component.tags.labelEnter')}</div>
      ) : (
        _.map(filteredOptions, item => {
          return (
            <div
              className="kw-pl-3 kw-pr-3 kw-ellipsis selectItem"
              key={item}
              title={item}
              onClick={() => {
                inputRef.current?.focus();
                setInputValue(item);
                handleInputConfirm(item);
              }}
            >
              {item}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="componentTagsRoot" id="thesaurus-labels">
      {_.map(value, (tag: any) => {
        const isLongTag: boolean = tag.length > 6;
        return (
          <Tag
            className="tagItem"
            key={tag}
            closable={true}
            onClose={() => handleClose(tag)}
            closeIcon={<IconFont type="icon-shibai" style={{ color: 'rgba(0, 0, 0, 0.15)' }} />}
          >
            <span title={isLongTag ? 'tag' : ''}>{isLongTag ? `${tag.slice(0, 6)}...` : tag}</span>
          </Tag>
        );
      })}

      {inputVisible && (
        <React.Fragment>
          <Dropdown
            visible={dropVisible}
            overlay={inputOptions}
            trigger={['click']}
            placement="bottomCenter"
            getPopupContainer={triggerNode => triggerNode.parentElement!}
            onVisibleChange={isOpen => {
              setDropVisible(isOpen);
              if (!isOpen) handleInputConfirm(null);
            }}
          >
            <Input
              ref={inputRef}
              className={classnames('tagInput', { errorInput: errorText })}
              type="text"
              value={inputValue}
              placeholder={intl.get('component.tags.placeInput')}
              onChange={changeInputValue}
              onPressEnter={() => {
                if (!inputValue) setDropVisible(false);
                handleInputConfirm(null);
              }}
            />
          </Dropdown>

          {!!errorText && <span className="errorText">{errorText}</span>}
        </React.Fragment>
      )}
      {!inputVisible && value?.length < 10 && (
        <Tag className="addTagButton" onClick={showInput}>
          <PlusOutlined />
          {intl.get('component.tags.addLabel')}({value?.length}/10)
        </Tag>
      )}
    </div>
  );
};
export default memo(Tags);
