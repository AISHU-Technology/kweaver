import { ReactNode } from 'react';

export type GlossaryDataType = {
  id: number;
  name: string;
  description: string;
  default_language: string;
  word_num: number;
  create_user_name: string;
  create_time: string;
  update_user_name: string;
  update_time: string;
  __codes: any;
};

export type TermLabelType = {
  name: string;
  description: string;
  synonym: string[];
  language: string;
};

export type TermType = {
  id: string;
  label: TermLabelType[];
  level: {
    parent_count: number;
    child_count: number;
  };
};

export type TermTreeNodeType = {
  key: string;
  title: string;
  isInput: boolean;
  children: TermTreeNodeType[];
  sourceData?: TermType;
  parentKey?: string;
  isLeaf?: boolean;
  icon?: ReactNode;
};

export type TermCustomRelationType = {
  relation_id: number;
  relation_name: string;
  words: TermType[];
};

export type CustomRelationType = {
  id: number;
  name: string;
  editing?: boolean;
};
