import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';
import { GetStateAction, Updater } from '@/hooks/useImmerState';
import {
  CustomRelationType,
  GlossaryDataType,
  TermTreeNodeType,
  TermType
} from '@/pages/KnowledgeNetwork/Glossary/types';

const { useImmerState } = HOOKS;

type InitialStateProps = {
  kwId: number;
  glossaryData: GlossaryDataType | null;
  mode: 'view' | 'edit';
  selectedTerm: TermType[];
  selectedLanguage: string;
  customRelationList: CustomRelationType[];
};
const initialState: InitialStateProps = {
  kwId: Number(getParam('id')), // 知识网络ID
  glossaryData: null, // 当前正在编辑/查看的术语库数据
  mode: 'view', // 模式：查看或编辑
  selectedTerm: [], // 选中的术语
  customRelationList: [], // 自定义关系列表
  selectedLanguage: 'zh_CN' // 当前选中的语言
};

interface ContextProps {
  glossaryStore: InitialStateProps;
  setGlossaryStore: Updater<InitialStateProps>;
  getLatestStore: GetStateAction<InitialStateProps>; // 获取store中最新的数据
  initStore: () => void; // 初始化store中的state
}

const context = createContext({} as ContextProps);

context.displayName = 'glossaryStore';

export const useGlossaryStore = () => useContext(context);

const GlossaryContext: React.FC = ({ children }) => {
  const [store, setStore, getLatestStore] = useImmerState<InitialStateProps>(initialState);

  const initStore = () => {
    setStore(preStore => ({
      ...initialState
    }));
  };

  return (
    <context.Provider value={{ glossaryStore: store, setGlossaryStore: setStore, getLatestStore, initStore }}>
      {children}
    </context.Provider>
  );
};

export default GlossaryContext;
