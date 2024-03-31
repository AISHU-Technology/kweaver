/**
 * 一层模型类型：1-意图池模型 2-大模型 3-自定义模型  4-内置模型
 * 二层模型类型：0-默认 1-NLP应用模型 2-NLP基础组件 3-运筹优化模型 4-KBOA知识问答 5-音频转文字模型
 */
/** 下拉筛选 */
export const M_TYPE = [
  { key: 1, label: 'modelService.applyNLP', icon: 'icon-color-neizhimoxing', color: '#ff8501', type: 4, cType: 1 },
  { key: 2, label: 'modelService.basicNLP', icon: 'icon-color-neizhimoxing', color: '#ff8501', type: 4, cType: 2 },
  { key: 3, label: 'modelService.optNLP', icon: 'icon-color-neizhimoxing', color: 'ff8501', type: 4, cType: 3 },
  { key: 4, label: 'modelService.KBQA', icon: 'icon-color-neizhimoxing', color: 'ff8501', type: 4, cType: 4 },
  { key: 5, label: 'modelService.audioText', icon: 'icon-color-neizhimoxing', color: 'ff8501', type: 4, cType: 5 }
];

/** 映射表格 */
export const MODEL_TYPE: Record<any, any> = {
  1: { 0: { label: 'intention.intentPool', icon: 'icon-color-yituchi', color: '#9254DE' } },
  2: { 0: { label: 'modelService.bigModel', icon: 'icon-ChatGPT' } },
  3: { 0: { label: 'modelService.customModel', icon: 'icon-color-zidingyi', color: '#1677FF' } },
  4: {
    1: { label: 'modelService.applyNLP', icon: 'icon-color-neizhimoxing', color: '#ff8501' },
    2: { label: 'modelService.basicNLP', icon: 'icon-color-neizhimoxing', color: '#ff8501' },
    3: { label: 'modelService.optNLP', icon: 'icon-color-neizhimoxing', color: '#ff8501' },
    4: { label: 'modelService.KBQA', icon: 'icon-color-neizhimoxing', color: '#ff8501' },
    5: { label: 'modelService.audioText', icon: 'icon-color-neizhimoxing', color: '#ff8501' }
  }
};

export const STATUS: Record<any, any> = [
  {
    value: 0,
    label: 'global.all'
  },
  {
    value: 1,
    label: 'modelService.unpublished'
  },
  {
    value: 2,
    label: 'modelService.published'
  }
];
