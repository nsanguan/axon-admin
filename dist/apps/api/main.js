/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(7);
const throttler_1 = __webpack_require__(8);
const core_1 = __webpack_require__(3);
const app_controller_1 = __webpack_require__(9);
const app_service_1 = __webpack_require__(10);
const prisma_module_1 = __webpack_require__(14);
const auth_module_1 = __webpack_require__(17);
const users_module_1 = __webpack_require__(29);
const dashboard_module_1 = __webpack_require__(30);
const jwt_auth_guard_1 = __webpack_require__(12);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: parseInt(process.env.THROTTLE_TTL_MS || '60000'),
                    limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const app_service_1 = __webpack_require__(10);
const public_decorator_1 = __webpack_require__(11);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getData() {
        return this.appService.getData();
    }
    health() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
};
exports.AppController = AppController;
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Root endpoint' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], AppController.prototype, "getData", null);
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
exports.AppController = AppController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
let AppService = class AppService {
    getData() {
        return { message: 'Hello API' };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], AppService);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Public = void 0;
const common_1 = __webpack_require__(2);
const jwt_auth_guard_1 = __webpack_require__(12);
const Public = () => (0, common_1.SetMetadata)(jwt_auth_guard_1.IS_PUBLIC_KEY, true);
exports.Public = Public;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = exports.IS_PUBLIC_KEY = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const passport_1 = __webpack_require__(13);
const core_1 = __webpack_require__(3);
exports.IS_PUBLIC_KEY = 'isPublic';
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        return super.canActivate(context);
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], JwtAuthGuard);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let PrismaModule = class PrismaModule {
};
exports.PrismaModule = PrismaModule;
exports.PrismaModule = PrismaModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaModule);


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const client_1 = __webpack_require__(16);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], PrismaService);


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(18);
const passport_1 = __webpack_require__(13);
const config_1 = __webpack_require__(7);
const auth_service_1 = __webpack_require__(19);
const auth_controller_1 = __webpack_require__(23);
const jwt_strategy_1 = __webpack_require__(27);
const users_module_1 = __webpack_require__(29);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET', 'default_secret'),
                    signOptions: { expiresIn: '15m' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);


/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(18);
const config_1 = __webpack_require__(7);
const bcrypt = tslib_1.__importStar(__webpack_require__(20));
const uuid_1 = __webpack_require__(21);
const users_service_1 = __webpack_require__(22);
const prisma_service_1 = __webpack_require__(15);
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.passwordHash)
            return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            return null;
        return user;
    }
    async login(dto, ip, userAgent) {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Account is disabled');
        const tokens = await this.generateTokens(user.id, user.email);
        // Store session
        const tokenHash = await bcrypt.hash(tokens.accessToken, 4);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                tokenHash,
                ip: ip ?? null,
                userAgent: userAgent ?? null,
                expiresAt,
            },
        });
        // Store refresh token hash
        const refreshHash = await bcrypt.hash(tokens.refreshToken, 4);
        const refreshExpires = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshHash,
                expiresAt: refreshExpires,
            },
        });
        return { ...tokens, user: this.usersService.sanitize(user) };
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const user = await this.usersService.createUser(dto);
        const tokens = await this.generateTokens(user.id, user.email);
        return { ...tokens, user: this.usersService.sanitize(user) };
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.isActive)
                throw new common_1.UnauthorizedException();
            return this.generateTokens(user.id, user.email);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    generateTokens(userId, email) {
        const payload = { sub: userId, email, jti: (0, uuid_1.v4)() };
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', 'refresh_default');
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: refreshSecret,
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object, typeof (_b = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _d : Object])
], AuthService);


/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
const bcrypt = tslib_1.__importStar(__webpack_require__(20));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async createUser(data) {
        const passwordHash = await bcrypt.hash(data.password, 12);
        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash,
                isVerified: true,
            },
        });
    }
    sanitize(user) {
        const { passwordHash, mfaSecret, ...rest } = user;
        return rest;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UsersService);


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const express_1 = __webpack_require__(24);
const auth_service_1 = __webpack_require__(19);
const auth_dto_1 = __webpack_require__(25);
const public_decorator_1 = __webpack_require__(11);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, req) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.authService.login(dto, ip, userAgent);
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    me(req) {
        return req.user;
    }
};
exports.AuthController = AuthController;
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email + password' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof auth_dto_1.LoginDto !== "undefined" && auth_dto_1.LoginDto) === "function" ? _b : Object, typeof (_c = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register new admin user' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof auth_dto_1.RegisterDto !== "undefined" && auth_dto_1.RegisterDto) === "function" ? _d : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof auth_dto_1.RefreshTokenDto !== "undefined" && auth_dto_1.RefreshTokenDto) === "function" ? _e : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
tslib_1.__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user info' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Current authenticated user' }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthController);


