import { renderHook, act } from '@testing-library/react-hooks';
import { useForm } from './index';

const init = (field, option = {}) => renderHook(() => useForm(field, option));

const requireMsg = '不能为空';
const whitespaceMsg = '不能有空格';
const funcMsg = '自定义校验函数';
const minMsg = '至少4字符';
const maxMsg = '至多6字符';
const patternMsg = '仅支持数字';

describe('useForm', () => {
  const field = ['username', 'password'];
  const defaultField = { username: '默认用户' };
  const rules = {
    username: [
      {
        required: true,
        message: requireMsg
      },
      {
        whitespace: true,
        message: whitespaceMsg
      },
      {
        validator: value => {
          if (value === funcMsg) {
            throw new Error(funcMsg);
          }
        }
      }
    ],
    password: [
      {
        min: 4,
        message: minMsg
      },
      {
        max: 6,
        message: maxMsg
      },
      {
        pattern: /\d/,
        message: patternMsg
      }
    ]
  };

  const getValues = result => result.current[0];
  const getErrors = result => result.current[1];

  it('should init field', () => {
    const [values] = init(field).result.current;
    const param = { test: '使用函数初始化' };
    const funcWrapper = () => param;

    expect(Object.keys(values)).toEqual(field);
    expect(init(funcWrapper).result.current[0]).toEqual(param);
  });

  it('should init defauldField', () => {
    const [values] = init(field, { defaultField }).result.current;

    expect(values.username).toBe(defaultField.username);
  });

  it('should setFields', () => {
    const { result } = init(field);
    const user = '用户名';
    const pw = '密码';

    act(() => {
      // 非法传参
      result.current[2].setFields(null, false);
    });

    expect(getValues(result).username).toBeFalsy();

    act(() => {
      result.current[2].setFields({ username: user, password: pw }, false);
    });

    const [values] = result.current;

    expect(values.username).toBe(user);
    expect(values.password).toBe(pw);
  });

  it('should setFieldsErr', () => {
    const { result } = init(field);
    const msg = '密码错误';

    act(() => {
      // 非法传参
      result.current[2].setFieldsErr(null);
    });

    expect(getErrors(result).password).toBeFalsy();

    act(() => {
      result.current[2].setFieldsErr({ password: msg });
    });

    const [, errors] = result.current;

    expect(errors.password).toBe(msg);
  });

  it('should trigger validateFields', () => {
    const { result } = init(field, { rules });
    const setFields = newField => result.current[2].setFields(newField);

    act(() => {
      setFields({ username: '' });
    });
    expect(getErrors(result).username).toBe(requireMsg);

    act(() => {
      setFields({ username: '    ' });
    });
    expect(getErrors(result).username).toBe(whitespaceMsg);

    act(() => {
      setFields({ username: funcMsg });
    });
    expect(getErrors(result).username).toBe(funcMsg);

    act(() => {
      setFields({ password: '123' });
    });
    expect(getErrors(result).password).toBe(minMsg);

    act(() => {
      setFields({ password: '1234567' });
    });
    expect(getErrors(result).password).toBe(maxMsg);

    act(() => {
      setFields({ password: '输入非数字' });
    });
    expect(getErrors(result).password).toBe(patternMsg);
  });

  it('should onSubmit', () => {
    const success = { username: '正常', password: '123456' };
    const fail = { username: funcMsg, password: '123' };
    const { result } = init(field, { rules, defaultField: { ...success } });

    act(() => {
      result.current[2].onSubmit();
    });

    expect(getValues(result)).toEqual(success);
    expect(getErrors(result).username).toBeFalsy();
    expect(getErrors(result).password).toBeFalsy();

    act(() => {
      result.current[2].setFields({ ...fail });
    });

    act(() => {
      result.current[2].onSubmit().catch(err => {
        expect(err.username).toBe(funcMsg);
        expect(err.password).toBe(minMsg);
      });
    });
  });
});
