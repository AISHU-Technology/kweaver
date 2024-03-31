import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import _ from 'lodash';
import { Button, Dropdown, Menu, message } from 'antd';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import GlossaryTree, { GlossaryTreeRefType } from '../GlossaryTree';
import './style.less';
import SearchList from '../SearchList';
import intl from 'react-intl-universal';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { TermTreeNodeType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { searchTerm } from '@/services/glossaryServices';
import Format from '@/components/Format';

const LeftList = forwardRef<any, any>(({ onTermDataSourceChange }, ref) => {
  const {
    glossaryStore: { glossaryData, mode, selectedLanguage },
    setGlossaryStore
  } = useGlossaryStore();
  const [searchProps, setSearchProps] = useState({
    value: '',
    searchData: [],
    loading: false
  });
  const glossaryTreeRef = useRef<GlossaryTreeRefType | null>(null);
  const searchInput = useRef<any>();
  useImperativeHandle(ref, () => ({
    refreshTerm: glossaryTreeRef.current?.refreshTerm,
    setSelectedNodeByTerm: glossaryTreeRef.current?.setSelectedNodeByTerm
  }));

  const handleChange = _.debounce((inputValue: string) => {
    onSearch(inputValue);
  }, 300);

  const onSearch = async (inputValue: string) => {
    if (!inputValue) {
      setSearchProps(pre => ({
        ...pre,
        searchData: [],
        value: ''
      }));
      return;
    }
    try {
      setSearchProps(pre => ({
        ...pre,
        loading: true,
        value: inputValue
      }));
      const data = await searchTerm(glossaryData!.id, {
        query: inputValue,
        field: 'name_and_synonym'
      });
      setSearchProps(pre => ({
        ...pre,
        searchData: data.res,
        loading: false
      }));
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const onTreeNodeSelect = (nodes: TermTreeNodeType[]) => {
    setGlossaryStore(preStore => ({
      ...preStore,
      selectedTerm: nodes.map(item => item.sourceData)
    }));
  };

  return (
    <div className="glossaryLeftTreeRoot kw-flex-column">
      <div className="kw-flex kw-mb-4">
        <SearchInput
          ref={searchInput}
          autoWidth={true}
          placeholder={intl.get('glossary.searchTermPlaceholder')}
          className="searchInput"
          onPressEnter={(e: any) => {
            const inputValue = e?.target?.value;
            onSearch(inputValue);
          }}
          onChange={(e: any) => {
            e?.persist();
            const inputValue = e?.target?.value;
            handleChange(inputValue);
          }}
        />
      </div>
      <div className="kw-w-100 kw-flex-item-full-height">
        <div style={{ display: searchProps.value ? 'block' : 'none' }}>
          <SearchList
            loading={searchProps.loading}
            selectedLanguage={selectedLanguage}
            data={searchProps.searchData}
            onSelect={async (key, data) => {
              setGlossaryStore(preStore => ({
                ...preStore,
                selectedTerm: [data]
              }));
              await glossaryTreeRef.current?.setSelectedNodeByTerm([data.id]);
              searchInput.current.state.value = '';
              setSearchProps(prevState => ({
                ...prevState,
                value: ''
              }));
            }}
            searchValue={searchProps.value}
          />
        </div>
        <div className="kw-h-100" style={{ display: !searchProps.value ? 'block' : 'none' }}>
          <GlossaryTree
            readOnly={mode === 'view'}
            ref={glossaryTreeRef}
            selectedLanguage={selectedLanguage}
            onTreeNodeSelect={onTreeNodeSelect}
            onTermDataSourceChange={onTermDataSourceChange}
          />
        </div>
      </div>
    </div>
  );
});
export default LeftList;
