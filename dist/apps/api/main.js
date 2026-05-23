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
const plugins_module_1 = __webpack_require__(33);
const tools_module_1 = __webpack_require__(37);
const testing_module_1 = __webpack_require__(41);
const tokens_module_1 = __webpack_require__(45);
const logs_module_1 = __webpack_require__(50);
const notifications_module_1 = __webpack_require__(53);
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
            plugins_module_1.PluginsModule,
            tools_module_1.ToolsModule,
            testing_module_1.TestingModule,
            tokens_module_1.TokensModule,
            logs_module_1.LogsModule,
            notifications_module_1.NotificationsModule,
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


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginsModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const plugins_service_1 = __webpack_require__(34);
const plugins_controller_1 = __webpack_require__(35);
let PluginsModule = class PluginsModule {
};
exports.PluginsModule = PluginsModule;
exports.PluginsModule = PluginsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [plugins_service_1.PluginsService],
        controllers: [plugins_controller_1.PluginsController],
        exports: [plugins_service_1.PluginsService],
    })
], PluginsModule);


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginsService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let PluginsService = class PluginsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '20');
        const skip = (page - 1) * pageSize;
        const where = { deletedAt: null };
        if (query.status)
            where['status'] = query.status;
        if (query.groupId)
            where['groupId'] = query.groupId;
        if (query.search) {
            where['OR'] = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { endpoint: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.plugin.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { group: true, pluginTagMaps: { include: { tag: true } } },
            }),
            this.prisma.plugin.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async findOne(id) {
        const plugin = await this.prisma.plugin.findFirst({
            where: { id, deletedAt: null },
            include: {
                group: true,
                pluginTagMaps: { include: { tag: true } },
                envVars: { select: { id: true, key: true, isSecret: true } },
            },
        });
        if (!plugin)
            throw new common_1.NotFoundException('Plugin not found');
        return plugin;
    }
    async create(dto, userId) {
        return this.prisma.plugin.create({
            data: {
                ...dto,
                createdBy: userId,
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.plugin.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.plugin.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'inactive' },
        });
        return { success: true };
    }
    async checkHealth(id) {
        const plugin = await this.findOne(id);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${plugin.endpoint}/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const status = res.ok ? 'healthy' : 'degraded';
            await this.prisma.plugin.update({
                where: { id },
                data: { healthStatus: status },
            });
            return { status, statusCode: res.status };
        }
        catch {
            await this.prisma.plugin.update({
                where: { id },
                data: { healthStatus: 'unreachable' },
            });
            return { status: 'unreachable' };
        }
    }
};
exports.PluginsService = PluginsService;
exports.PluginsService = PluginsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PluginsService);


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginsController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const plugins_service_1 = __webpack_require__(34);
const plugins_dto_1 = __webpack_require__(36);
let PluginsController = class PluginsController {
    constructor(pluginsService) {
        this.pluginsService = pluginsService;
    }
    findAll(query) {
        return this.pluginsService.findAll(query);
    }
    findOne(id) {
        return this.pluginsService.findOne(id);
    }
    create(dto, req) {
        return this.pluginsService.create(dto, req.user?.id);
    }
    update(id, dto) {
        return this.pluginsService.update(id, dto);
    }
    remove(id) {
        return this.pluginsService.remove(id);
    }
    checkHealth(id) {
        return this.pluginsService.checkHealth(id);
    }
};
exports.PluginsController = PluginsController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all plugins with pagination and filtering' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof plugins_dto_1.PluginQueryDto !== "undefined" && plugins_dto_1.PluginQueryDto) === "function" ? _b : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "findAll", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plugin by ID' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "findOne", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new plugin' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof plugins_dto_1.CreatePluginDto !== "undefined" && plugins_dto_1.CreatePluginDto) === "function" ? _c : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a plugin' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_e = typeof plugins_dto_1.UpdatePluginDto !== "undefined" && plugins_dto_1.UpdatePluginDto) === "function" ? _e : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a plugin' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check plugin MCP health endpoint' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PluginsController.prototype, "checkHealth", null);
exports.PluginsController = PluginsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Plugins'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('plugins'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof plugins_service_1.PluginsService !== "undefined" && plugins_service_1.PluginsService) === "function" ? _a : Object])
], PluginsController);


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginQueryDto = exports.UpdatePluginDto = exports.CreatePluginDto = void 0;
const tslib_1 = __webpack_require__(1);
const class_validator_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(4);
class CreatePluginDto {
}
exports.CreatePluginDto = CreatePluginDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Weather Plugin' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "description", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://weather-mcp.example.com' }),
    (0, class_validator_1.IsUrl)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "endpoint", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['none', 'api_key', 'bearer', 'basic'], default: 'none' }),
    (0, class_validator_1.IsIn)(['none', 'api_key', 'bearer', 'basic']),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "authMethod", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "apiKeyEncrypted", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON string of custom headers' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "headersJson", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 30000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(300000),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Number)
], CreatePluginDto.prototype, "timeoutMs", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "retryPolicyJson", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreatePluginDto.prototype, "groupId", void 0);
class UpdatePluginDto extends (0, swagger_1.PartialType)(CreatePluginDto) {
}
exports.UpdatePluginDto = UpdatePluginDto;
class PluginQueryDto {
}
exports.PluginQueryDto = PluginQueryDto;
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], PluginQueryDto.prototype, "search", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['active', 'inactive', 'error'] }),
    (0, class_validator_1.IsIn)(['active', 'inactive', 'error']),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], PluginQueryDto.prototype, "status", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], PluginQueryDto.prototype, "groupId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '1' }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], PluginQueryDto.prototype, "page", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '20' }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], PluginQueryDto.prototype, "pageSize", void 0);


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ToolsModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const tools_service_1 = __webpack_require__(38);
const tools_controller_1 = __webpack_require__(39);
let ToolsModule = class ToolsModule {
};
exports.ToolsModule = ToolsModule;
exports.ToolsModule = ToolsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [tools_service_1.ToolsService],
        controllers: [tools_controller_1.ToolsController],
        exports: [tools_service_1.ToolsService],
    })
], ToolsModule);


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ToolsService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let ToolsService = class ToolsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '20');
        const skip = (page - 1) * pageSize;
        const where = { deletedAt: null };
        if (query.categoryId)
            where['categoryId'] = query.categoryId;
        if (query.pluginId)
            where['pluginId'] = query.pluginId;
        if (query.search) {
            where['OR'] = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.tool.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { category: true, plugin: { select: { id: true, name: true, endpoint: true } } },
            }),
            this.prisma.tool.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async findOne(id) {
        const tool = await this.prisma.tool.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: true,
                plugin: true,
                versions: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!tool)
            throw new common_1.NotFoundException('Tool not found');
        return tool;
    }
    async create(dto, userId) {
        return this.prisma.tool.create({
            data: { ...dto, createdBy: userId },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.tool.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.tool.update({ where: { id }, data: { deletedAt: new Date() } });
        return { success: true };
    }
    async execute(id, inputJson, userId) {
        const tool = await this.findOne(id);
        const start = Date.now();
        let status = 'success';
        let outputJson = null;
        let errorMessage;
        try {
            if (!tool.plugin)
                throw new Error('Tool has no associated plugin');
            const res = await fetch(`${tool.plugin.endpoint}/tools/${tool.name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputJson),
                signal: AbortSignal.timeout(tool.plugin.timeoutMs),
            });
            outputJson = await res.json();
            if (!res.ok)
                status = 'error';
        }
        catch (err) {
            status = 'error';
            errorMessage = err instanceof Error ? err.message : String(err);
        }
        const durationMs = Date.now() - start;
        await this.prisma.toolExecutionLog.create({
            data: {
                toolId: id,
                userId,
                inputJson: JSON.stringify(inputJson),
                outputJson: outputJson ? JSON.stringify(outputJson) : null,
                status,
                durationMs,
                errorMessage,
            },
        });
        return { status, outputJson, durationMs, errorMessage };
    }
    async getCategories() {
        return this.prisma.toolCategory.findMany({ orderBy: { name: 'asc' } });
    }
};
exports.ToolsService = ToolsService;
exports.ToolsService = ToolsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ToolsService);


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ToolsController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const tools_service_1 = __webpack_require__(38);
const tools_dto_1 = __webpack_require__(40);
let ToolsController = class ToolsController {
    constructor(toolsService) {
        this.toolsService = toolsService;
    }
    findAll(query) {
        return this.toolsService.findAll(query);
    }
    getCategories() {
        return this.toolsService.getCategories();
    }
    findOne(id) {
        return this.toolsService.findOne(id);
    }
    create(dto, req) {
        return this.toolsService.create(dto, req.user?.id);
    }
    update(id, dto) {
        return this.toolsService.update(id, dto);
    }
    remove(id) {
        return this.toolsService.remove(id);
    }
    execute(id, dto, req) {
        return this.toolsService.execute(id, dto.inputJson, req.user?.id);
    }
};
exports.ToolsController = ToolsController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all tools' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof tools_dto_1.ToolQueryDto !== "undefined" && tools_dto_1.ToolQueryDto) === "function" ? _b : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "findAll", null);
tslib_1.__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tool categories' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "getCategories", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tool by ID' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "findOne", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tool' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof tools_dto_1.CreateToolDto !== "undefined" && tools_dto_1.CreateToolDto) === "function" ? _c : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a tool' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_e = typeof tools_dto_1.UpdateToolDto !== "undefined" && tools_dto_1.UpdateToolDto) === "function" ? _e : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a tool' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a tool and capture the execution log' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__param(2, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_f = typeof tools_dto_1.ExecuteToolDto !== "undefined" && tools_dto_1.ExecuteToolDto) === "function" ? _f : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ToolsController.prototype, "execute", null);
exports.ToolsController = ToolsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Tools'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tools'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof tools_service_1.ToolsService !== "undefined" && tools_service_1.ToolsService) === "function" ? _a : Object])
], ToolsController);


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExecuteToolDto = exports.ToolQueryDto = exports.UpdateToolDto = exports.CreateToolDto = void 0;
const tslib_1 = __webpack_require__(1);
const class_validator_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(4);
class CreateToolDto {
}
exports.CreateToolDto = CreateToolDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Get Weather' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "description", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "categoryId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "pluginId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON Schema for input' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "inputSchemaJson", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON Schema for output' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateToolDto.prototype, "outputSchemaJson", void 0);
class UpdateToolDto extends (0, swagger_1.PartialType)(CreateToolDto) {
}
exports.UpdateToolDto = UpdateToolDto;
class ToolQueryDto {
}
exports.ToolQueryDto = ToolQueryDto;
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ToolQueryDto.prototype, "search", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ToolQueryDto.prototype, "categoryId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ToolQueryDto.prototype, "pluginId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ToolQueryDto.prototype, "page", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ToolQueryDto.prototype, "pageSize", void 0);
class ExecuteToolDto {
}
exports.ExecuteToolDto = ExecuteToolDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Input payload matching the tool input schema' }),
    tslib_1.__metadata("design:type", Object)
], ExecuteToolDto.prototype, "inputJson", void 0);


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestingModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const testing_service_1 = __webpack_require__(42);
const testing_controller_1 = __webpack_require__(43);
let TestingModule = class TestingModule {
};
exports.TestingModule = TestingModule;
exports.TestingModule = TestingModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [testing_service_1.TestingService],
        controllers: [testing_controller_1.TestingController],
    })
], TestingModule);


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestingService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let TestingService = class TestingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllCollections() {
        return this.prisma.testCollection.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { requests: true } } },
        });
    }
    async createCollection(dto, userId) {
        return this.prisma.testCollection.create({
            data: { ...dto, createdBy: userId },
        });
    }
    async deleteCollection(id) {
        await this.prisma.testCollection.delete({ where: { id } });
        return { success: true };
    }
    async findRequests(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '20');
        const where = {};
        if (query.collectionId)
            where['collectionId'] = query.collectionId;
        if (query.search) {
            where['OR'] = [{ name: { contains: query.search, mode: 'insensitive' } }];
        }
        const [data, total] = await Promise.all([
            this.prisma.testRequest.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { collection: { select: { name: true } } },
            }),
            this.prisma.testRequest.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async findOneRequest(id) {
        const req = await this.prisma.testRequest.findUnique({
            where: { id },
            include: {
                collection: true,
                executions: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!req)
            throw new common_1.NotFoundException('Test request not found');
        return req;
    }
    async createRequest(dto, _userId) {
        return this.prisma.testRequest.create({
            data: {
                collectionId: dto.collectionId,
                name: dto.name,
                protocol: dto.protocol,
                url: dto.endpoint || '',
                headersJson: dto.headersJson,
                bodyJson: dto.bodyJson,
            },
        });
    }
    async updateRequest(id, dto) {
        const data = {};
        if (dto.name !== undefined)
            data['name'] = dto.name;
        if (dto.protocol !== undefined)
            data['protocol'] = dto.protocol;
        if (dto.endpoint !== undefined)
            data['url'] = dto.endpoint;
        if (dto.headersJson !== undefined)
            data['headersJson'] = dto.headersJson;
        if (dto.bodyJson !== undefined)
            data['bodyJson'] = dto.bodyJson;
        return this.prisma.testRequest.update({ where: { id }, data });
    }
    async deleteRequest(id) {
        await this.prisma.testRequest.delete({ where: { id } });
        return { success: true };
    }
    async executeRequest(id, dto, userId) {
        const req = await this.findOneRequest(id);
        const endpoint = dto.endpoint || req.url || '';
        const headers = JSON.parse(dto.headersJson || req.headersJson || '{}');
        const body = dto.bodyJson || req.bodyJson;
        const start = Date.now();
        let responseJson = null;
        let errorMessage;
        let responseStatus = null;
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: body || undefined,
                signal: AbortSignal.timeout(30000),
            });
            responseStatus = res.status;
            const text = await res.text();
            try {
                responseJson = JSON.parse(text);
            }
            catch {
                responseJson = text;
            }
        }
        catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
        }
        const durationMs = Date.now() - start;
        const execution = await this.prisma.testExecution.create({
            data: {
                requestId: id,
                userId,
                responseStatus,
                responseBody: JSON.stringify(responseJson),
                durationMs,
                errorMessage,
            },
        });
        return { ...execution, responseJson };
    }
};
exports.TestingService = TestingService;
exports.TestingService = TestingService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], TestingService);


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestingController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const testing_service_1 = __webpack_require__(42);
const testing_dto_1 = __webpack_require__(44);
let TestingController = class TestingController {
    constructor(testingService) {
        this.testingService = testingService;
    }
    findCollections() {
        return this.testingService.findAllCollections();
    }
    createCollection(dto, req) {
        return this.testingService.createCollection(dto, req.user?.id);
    }
    deleteCollection(id) {
        return this.testingService.deleteCollection(id);
    }
    findRequests(query) {
        return this.testingService.findRequests(query);
    }
    findOneRequest(id) {
        return this.testingService.findOneRequest(id);
    }
    createRequest(dto, req) {
        return this.testingService.createRequest(dto, req.user?.id);
    }
    updateRequest(id, dto) {
        return this.testingService.updateRequest(id, dto);
    }
    deleteRequest(id) {
        return this.testingService.deleteRequest(id);
    }
    execute(id, dto, req) {
        return this.testingService.executeRequest(id, dto, req.user?.id);
    }
};
exports.TestingController = TestingController;
tslib_1.__decorate([
    (0, common_1.Get)('collections'),
    (0, swagger_1.ApiOperation)({ summary: 'List all test collections' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "findCollections", null);
tslib_1.__decorate([
    (0, common_1.Post)('collections'),
    (0, swagger_1.ApiOperation)({ summary: 'Create test collection' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof testing_dto_1.CreateTestCollectionDto !== "undefined" && testing_dto_1.CreateTestCollectionDto) === "function" ? _b : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "createCollection", null);
tslib_1.__decorate([
    (0, common_1.Delete)('collections/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete test collection' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "deleteCollection", null);
tslib_1.__decorate([
    (0, common_1.Get)('requests'),
    (0, swagger_1.ApiOperation)({ summary: 'List test requests' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof testing_dto_1.TestQueryDto !== "undefined" && testing_dto_1.TestQueryDto) === "function" ? _d : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "findRequests", null);
tslib_1.__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get test request by ID with execution history' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "findOneRequest", null);
tslib_1.__decorate([
    (0, common_1.Post)('requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Create test request' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof testing_dto_1.CreateTestRequestDto !== "undefined" && testing_dto_1.CreateTestRequestDto) === "function" ? _e : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "createRequest", null);
tslib_1.__decorate([
    (0, common_1.Patch)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update test request' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_g = typeof testing_dto_1.UpdateTestRequestDto !== "undefined" && testing_dto_1.UpdateTestRequestDto) === "function" ? _g : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "updateRequest", null);
tslib_1.__decorate([
    (0, common_1.Delete)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete test request' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "deleteRequest", null);
tslib_1.__decorate([
    (0, common_1.Post)('requests/:id/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a test request and store the result' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__param(2, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_h = typeof testing_dto_1.ExecuteTestDto !== "undefined" && testing_dto_1.ExecuteTestDto) === "function" ? _h : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TestingController.prototype, "execute", null);
exports.TestingController = TestingController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Testing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('testing'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof testing_service_1.TestingService !== "undefined" && testing_service_1.TestingService) === "function" ? _a : Object])
], TestingController);


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestQueryDto = exports.ExecuteTestDto = exports.UpdateTestRequestDto = exports.CreateTestRequestDto = exports.CreateTestCollectionDto = void 0;
const tslib_1 = __webpack_require__(1);
const class_validator_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(4);
class CreateTestCollectionDto {
}
exports.CreateTestCollectionDto = CreateTestCollectionDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateTestCollectionDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestCollectionDto.prototype, "description", void 0);
class CreateTestRequestDto {
}
exports.CreateTestRequestDto = CreateTestRequestDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "collectionId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "description", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['mcp', 'http', 'sse'] }),
    (0, class_validator_1.IsIn)(['mcp', 'http', 'sse']),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "protocol", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "endpoint", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "method", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON headers' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "headersJson", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON body/payload' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateTestRequestDto.prototype, "bodyJson", void 0);
class UpdateTestRequestDto extends (0, swagger_1.PartialType)(CreateTestRequestDto) {
}
exports.UpdateTestRequestDto = UpdateTestRequestDto;
class ExecuteTestDto {
}
exports.ExecuteTestDto = ExecuteTestDto;
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Override endpoint' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ExecuteTestDto.prototype, "endpoint", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Override headers JSON' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ExecuteTestDto.prototype, "headersJson", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Override body JSON' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], ExecuteTestDto.prototype, "bodyJson", void 0);
class TestQueryDto {
}
exports.TestQueryDto = TestQueryDto;
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], TestQueryDto.prototype, "collectionId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], TestQueryDto.prototype, "search", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], TestQueryDto.prototype, "page", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], TestQueryDto.prototype, "pageSize", void 0);


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokensModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const tokens_service_1 = __webpack_require__(46);
const tokens_controller_1 = __webpack_require__(48);
let TokensModule = class TokensModule {
};
exports.TokensModule = TokensModule;
exports.TokensModule = TokensModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [tokens_service_1.TokensService],
        controllers: [tokens_controller_1.TokensController],
        exports: [tokens_service_1.TokensService],
    })
], TokensModule);


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokensService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const crypto_1 = __webpack_require__(47);
const prisma_service_1 = __webpack_require__(15);
let TokensService = class TokensService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    hashToken(raw) {
        return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
    }
    async findAll(userId) {
        return this.prisma.apiToken.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                tokenPrefix: true,
                scopesJson: true,
                expiresAt: true,
                lastUsedAt: true,
                revokedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, userId) {
        const raw = `axn_${(0, crypto_1.randomBytes)(32).toString('hex')}`;
        const tokenHash = this.hashToken(raw);
        const tokenPrefix = raw.substring(0, 12);
        const token = await this.prisma.apiToken.create({
            data: {
                userId,
                name: dto.name,
                tokenHash,
                tokenPrefix,
                encryptedValue: raw, // stored in plaintext here; encrypt at rest in production
                scopesJson: dto.scopes ? JSON.stringify(dto.scopes) : null,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
        });
        // Return raw token only once — never stored in plaintext
        return { ...token, rawToken: raw };
    }
    async revoke(id, userId) {
        const token = await this.prisma.apiToken.findFirst({ where: { id, userId } });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        await this.prisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
        return { success: true };
    }
    async validate(raw) {
        const hash = this.hashToken(raw);
        const token = await this.prisma.apiToken.findFirst({
            where: { tokenHash: hash, revokedAt: null },
        });
        if (!token)
            throw new common_1.UnauthorizedException('Invalid token');
        if (token.expiresAt && token.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Token expired');
        }
        await this.prisma.apiToken.update({
            where: { id: token.id },
            data: { lastUsedAt: new Date() },
        });
        return { valid: true, userId: token.userId, scopes: token.scopesJson };
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], TokensService);


/***/ }),
/* 47 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokensController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const tokens_service_1 = __webpack_require__(46);
const tokens_dto_1 = __webpack_require__(49);
let TokensController = class TokensController {
    constructor(tokensService) {
        this.tokensService = tokensService;
    }
    findAll(req) {
        return this.tokensService.findAll(req.user.id);
    }
    create(dto, req) {
        return this.tokensService.create(dto, req.user.id);
    }
    revoke(id, req) {
        return this.tokensService.revoke(id, req.user.id);
    }
};
exports.TokensController = TokensController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all API tokens for the current user' }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TokensController.prototype, "findAll", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API token (raw token shown once)' }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof tokens_dto_1.CreateApiTokenDto !== "undefined" && tokens_dto_1.CreateApiTokenDto) === "function" ? _c : Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TokensController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an API token' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], TokensController.prototype, "revoke", null);
exports.TokensController = TokensController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('API Tokens'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tokens'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof tokens_service_1.TokensService !== "undefined" && tokens_service_1.TokensService) === "function" ? _a : Object])
], TokensController);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateApiTokenDto = void 0;
const tslib_1 = __webpack_require__(1);
const class_validator_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(4);
class CreateApiTokenDto {
}
exports.CreateApiTokenDto = CreateApiTokenDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Integration Token' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateApiTokenDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expiry date ISO string, null = never expires' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], CreateApiTokenDto.prototype, "expiresAt", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allowed scopes e.g. ["plugins:read","tools:execute"]' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Array)
], CreateApiTokenDto.prototype, "scopes", void 0);


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogsModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const logs_service_1 = __webpack_require__(51);
const logs_controller_1 = __webpack_require__(52);
let LogsModule = class LogsModule {
};
exports.LogsModule = LogsModule;
exports.LogsModule = LogsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [logs_service_1.LogsService],
        controllers: [logs_controller_1.LogsController],
    })
], LogsModule);


/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogsService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let LogsService = class LogsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAuditLogs(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '50');
        const where = {};
        if (query.userId)
            where['userId'] = query.userId;
        if (query.action)
            where['action'] = { contains: query.action, mode: 'insensitive' };
        if (query.resourceType)
            where['resourceType'] = query.resourceType;
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true } } },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async findSystemLogs(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '100');
        const where = {};
        if (query.level)
            where['level'] = query.level.toUpperCase();
        if (query.search) {
            where['message'] = { contains: query.search, mode: 'insensitive' };
        }
        const [data, total] = await Promise.all([
            this.prisma.systemLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.systemLog.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async findExecutionLogs(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '50');
        const where = {};
        if (query.pluginId)
            where['pluginId'] = query.pluginId;
        if (query.toolId)
            where['toolId'] = query.toolId;
        if (query.status)
            where['status'] = query.status;
        const [data, total] = await Promise.all([
            this.prisma.executionLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.executionLog.count({ where }),
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], LogsService);


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogsController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const logs_service_1 = __webpack_require__(51);
let LogsController = class LogsController {
    constructor(logsService) {
        this.logsService = logsService;
    }
    findAudit(query) {
        return this.logsService.findAuditLogs(query);
    }
    findSystem(query) {
        return this.logsService.findSystemLogs(query);
    }
    findExecution(query) {
        return this.logsService.findExecutionLogs(query);
    }
};
exports.LogsController = LogsController;
tslib_1.__decorate([
    (0, common_1.Get)('audit'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LogsController.prototype, "findAudit", null);
tslib_1.__decorate([
    (0, common_1.Get)('system'),
    (0, swagger_1.ApiOperation)({ summary: 'List system logs' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof Record !== "undefined" && Record) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LogsController.prototype, "findSystem", null);
tslib_1.__decorate([
    (0, common_1.Get)('execution'),
    (0, swagger_1.ApiOperation)({ summary: 'List execution logs' }),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof Record !== "undefined" && Record) === "function" ? _d : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LogsController.prototype, "findExecution", null);
exports.LogsController = LogsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('logs'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof logs_service_1.LogsService !== "undefined" && logs_service_1.LogsService) === "function" ? _a : Object])
], LogsController);


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const notifications_service_1 = __webpack_require__(54);
const notifications_controller_1 = __webpack_require__(55);
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [notifications_service_1.NotificationsService],
        controllers: [notifications_controller_1.NotificationsController],
    })
], NotificationsModule);


/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, unreadOnly) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async markRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], NotificationsService);


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(4);
const notifications_service_1 = __webpack_require__(54);
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    findAll(req, unread) {
        return this.notificationsService.findAll(req.user.id, unread === 'true');
    }
    unreadCount(req) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }
    markRead(id, req) {
        return this.notificationsService.markRead(id, req.user.id);
    }
    markAllRead(req) {
        return this.notificationsService.markAllRead(req.user.id);
    }
};
exports.NotificationsController = NotificationsController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notifications' }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Query)('unread')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], NotificationsController.prototype, "findAll", null);
tslib_1.__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], NotificationsController.prototype, "unreadCount", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark notification as read' }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], NotificationsController.prototype, "markRead", null);
tslib_1.__decorate([
    (0, common_1.Patch)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
exports.NotificationsController = NotificationsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notifications'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof notifications_service_1.NotificationsService !== "undefined" && notifications_service_1.NotificationsService) === "function" ? _a : Object])
], NotificationsController);


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