import intl from 'react-intl-universal';

const THESAURUS_ENTITY_LINK = '实体链接';
const THESAURUS_CUSTOM = '分词';
const THESAURUS_STD = '近义词';

const THESAURUS_MODE_TYPE: Record<string, string> = {
  [THESAURUS_ENTITY_LINK]: 'entity_link',
  [THESAURUS_CUSTOM]: 'custom',
  [THESAURUS_STD]: 'std'
};

const ENTITY_LINK = 'entity_link';
const CUSTOM = 'custom';
const STD = 'std';

const THESAURUS_MODE_ZH: Record<string, string> = {
  [ENTITY_LINK]: '实体链接',
  [CUSTOM]: '分词',
  [STD]: '近义词'
};

const ENTITY_LINK_ZH = 'entity_link';
const CUSTOM_ZH = 'custom';
const STD_ZH = 'std';

const THESAURUS_MODE_ZH_CN: Record<string, string> = {
  [ENTITY_LINK_ZH]: intl.get('ThesaurusManage.createMode.entity'),
  [CUSTOM_ZH]: intl.get('ThesaurusManage.createMode.participleTwo'),
  [STD_ZH]: intl.get('ThesaurusManage.createMode.synonymTwo')
};

const THESAURUS_TEXT = {
  THESAURUS_MODE_TYPE,
  THESAURUS_MODE_ZH,
  THESAURUS_MODE_ZH_CN
};

export default THESAURUS_TEXT;
