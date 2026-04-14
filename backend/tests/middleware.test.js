const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('../src/middleware/auth');

const mockReq = (token) => ({
  headers: { authorization: token ? `Bearer ${token}` : undefined },
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

describe('Middleware: authenticate', () => {
  beforeEach(() => jest.clearAllMocks());

  test('пропускает запрос с валидным токеном', () => {
    const token = jwt.sign({ id: 1, role: 'user' }, process.env.JWT_SECRET);
    const req = mockReq(token);
    const res = mockRes();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, role: 'user' });
  });

  test('возвращает 401 при отсутствии токена', () => {
    const req = mockReq(null);
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('возвращает 401 при невалидном токене', () => {
    const req = mockReq('invalid.token.here');
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('возвращает 401 при истёкшем токене', () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '0s' });
    const req = mockReq(token);
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Middleware: requireAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('пропускает запрос от admin', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('возвращает 403 для обычного пользователя', () => {
    const req = { user: { id: 2, role: 'user' } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });
});
