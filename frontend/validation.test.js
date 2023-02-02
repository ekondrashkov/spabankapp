/* eslint-disable no-undef */
import {
  loginPassCheck,
  transferCountCheck,
  transferSumCheck,
} from './src/validation';

describe('Login / pass validation function (loginPassCheck)', () => {
  test('Should throw error when less than 6 symbols', () => {
    expect(loginPassCheck('1234')).toBe(false);
  });

  test('Should be ok when more or equal than 6 symbols', () => {
    expect(loginPassCheck('1234567')).toBe(true);
  });
});

describe('Money transfer function (transferCountCheck)', () => {
  test('Should throw error when less than 16 symbols', () => {
    expect(transferCountCheck('123456789')).toBe(false);
  });

  test('Should throw error when string contains letters or symbols besides numbers', () => {
    expect(transferCountCheck('123456789a234567')).toBe(false);
  });

  test('Should be ok when more or equal than 16 numbers', () => {
    expect(transferCountCheck('1234567891234567')).toBe(true);
  });
});

describe('Currency change function (transferSumCheck)', () => {
  test('Should throw error when the sum is negative', () => {
    expect(transferSumCheck('-1000')).toBe(false);
  });

  test('Should throw error when the sum field contains letters or symbols besides numbers and .', () => {
    expect(transferSumCheck('summ')).toBe(false);
  });

  test('Should throw error when the sum field begins with dot', () => {
    expect(transferSumCheck('.1000')).toBe(false);
  });

  test('Should throw error when the sum field contains 2 or more dots', () => {
    expect(transferSumCheck('100..00')).toBe(false);
  });

  test('Should be ok when sum is positive', () => {
    expect(transferSumCheck('100.0')).toBe(true);
  });
});
