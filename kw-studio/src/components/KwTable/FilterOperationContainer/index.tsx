import React, { useMemo, useState, useCallback } from 'react';
import { Form, Select } from 'antd';
import classnames from 'classnames';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';

import { FilterOperationContainerProps } from '../types';
import './style.less';

const { Option } = Select;

const FilterOperationContainer: React.FC<FilterOperationContainerProps> = props => {
  const {
    visible = true,
    showSearch = true,
    className,
    filterConfig,
    children,
    onSearchChange,
    searchPlaceholder = '',
    onClose = () => {},
    filterToolsOptions = []
  } = props;
  const [_isFilter, _setIsFilter] = useState(visible);
  const { isFilter, setIsFilter } = filterConfig || {
    isFilter: _isFilter,
    setIsFilter: _setIsFilter
  };

  const [form] = Form.useForm();
  const moreOptions = filterToolsOptions;
  const moreOptionsObj: Record<string, string | number> = {};

  const [selector, setSelector] = useState<{ cur: number; perPageTotal: number }>({
    cur: 1,
    perPageTotal: 3
  });

  const { cur, perPageTotal } = selector;

  useMemo(() => {
    moreOptions.forEach(item => {
      const { optionList = [] } = item;
      moreOptionsObj[item.id] = optionList.length > 0 ? optionList[0].value : '';
    });
  }, [moreOptions]);

  const showOptions = useCallback(() => {
    if (moreOptions.length <= perPageTotal) {
      const res = moreOptions?.map(item => {
        const { id, label, optionList = [], onHandle = () => {}, itemDom = null } = item;
        return (
          <div
            key={String(label) + cur}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            {label ? (
              <span className="kw-ellipsis" style={{ flexShrink: 0, marginRight: 10 }} title={label}>
                {label}
              </span>
            ) : null}

            <Form.Item className="kw-mr-3" name={id}>
              {itemDom === null ? (
                <Select
                  className="select-box"
                  onChange={value => {
                    onHandle(value);
                  }}
                  style={{ width: 190 }}
                >
                  {optionList?.map(item => {
                    return (
                      <Option key={item.key} value={item.value}>
                        {item.text}
                      </Option>
                    );
                  })}
                </Select>
              ) : (
                itemDom
              )}
            </Form.Item>
          </div>
        );
      });
      return res;
    }
    const res = moreOptions.slice((cur - 1) * perPageTotal, cur * perPageTotal)?.map(item => {
      const { id, label, optionList = [], onHandle = () => {}, itemDom = null } = item;
      return (
        <div
          key={String(label) + cur}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {label ? (
            <span className="kw-ellipsis" style={{ flexShrink: 0, marginRight: 10 }} title={label}>
              {label}
            </span>
          ) : null}

          <Form.Item className="kw-mr-3" name={id}>
            {itemDom === null ? (
              <Select
                className="select-box"
                onChange={value => {
                  onHandle(value);
                }}
                style={{ minWidth: 190 }}
              >
                {optionList?.map(item => {
                  return (
                    <Option key={item.key} value={item.value}>
                      {item.text}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              itemDom
            )}
          </Form.Item>
        </div>
      );
    });
    const selector = (
      <div key={cur + ''} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Format.Button
          type="icon"
          className="kw-mr-3"
          onClick={() => {
            onPageChange('pre');
          }}
          disabled={cur === 1}
        >
          {/* <LeftOutlined /> */}
          <IconFont type="icon-shangfanye" />
        </Format.Button>
        <Format.Button
          type="icon"
          className="kw-mr-3"
          onClick={() => {
            onPageChange('next');
          }}
          disabled={cur === Math.ceil(moreOptions.length / perPageTotal)}
        >
          {/* <RightOutlined /> */}
          <IconFont type="icon-fanye" />
        </Format.Button>
      </div>
    );
    res.push(selector);
    return res;
  }, [moreOptions, cur, perPageTotal]);

  const onPageChange = (label: 'pre' | 'next') => {
    label === 'pre'
      ? setSelector(oldSelector => {
          if (oldSelector.cur > 1) {
            return {
              cur: oldSelector.cur - 1,
              perPageTotal: oldSelector.perPageTotal
            };
          }
          return oldSelector;
        })
      : setSelector(oldSelector => {
          if (oldSelector.cur < Math.ceil(moreOptions.length / perPageTotal)) {
            return {
              cur: oldSelector.cur + 1,
              perPageTotal: oldSelector.perPageTotal
            };
          }
          return oldSelector;
        });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange && onSearchChange(e?.target?.value);
  };

  return (
    <div style={{ display: isFilter && visible ? 'block' : 'none' }}>
      <div className={classnames('kw-table-filter', className)}>
        {children || (
          <>
            {showSearch ? (
              <SearchInput
                className="search-input"
                autoComplete={'off'}
                placeholder={searchPlaceholder || intl.get('global.search')}
                onChange={e => {
                  e.persist();
                  handleSearch(e);
                }}
                debounce
              />
            ) : (
              <div />
            )}
            <Form
              form={form}
              layout="inline"
              initialValues={{
                search: '',
                ...moreOptionsObj
              }}
            >
              <div className="tools">
                {showOptions()}

                <Format.Button
                  type="icon"
                  className="close-btn kw-mr-3"
                  title={intl.get('global.close')}
                  onClick={() => {
                    setIsFilter(false);
                    onClose();
                  }}
                >
                  <IconFont type="icon-guanbiquxiao" />
                </Format.Button>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterOperationContainer;
