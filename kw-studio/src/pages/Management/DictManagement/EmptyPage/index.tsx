import intl from 'react-intl-universal';
import React, { useState } from 'react';
import AddContent from '@/assets/images/create.svg';
import CreateOrEditDictModal, { DICT_MODAL_TYPE, CreateOrEditDictDataType } from '../CreateOrEditDictModal';

import './style.less';

export interface DictManagerEmptyPageProps {
  fetchDictListData: Function;
}

const DictEmptyPage = (props: DictManagerEmptyPageProps) => {
  // component props
  const { fetchDictListData } = props;

  // 是否显示新建、编辑弹窗
  const [dictModalVisible, setDictModalVisible] = useState<boolean>(false);

  // createOrEditModal dict init data
  const [dictInitData, setDictInitData] = useState<CreateOrEditDictDataType | undefined>();

  const addFunc = () => {
    const dictData: CreateOrEditDictDataType = {
      cName: '',
      eName: '',
      remark: ''
    };
    setDictInitData(dictData);
    setDictModalVisible(true);
  };

  const closeDictModal = () => {
    fetchDictListData();
    setDictModalVisible(false);
  };

  return (
    <div className="admin-dictManagement-emptyPage">
      <div className="admin-dictManagement-emptyPage-toolTip">
        <img className="admin-dictManagement-emptyPage-img" src={AddContent} alt="nodata" />
        <div>
          {intl.get('dictManagement.addTitle')}
          <span
            className="create-span"
            onClick={() => {
              addFunc();
            }}
          >
            {intl.get('dictManagement.btnDictDescTitle')}
          </span>
          {intl.get('dictManagement.addDictDesc')}
        </div>
      </div>
      {dictModalVisible && (
        <CreateOrEditDictModal
          dictModalType={DICT_MODAL_TYPE.DICT_TYPE}
          createOrEditDictInitData={dictInitData}
          comparedData={[]}
          resModalVisible={dictModalVisible}
          closeResModal={closeDictModal}
        />
      )}
    </div>
  );
};

export default DictEmptyPage;
