import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

import { Button, Select, message, Tooltip, Input } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import HELPER from '@/utils/helper';
import servicesThesaurus from '@/services/thesaurus';
import servicesPermission from '@/services/rbacPermission';

import { ERROR_CODE } from '../../enum';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { getParam } from '@/utils/handleFunction';

import './style.less';
import { removeQueryStringAndHash } from 'redoc';

const ThesaurusHeader = (props: any, ref: any) => {
  const { tabKey, setVisibleThesaurus, onChangeTableData, thesaurusTableData } = props;
  const [thesaurusList, setThesaurusList] = useState<any>([{ id: '-1', name: intl.get('cognitiveSearch.all') }]); // 历史任务成功的图谱
  const searchInputRef = useRef<any>();
  const [selectValue, setSelectValue] = useState('109');
  const [inputValue, setInputValue] = useState('');
  const [focus, setFocus] = useState(false);
  const [saveTableData, setSaveTableData] = useState<any>([]);

  useImperativeHandle(ref, () => ({ getConfigThesaurus }));

  useEffect(() => {
    onChangeTableData({ page: 1, query: '', graph: '-1' });
    setInputValue('');
    setSelectValue('-1');
  }, [tabKey]);

  useEffect(() => {
    getConfigThesaurus(thesaurusTableData);
  }, [thesaurusTableData, tabKey]);

  /**
   * 获取有效图谱
   */
  const getConfigThesaurus = (data: any) => {
    const allUsedThesaurusName = onUsedThesaurusName(data || thesaurusTableData);
    setThesaurusList([{ id: '-1', name: intl.get('cognitiveSearch.all') }, ...allUsedThesaurusName]);
  };

  /**
   * 已添加的词库信息
   */
  const onUsedThesaurusName = (data: any) => {
    const reduceData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.thesaurus_id] = {};
        return pre;
      },
      {}
    );
    _.map(_.cloneDeep(data), (item: any) => {
      reduceData[item.thesaurus_id] = { name: item?.name, id: item?.thesaurus_id };
    });
    const formatHandle = _.map(reduceData, (item: any) => item);
    return formatHandle;
  };

  /**
   * 知识图谱选择
   */
  const onChangeSelect = (value: string) => {
    setSelectValue(value);
    onChangeTableData({ page: 1, graph: value });
  };

  const onFocus = (e: any) => {
    setFocus(true);
  };

  const onBlur = (e: any) => {
    setFocus(false);
  };

  /**
   * 搜索
   */
  const onSearch = _.debounce(e => {
    onChangeTableData({ page: 1, query: e?.target?.value });
  }, 300);

  return (
    <div className="thesaurus-mode-create-header-root kw-mb-4">
      <div className="thesaurus-left">
        <Button type="primary" onClick={() => setVisibleThesaurus(true)}>
          <IconFont type="icon-Add" />
          {intl.get('global.add')}
        </Button>
      </div>
      <div className="thesaurus-right kw-flex">
        <span>{intl.get('ThesaurusManage.createMode.thesaurusNameTwo')}</span>
        <Select
          onChange={onChangeSelect}
          getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          className="kw-mr-3 kw-ml-3 thesaurus-select"
          value={selectValue}
        >
          {_.map(thesaurusList, (item: any) => {
            return (
              <Select.Option key={item?.id} value={item?.id}>
                <div className="kw-flex select-graph-name">
                  <IconFont type="icon-ciku1" className="icon-box kw-mr-2" />
                  <div className="kw-ellipsis " title={item?.name}>
                    {item?.name}
                  </div>
                </div>
              </Select.Option>
            );
          })}
        </Select>

        <Input
          value={inputValue}
          onFocus={onFocus}
          onBlur={onBlur}
          allowClear
          prefix={<IconFont type="icon-sousuo" className={focus ? 'kw-c-header' : 'kw-c-watermark'} />}
          className="thesaurus-search kw-mr-3"
          placeholder={intl.get('ThesaurusManage.createMode.searchColumn')}
          onChange={(e: any) => {
            e.persist();
            onSearch(e);
            setInputValue(e?.target?.value);
          }}
        />
      </div>
    </div>
  );
};

export default forwardRef(ThesaurusHeader);
