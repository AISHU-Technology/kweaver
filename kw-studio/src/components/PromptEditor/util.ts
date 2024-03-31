import CodeMirror from 'codemirror';
import 'codemirror/mode/meta'; // 提供所有模式的元信息, 可使用findModeByName、findModeByExtension、findModeByFileName
import _ from 'lodash';
import { TVariables } from '.';

/**
 * 在虚拟桌面中动态引入js、css，首次渲染会发生样式错乱
 * 故需要提前引入主题和模式
 */
export const importModes = (modes: string[]) => {
  _.forEach(modes, item => {
    const mode = CodeMirror.findModeByName(item);
    try {
      if (mode?.mode) {
        import(`codemirror/mode/${mode.mode}/${mode.mode}.js`);
      }
    } catch {
      //
    }
  });
};
export const importThemes = (themes: string[]) => {
  _.forEach(themes, theme => {
    try {
      if (theme !== 'default') {
        import(`codemirror/theme/${theme}.css`);
      }
    } catch (error) {
      //
    }
  });
};

export const uniquePromptId = () => _.uniqueId('prompt');

/**
 * 获取变量的位置信息
 * @param text 文本
 * @param variables 变量数组, 若不传, 则返回类似变量的位置信息
 */
export const getVariablesPosition = (text: string, variables?: TVariables) => {
  if (!text) return [];
  const positions: any[] = [];
  const variablesObj = _.keyBy(variables, 'var_name');
  const isGetLikeVar = !variables;
  text.split('\n').forEach((lineText, index) => {
    lineText.replace(/{{(.*?)}}/g, (matchText, $1, startIndex) => {
      // 去掉空格再判断, 比如{{ text }}、{{text}}都是匹配的
      const matchVar = $1.trim();
      // 不能包含中文
      if (/[\u4e00-\u9fa5]/.test(matchVar)) return matchText;
      // 限制长度
      if (matchVar.length > 50) return matchText;

      if (matchVar && (isGetLikeVar || variablesObj[matchVar])) {
        positions.push({
          id: variablesObj[matchVar]?.id,
          from: { line: index, ch: startIndex }, // 起始索引
          to: { line: index, ch: startIndex + matchText.length }, // 终点索引
          match: matchVar, // 匹配到的匹配到的变量
          value: matchText // 原始文本
        });
      }
      return matchText;
    });
  });
  return positions;
};

/**
 * 获取标记的变量内容, 不考虑跨行的情况
 * @param mark 编辑器 MarkerRange 实例
 */
export const getMarkVar = (mark: any) => {
  const lineText = mark.lines?.[0]?.text || '';
  const { from, to }: any = mark.find();
  const markText = lineText
    .slice(from.ch, to.ch)
    .replace(/{{(.*?)}}/g, (__: string, $1: string) => $1)
    .trim();
  return markText;
};
