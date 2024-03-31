import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

import CreateThesaurusModal from './CreateThesaurusModal';
import ThesaurusHeader from './ThesaurusHeader';
import ThesaurusTable from './ThesaurusTable';

const ThesaurusContent = (props: any, ref: any) => {
  const {
    visible,
    setVisibleThesaurus,
    thesaurusTableData,
    mode,
    tabKey,
    setIsChange,
    setThesaurusTableData,
    setThesaurusTableDataTime,
    tableLoading
  } = props;
  const tableRef = useRef<any>();
  const selectRef = useRef<any>();

  useImperativeHandle(ref, () => ({
    onChangeTableData
  }));

  const onChangeTableData = (state: any, data?: any) => {
    tableRef?.current?.onHandleTableStateData(state, data);
    selectRef?.current?.getConfigThesaurus(data);
  };

  return (
    <div>
      <ThesaurusHeader
        ref={selectRef}
        tabKey={tabKey}
        setVisibleThesaurus={setVisibleThesaurus}
        onChangeTableData={onChangeTableData}
        thesaurusTableData={thesaurusTableData}
      />
      <ThesaurusTable
        ref={tableRef}
        setVisibleThesaurus={setVisibleThesaurus}
        thesaurusTableData={thesaurusTableData}
        setThesaurusTableData={setThesaurusTableData}
        setThesaurusTableDataTime={setThesaurusTableDataTime}
        setIsChange={setIsChange}
        tableLoading={tableLoading}
        mode={mode}
      />
      <CreateThesaurusModal
        visible={visible}
        setVisibleThesaurus={setVisibleThesaurus}
        thesaurusTableData={thesaurusTableData}
        onChangeTableData={onChangeTableData}
        setIsChange={setIsChange}
      />
    </div>
  );
};

export default forwardRef(ThesaurusContent);
