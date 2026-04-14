// Manual mock для src/db.js
// Jest подхватывает его автоматически при jest.mock('../src/db') или jest.mock('./db')

const makeStmt = () => ({
  all: jest.fn().mockReturnValue([]),
  get: jest.fn().mockReturnValue(undefined),
  run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
});

const stmts = {};

const db = {
  _stmts: stmts,

  prepare: jest.fn((sql) => {
    if (!stmts[sql]) stmts[sql] = makeStmt();
    return stmts[sql];
  }),

  // transaction(fn) возвращает функцию-обёртку — по умолчанию просто вызывает fn
  transaction: jest.fn((fn) => fn),

  exec: jest.fn(),
  pragma: jest.fn(),

  _reset() {
    Object.keys(stmts).forEach(k => delete stmts[k]);
    db.prepare.mockClear();
    db.transaction.mockClear();
    db.exec.mockClear();
  },
};

module.exports = db;
