import _ from 'lodash';
import { Pos, ParamItem, FormatRule } from './type';

/**
 * 生成唯一id
 */
export const uniqueParamId = () => _.uniqueId('param');

/**
 * 处理初始的参数
 */
export const paramPolyfill = (params: ParamItem[]) => {
  const timestamp = +new Date();

  return _.map(params, (item, index) => {
    if (!item._id) {
      item._id = uniqueParamId();
    }

    if (item.position?.length === 3 && _.every(item.position, p => _.isNumber(p))) {
      item.position = [{ example: item.example, pos: item.position }];
    }

    if (!item.param_type) {
      item.param_type = 'string';
    }

    if (item.param_type === '实体类') {
      item.param_type = 'entity';
    }

    if (!item.example) {
      item.example = item.position![item.position!.length - 1].example;
    }

    if (!item._order) {
      item._order = timestamp + index;
    }

    return item;
  });
};

/**
 * 判断删除的文本中是否包含标签
 * @param value 删除的文本
 */
export const isDeleteParam = (value: string) => /\${.*?}/.test(value);

/**
 * 逆向选择时交换起点终点
 * @param start
 * @param end
 */
export const swapPos = (start: Pos, end: Pos) => {
  if (start.line > end.line || start.ch > end.ch) {
    return [end, start];
  }
  return [start, end];
};

/**
 * 判断是否是多条语句, 分号(;)分割, 分号后可跟空格
 */
export const isSingleStatement = (text: string) => {
  const textArr = text.split(';');
  if (textArr.length > 2 || textArr.slice(1).join('').trim().length) {
    return false;
  }
  return true;
};

/**
 * 将语句和参数格式化成编辑器的数据
 * @param statements 函数语句
 * @param params 参数列表
 * @param format 替换的规则
 */
export const formatToEditor = (statements: string[] | string, params: ParamItem[], format?: FormatRule) => {
  const paramsResult: any[] = [];
  const statementsResult = Array.isArray(statements) ? [...statements] : _.split(statements, '\n');

  const lineInfo = _.reduce(
    params,
    (res, item) => {
      if (!item.position) return res;
      _.forEach(item.position, p => {
        const [line, ...pos] = p.pos;
        if (res[line]) {
          res[line].pos.push(...pos);
          res[line].map[`${pos[0]}-${pos[1]}`] = item;
        } else {
          res[line] = {
            pos,
            map: { [`${pos[0]}-${pos[1]}`]: item }
          };
        }
      });
      return res;
    },
    {} as any
  );

  _.forEach(_.entries(lineInfo), ([line, item]: any) => {
    const text = statementsResult[line];
    if (!text) return;

    const textObj = splitText(text, item.pos);
    const replacedTextCache: any = {};
    _.forEach(_.entries(item.map), ([posKey, paramItem]: any) => {
      replacedTextCache[posKey] = textObj[posKey];
      textObj[posKey] = format ? format(paramItem) : `\${${paramItem.name}}`;
    });

    let resText = '';
    _.forEach(_.entries(textObj), ([posKey, str]: any) => {
      if (item.map[posKey]) {
        paramsResult.push({
          ...item.map[posKey],
          _text: replacedTextCache[posKey],
          from: { line: Number(line), ch: resText.length },
          to: { line: Number(line), ch: resText.length + str.length }
        });
      }
      resText += str;
    });
    statementsResult[line] = resText;
  });

  return [statementsResult, paramsResult];
};

/**
 * 按索引序列分割字符, ('abcde', [1, 2]) ===> { '0-1': 'a', '1-2': 'b', '2-4': 'cde' }
 * @param text 文本字符
 * @param pos 连续的字符索引
 */
const splitText = (text: string, pos: number[]) => {
  const sortedPos = _.sortBy(pos);
  const res: Record<string, string> = {};
  _.forEach(sortedPos, (p, i) => {
    const start = p;
    let end = sortedPos[i + 1];

    if (i === 0 && start) {
      res[`0-${start}`] = text.slice(0, start);
    }

    if (i === sortedPos.length - 1) {
      if (p < text.length) {
        end = text.length;
        res[`${start}-${end}`] = text.slice(start, end);
      }
    } else {
      res[`${start}-${end}`] = text.slice(start, end);
    }
  });
  return res;
};

/**
 * 解析编辑器内容, 返回原始代码语句与参数坐标
 * @param editor
 */
export const decodeEditorText = (editor: any) => {
  const paramsObj: Record<string, any> = {};
  const statementsResult: string[] = [];
  const lineCount = editor.lineCount();

  _({ length: lineCount }).forEach((v, index) => {
    const line: any = editor.getLineHandle(index);
    const { text, markedSpans } = line;
    const paramMarks = _.filter(markedSpans, span => span.marker.attributes?._type === 'param');
    if (!paramMarks.length) return statementsResult.push(text);
    const lineInfo = _.reduce(
      paramMarks,
      (res: any, item: any) => {
        const { from, to, marker } = item;
        res.pos.push(from, to);
        res.map[`${from}-${to}`] = _.pick(marker.attributes, '_id', '_text');
        return res;
      },
      { map: {}, pos: [] } as any
    );
    const textObj = splitText(text, lineInfo.pos);
    _.forEach(_.entries(lineInfo.map), ([posKey, paramItem]: any) => {
      textObj[posKey] = paramItem._text;
    });

    let resText = '';
    _.forEach(_.entries(textObj), ([posKey, str]: any) => {
      if (lineInfo.map[posKey]) {
        const { _id, _text } = lineInfo.map[posKey];
        if (paramsObj[_id]) {
          paramsObj[_id].position.push({ example: _text, pos: [index, resText.length, resText.length + str.length] });
        } else {
          paramsObj[_id] = {
            _id,
            position: [{ example: _text, pos: [index, resText.length, resText.length + str.length] }]
          };
        }
      }
      resText += str;
    });
    statementsResult.push(resText);
  });

  const statements = statementsResult.length === 1 && !statementsResult[0] ? [] : statementsResult;
  return [statements, _.values(paramsObj)];
};

/**
 * 更新参数位置, 并返回保存到后端的字段
 * @param oldData 旧数据
 * @param newData 新数据
 */
export const updatePosition = (oldData: any[], newData: any[]) => {
  const map = _.keyBy(newData, '_id');
  return _.map(oldData, item => {
    if (map[item._id]) {
      item.position = map[item._id].position;
      item.position.sort((a: any, b: any) => (b.example === item.example ? -1 : 0));
    }
    return _.pick(item, 'name', 'alias', 'description', 'position', 'param_type', 'options');
  });
};
