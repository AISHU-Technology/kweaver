import React from 'react';
import _ from 'lodash';
import CreateResourceModal from './CreateResourceModal';
import EditGraphDescription from './EditGraphDescription';
import './style.less';

const ResourceCreateModal = (props: any) => {
  const {
    visible,
    testData,
    setTestData,
    onHandleCancel,
    onChangeTable,
    setIsAddModal,
    editMes,
    basicData,
    operationType
  } = props;

  return (
    <>
      {operationType === 'create' && (
        <CreateResourceModal
          visible={visible}
          onHandleCancel={onHandleCancel}
          setIsAddModal={setIsAddModal}
          testData={testData}
          setTestData={setTestData}
          basicData={basicData}
          onChangeTable={onChangeTable}
        />
      )}
      {operationType === 'edit' && (
        <EditGraphDescription
          visible={visible}
          onHandleCancel={onHandleCancel}
          setIsAddModal={setIsAddModal}
          editMes={editMes}
          testData={testData}
          setTestData={setTestData}
          basicData={basicData}
          onChangeTable={onChangeTable}
        />
      )}
    </>
  );
};

export default ResourceCreateModal;
