module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/public/js/utils/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(@exodus/bytes|whatwg-encoding)/)'
    ]
};
