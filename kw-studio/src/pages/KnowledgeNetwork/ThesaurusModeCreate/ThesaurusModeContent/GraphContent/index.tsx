import React, { useImperativeHandle, forwardRef, useRef } from 'react';

import classNames from 'classnames';

import CreateModal from './CreateModal';
import ThesaurusGraphTable from './ThesaurusGraphTable';
import ThesaurusGraphHeader from './ThesaurusGraphHeader';

const GraphContent = (props: any, ref: any) => {
  const {
    visible,
    setVisible,
    tableData,
    setTableData,
    mode,
    setIsChange,
    setGraphTableDataTime,
    tableLoading,
    tabKey
  } = props;
  const tableRef = useRef<any>();
  const selectRef = useRef<any>();

  useImperativeHandle(ref, () => ({
    onChangeGraphTableData
  }));

  const onChangeGraphTableData = (state: any, data?: any) => {
    tableRef?.current?.onHandleTableStateData(state, data);
    selectRef?.current?.getConfigGraph(data);
  };

  return (
    <div className={classNames({ 'kw-pl-6 kw-pr-6 kw-h-100': mode === 'std' })}>
      <ThesaurusGraphHeader
        tableData={tableData}
        setVisible={setVisible}
        onChangeTableData={onChangeGraphTableData}
        tabKey={tabKey}
      />
      <ThesaurusGraphTable
        ref={tableRef}
        setVisible={setVisible}
        mode={mode}
        tableData={tableData}
        setTableData={setTableData}
        setIsChange={setIsChange}
        setGraphTableDataTime={setGraphTableDataTime}
        tableLoading={tableLoading}
      />
      <CreateModal
        visible={visible}
        setTableData={setTableData}
        setVisible={setVisible}
        tableData={tableData}
        onChangeTableData={onChangeGraphTableData}
        mode={mode}
        setIsChange={setIsChange}
      />
    </div>
  );
};

export default forwardRef(GraphContent);