/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RefreshTokenDto = exports.RegisterDto = exports.LoginDto = void 0;
const tslib_1 = __webpack_require__(1);
const class_validator_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(4);
class LoginDto {
}
exports.LoginDto = LoginDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@axon.local' }),
    (0, class_validator_1.IsEmail)(),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@axon.local' }),
    (0, class_validator_1.IsEmail)(),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Admin User' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);


/***/ }),
/* 26 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const passport_1 = __webpack_require__(13);
const passport_jwt_1 = __webpack_require__(28);
const config_1 = __webpack_require__(7);
const users_service_1 = __webpack_require__(22);
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    constructor(configService, usersService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', 'default_secret'),
        });
        this.configService = configService;
        this.usersService = usersService;
    }
    async validate(payload) {
        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException();
        }
        return this.usersService.sanitize(user);
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _b : Object])
], JwtStrategy);


/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("passport-jwt");

/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const users_service_1 = __webpack_require__(22);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DashboardModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const dashboard_service_1 = __webpack_require__(31);
const dashboard_controller_1 = __webpack_require__(32);
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [dashboard_service_1.DashboardService],
        controllers: [dashboard_controller_1.DashboardController],
    })
], DashboardModule);


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DashboardService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMetrics() {
        const [pluginCount, toolCount, totalExecutions, failedExecutions, systemLogErrors, activeUsers,] = await Promise.all([
            this.prisma.plugin.count({ where: { deletedAt: null, status: 'active' } }),
            this.prisma.tool.count({ where: { deletedAt: null } }),
            this.prisma.toolExecutionLog.count(),
            this.prisma.toolExecutionLog.count({ where: { status: 'error' } }),
            this.prisma.systemLog.count({ where: { level: 'ERROR' } }),
            this.prisma.user.count({ where: { isActive: true } }),
        ]);
        const errorRate = totalExecutions > 0
            ? Math.round((failedExecutions / totalExecutions) * 100 * 10) / 10
            : 0;
        return {
            plugins: { active: pluginCount },
            tools: { total: toolCount },
            requests: { total: totalExecutions, failed: failedExecutions, errorRate },
            system: { errors: systemLogErrors },
            users: { active: activeUsers },
            updatedAt: new Date().toISOString(),
        };
    }
    async getDailyUsage(days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const logs = await this.prisma.toolExecutionLog.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true, status: true },
        });
        const map = {};
        for (const log of logs) {
            const day = log.createdAt.toISOString().slice(0, 10);
            if (!map[day])
                map[day] = { date: day, total: 0, errors: 0 };
            map[day].total++;
            if (log.status === 'error')
                map[day].errors++;
        }
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], DashboardService);


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DashboardController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const dashboard_service_1 = __webpack_require__(31);
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getMetrics() {
        return this.dashboardService.getMetrics();
    }
    getDailyUsage(days) {
        return this.dashboardService.getDailyUsage(days ? parseInt(days) : 7);
    }
};
exports.DashboardController = DashboardController;
tslib_1.__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get KPI metrics for dashboard widgets' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], DashboardController.prototype, "getMetrics", null);
tslib_1.__decorate([
    (0, common_1.Get)('daily-usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily usage chart data' }),
    tslib_1.__param(0, (0, common_1.Query)('days')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], DashboardController.prototype, "getDailyUsage", null);
exports.DashboardController = DashboardController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('dashboard'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof dashboard_service_1.DashboardService !== "undefined" && dashboard_service_1.DashboardService) === "function" ? _a : Object])
], DashboardController);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(4);
const helmet_1 = tslib_1.__importDefault(__webpack_require__(5));
const app_module_1 = __webpack_require__(6);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Security headers
    app.use((0, helmet_1.default)());
    // CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    // Global prefix
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Swagger
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AXON Admin API')
        .setDescription('AXON Admin control plane REST API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.API_PORT || process.env.PORT || 3001;
    await app.listen(port);
    common_1.Logger.log(`Application running on: http://localhost:${port}/${globalPrefix}`);
    common_1.Logger.log(`Swagger docs:           http://localhost:${port}/${globalPrefix}/docs`);
}
bootstrap();

})();

/******/ })()
;
//# sourceMappingURL=main.js.map