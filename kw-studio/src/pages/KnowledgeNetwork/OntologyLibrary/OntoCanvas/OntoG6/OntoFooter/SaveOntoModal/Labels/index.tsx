import React, { useEffect, memo, useRef, useState, useMemo } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Tag, Dropdown, message, Input } from 'antd';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import './style.less';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import { ONLY_KEYBOARD } from '@/enums';

export interface LabelsProps {
  tags: Array<string>;
  selectOption: Array<string>;
  setTags: (tag: Array<string>) => void;
  setDomainErr: Function;
}

const Labels = (props: LabelsProps) => {
  const { tags, selectOption, setDomainErr } = props;
  const { setTags } = props;
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState('');
  const inputRef = useRef<any>(null);
  const [dropVisible, setDropVisible] = useState(false);
  // 过滤下拉选项
  const filteredOptions = useMemo(() => {
    if (inputValue) {
      const options = _.filter(selectOption, o => !tags?.includes(o));

      return _.filter(options, item => item.includes(inputValue));
    }
    return _.filter(selectOption, o => !tags?.includes(o));
  }, [inputValue, selectOption, tags]);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  /**
   * 删除标签
   */
  const handleClose = (removedTag: string) => {
    const newTags = tags.filter((tag: string) => tag !== removedTag);
    setTags(newTags);
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
    const e = selectItem || inputValue?.trim();

    if (!e) {
      setInputValue(undefined);
      setInputVisible(false);
      return;
    }

    if (e?.length > 50) {
      setErrorText(intl.get('global.lenErr', { len: 50 }));
      setError(true);
      setDomainErr(true);
      setDropVisible(false);
      return;
    }

    // const test = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;

    if (!ONLY_KEYBOARD.test(e)) {
      setErrorText(intl.get('global.onlyKeyboard'));
      setError(true);
      setDomainErr(true);
      setDropVisible(false);
      return;
    }

    if (e && tags.indexOf(e) === -1) {
      setTags([...tags, e]);
    } else {
      setErrorText(intl.get('global.repeatName'));
      setError(true);
      setDomainErr(true);
      setDropVisible(false);
      // message.error(intl.get('global.repeatName'));
      return;
    }

    setInputVisible(false);
    setInputValue(undefined);
  };

  // 监听输入的变化
  const changeInputValue = (e: any) => {
    setError(false);
    setDomainErr(false);
    setDropVisible(true);
    setInputValue(e.target.value);
  };

  const menu = (
    <div className="labels-select-content">
      {filteredOptions.map((item: string) => (
        <div
          className="kw-pl-3 kw-pr-3 select-item kw-ellipsis"
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
      ))}
      {_.isEmpty(filteredOptions) ? (
        <div className="kw-mt-2 kw-ml-3">{intl.get('ThesaurusManage.labelEnter')}</div>
      ) : null}
    </div>
  );
  return (
    <div className="create-thesaurus-labels" id="thesaurus-labels">
      {tags?.map((tag: any, index: React.SetStateAction<number>) => {
        const isLongTag: boolean = tag.length > 6;
        const tagElem = (
          <Tag
            className="edit-tag kw-mt-2"
            key={tag}
            closable={true}
            onClose={() => handleClose(tag)}
            closeIcon={<IconFont type="icon-shibai" style={{ color: 'rgba(0, 0, 0, 0.15)' }} />}
          >
            <span>{isLongTag ? `${tag.slice(0, 6)}...` : tag}</span>
          </Tag>
        );

        return isLongTag ? (
          <span title={tag} key={tag} className="kw-mt-2">
            {tagElem}
          </span>
        ) : (
          tagElem
        );
      })}

      {inputVisible && (
        <React.Fragment>
          <Dropdown
            open={dropVisible}
            overlay={menu}
            trigger={['click']}
            placement="bottom"
            onOpenChange={isOpen => {
              setDropVisible(isOpen);
              if (!isOpen) handleInputConfirm(null);
            }}
            getPopupContainer={triggerNode => triggerNode.parentElement!}
          >
            <Input
              ref={inputRef}
              type="text"
              placeholder={intl.get('search.placeInput')}
              className={classnames('tag-input', { errorInput: errorText })}
              value={inputValue}
              onChange={changeInputValue}
              onPressEnter={() => {
                if (!inputValue) setDropVisible(false);

                handleInputConfirm(null);
              }}
            />
          </Dropdown>

          {error && <span className="error-text">{errorText}</span>}
        </React.Fragment>
      )}
      {!inputVisible && tags?.length < 10 && (
        <Tag className="site-tag-plus" onClick={showInput}>
          <PlusOutlined />
          {intl.get('ontoLib.addDomain', { current: tags?.length, max: 10 })}
        </Tag>
      )}
    </div>
  );
};
export default memo(Labels);
