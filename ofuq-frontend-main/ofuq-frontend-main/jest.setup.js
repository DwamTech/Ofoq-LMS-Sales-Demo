// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
if (!global.structuredClone)
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
