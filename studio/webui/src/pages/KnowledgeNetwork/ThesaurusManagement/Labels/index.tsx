import React, { useEffect, memo, useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons';
import { Tag, Dropdown, Menu, message, Input } from 'antd';
import intl from 'react-intl-universal';

import './style.less';
import _ from 'lodash';
import IconFont from '@/components/IconFont';

export interface LabelsProps {
  tags: Array<string>;
  selectOption: Array<string>;
  setTags: (tag: Array<string>) => void;
}

const Labels = (props: LabelsProps) => {
  const { tags, selectOption } = props;
  const { setTags } = props;
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [error, setError] = useState(false);
  const [errortext, setErrorText] = useState('');
  const inputRef = useRef<any>(null);
  const [filteredOptions, setfilteredOptions] = useState<any>([]);
  const [dropVisible, setDropVisible] = useState(false);
  // let filteredOptions = selectOption.filter(o => !tags?.includes(o));

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  useEffect(() => {
    if (inputValue) {
      const options = selectOption.filter(o => !tags?.includes(o)).filter((o: string) => {
        return o.includes(inputValue)
      });
      setfilteredOptions(options);
    } else {
      setfilteredOptions(selectOption.filter(o => !tags?.includes(o)));
    }
  }, [inputValue])

  useEffect(() => {
    const options = selectOption.filter(o => !tags?.includes(o));
    setfilteredOptions(options);
  }, [selectOption, tags])

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
      setfilteredOptions(selectOption.filter(o => !tags?.includes(o)));
      return;
    }

    if (e?.length > 50) {
      setErrorText(intl.get('datamanagement.maxLength'));
      setError(true);
      setDropVisible(false);
      return;
    }

    const test = /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@$&%^&()_+`'{}[\];,.~！@￥%…&· （）—+。={}【】：；‘’“”、《》？，]+$)|-/

    if (!test.test(e)) {
      setErrorText(`${intl.get('ThesaurusManage.labelRule')}# / : * ? " < > | `);
      setError(true);
      setDropVisible(false);
      return;
    }

    if (e && tags.indexOf(e) === -1) {
      setTags([...tags, e]);
    } else {
      message.error(intl.get('ThesaurusManage.labelExisits'));
      return;
    }

    setInputVisible(false);
    setInputValue(undefined);
  };

  // 监听输入的变化
  const changeInputValue = (e: any) => {
    setError(false);
    setDropVisible(true);
    // if (!e) return;
    setInputValue(e.target.value);
  }

  const menu = (
    <div className="labels-select-content">
      {
        filteredOptions.map((item: string) => (
          <div
            className="ad-pl-3 ad-pr-3 select-item"
            key={item}
            onClick={() => {
              inputRef.current?.focus();
              setInputValue(item);
              handleInputConfirm(item);
            }}>
            {item}
          </div>
        ))
      }
      {
        _.isEmpty(filteredOptions) ?
          <div className="ad-mt-2 ad-ml-3">{intl.get('ThesaurusManage.labelEnter')}</div>
          : null
      }
    </div >

  )
  return (
    <div className="create-thesaurus-labels" id="thesaurus-labels">
      {tags?.map((tag: any, index: React.SetStateAction<number>) => {
        const isLongTag: boolean = tag.length > 6;
        const tagElem = (
          <Tag
            className="edit-tag ad-mt-2"
            key={tag}
            closable={true}
            onClose={() => handleClose(tag)}
            closeIcon={<IconFont type="icon-shibai" style={{ color: 'rgba(0, 0, 0, 0.15)' }} />}
          >
            <span>
              {isLongTag ? `${tag.slice(0, 6)}...` : tag}
            </span>
          </Tag>
        );

        return isLongTag ? (
          <span title={tag} key={tag} className="ad-mt-2">
            {tagElem}
          </span>
        ) : (
          tagElem
        )
      })}

      {
        inputVisible && (
          <React.Fragment>
            <Dropdown
              visible={dropVisible}
              overlay={menu}
              trigger={['click']}
              placement="bottomCenter"
              onVisibleChange={isOpen => {
                setDropVisible(isOpen);
                if (!isOpen) handleInputConfirm(null)
              }}
              getPopupContainer={triggerNode => triggerNode.parentElement!}
            >
              <Input
                ref={inputRef}
                type="text"
                placeholder={intl.get('search.placeInput')}
                className="tag-input"
                value={inputValue}
                onChange={changeInputValue}
                onPressEnter={() => {
                  if (!inputValue) setDropVisible(false);

                  handleInputConfirm(null)
                }}
              />
            </Dropdown>

            {error && <span className="error-text">{errortext}</span>}
          </React.Fragment>
        )
      }
      {
        (!inputVisible && tags?.length < 10) && (
          <Tag className="site-tag-plus" onClick={showInput}>
            <PlusOutlined /> {intl.get('ThesaurusManage.addlabel')}({tags?.length}/10)
          </Tag>
        )
      }

    </div >
  );
};
export default (memo)(Labels);
