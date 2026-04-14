// Подставляем переменные окружения для тестов
process.env.JWT_SECRET = 'test_jwt_secret_for_tests_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '5001';
