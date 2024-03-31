export type Columns = {
  id: string;
}[];

export type ProjectItem = {
  prompt_item_id: string;
  prompt_item_name: string;
  prompt_item_types: { id: string; name: string }[];
  create_by: string;
  update_by: string;
  create_time: string | number;
  update_time: string | number;
};

export type CategoryItem = {
  prompt_item_id: string;
  prompt_item_name: string;
  prompt_item_type_id: string;
  prompt_item_type_name: string;
  scroll?: boolean;
};

export type PromptItem = {
  prompt_item_id: string;
  prompt_item_type_id: string;
  prompt_service_id: string;
  prompt_id: string;
  icon: string | number;
  prompt_name: string;
  prompt_type: 'chat' | 'completion' | string;
  model_name: string;
  model_series: string;
  prompt_desc: string;
  prompt_deploy: boolean;
  create_time: string | number;
  create_by: string;
  update_time: string | number;
  update_by: string;
};

export type { ProjectState, PromptState } from './enums';
