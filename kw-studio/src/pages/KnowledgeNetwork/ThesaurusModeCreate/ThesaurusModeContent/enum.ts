/**
 * 报错
 */

export const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.GetLexiconById.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconService.CreateTemplateLexicon.KnAddLexiconError': 'ThesaurusManage.noPermission',
  'Builder.LexiconService.EditLexicon.LexiconPermError': 'ThesaurusManage.noThesaurusPermission',
  'Builder.LexiconService.EditLexicon.GraphPermError': 'ThesaurusManage.noGraphPermission',
  'Builder.LexiconService.EditLexicon.ExtractError': 'ThesaurusManage.sql',
  'Builder.LexiconService.EditLexicon.separatorError': 'ThesaurusManage.separator',
  'Builder.LexiconService.BuilderTask.LexiconIsRunning': 'ThesaurusManage.thesaurusRun',
  'Builder.LexiconService.BuilderTask.ExtractInfoEmptyError': 'ThesaurusManage.sqlEmpty',
  'Builder.LexiconService.BuilderTask.ExtractGraphIdNotExist': 'ThesaurusManage.graphIdEmpty',
  'Builder.LexiconController.KnowledgeCapacityError': 'ThesaurusManage.capacity'
};
