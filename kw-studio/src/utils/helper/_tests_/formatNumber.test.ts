import { isNumberAndParseInt, formatFileSize, formatNumberWithComma, formatNumberWithSuffix } from '../formatNumber';

describe('formatNumber', () => {
  test('isNumberAndParseInt', () => {
    expect(isNumberAndParseInt(13)).toBe(13);
    expect(isNumberAndParseInt('13')).toBe(13);
    expect(isNumberAndParseInt('13xx')).toBe(13);
    expect(isNumberAndParseInt('xx13')).toBe(0);
  });

  test('formatFileSize', () => {
    expect(formatFileSize(0)).toBe('-');
    expect(formatFileSize(128)).toBe('128 B');
    expect(formatFileSize(128128)).toBe('125 KB');
    expect(formatFileSize(128128128)).toBe('122 MB');
    expect(formatFileSize(128128128128)).toBe('119 GB');
  });

  test('formatNumberWithComma', () => {
    expect(formatNumberWithComma(128)).toBe('128');
    expect(formatNumberWithComma(128128)).toBe('128,128');
    expect(formatNumberWithComma(128128128)).toBe('128,128,128');
  });

  test('formatNumberWithSuffix', () => {
    expect(formatNumberWithSuffix(128)).toBe('128');
    expect(formatNumberWithSuffix(8211)).toBe('8千');
    expect(formatNumberWithSuffix(128128)).toBe('13万');
    expect(formatNumberWithSuffix(28128128)).toBe('3千万');
    expect(formatNumberWithSuffix(128128128)).toBe('1亿');
    expect(formatNumberWithSuffix(100000000030)).toBe('1千亿');
    expect(formatNumberWithSuffix(1000000000020)).toBe('1兆');
  });
});
