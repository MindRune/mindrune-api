"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const http_errors_1 = __importDefault(require("http-errors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./utils/logger"));
const auth0_1 = __importDefault(require("./config/auth0"));
const auth_middleware_1 = __importDefault(require("./middlewares/auth.middleware"));
const passport_1 = __importDefault(require("passport"));
// Initialize Auth0 clients
auth0_1.default.initClients();
auth_middleware_1.default.initializePassport();
// Import routes
const osrs_1 = __importDefault(require("./routes/osrs"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const img_1 = __importDefault(require("./routes/img"));
// Load environment variables
dotenv_1.default.config();
// Initialize app
const app = (0, express_1.default)();
// Middleware setup
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use(express_1.default.static(path_1.default.join(__dirname, '../node_modules')));
app.use('/dkg', express_1.default.static(path_1.default.join(__dirname, '../node_modules/dkg.js')));
app.use('/util', express_1.default.static(path_1.default.join(__dirname, '../public/util')));
app.use(body_parser_1.default.json({ limit: '50mb', extended: true }));
app.use(body_parser_1.default.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(body_parser_1.default.text({ limit: '200mb' }));
app.use((0, cors_1.default)());
app.use(passport_1.default.initialize());
// OpenAPI/Swagger Documentation
const swaggerDocument = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, 'docs/swagger.json'), 'utf8'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
// Routes
app.use('/osrs', osrs_1.default);
app.use('/auth', auth_1.default);
app.use('/user', user_1.default);
app.use('/img', img_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
// Error handler
app.use((err, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // Log error
    logger_1.default.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    // Send error response
    res.status(err.status || 500);
    res.json({
        success: false,
        msg: err.message || 'Invalid Path.',
        error: req.app.get('env') === 'development' ? err : undefined,
    });
});
exports.default = app;
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger_1.default.info(`Server running on port ${PORT}`, { service: 'mindrune-api' });
    });
}
//# sourceMappingURL=app.js.map