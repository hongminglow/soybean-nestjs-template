import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ISecurityConfig, securityRegToken } from '@lib/config/security.config';

import {
  AccessKeyService,
  AuthorizationService,
  AuthService,
  DomainService,
  EndpointService,
  LoginLogService,
  MenuService,
  OperationLogService,
  RoleService,
  SystemConfigService,
  UserService,
} from '../services';

import { Controllers as AccessKeyControllers } from './access-key/rest';
import { Controllers as ConfigControllers } from './config/rest';
import { Controllers as EndpointControllers } from './endpoint/rest';
import { Controllers as IamControllers } from './iam/rest';
import { Controllers as LoginLogControllers } from './log-audit/login-log/rest';
import { Controllers as OperationLogControllers } from './log-audit/operation-log/rest';
import { Controllers as TestControllers } from './test/rest';

const AllControllers = [
  ...IamControllers,
  ...EndpointControllers,
  ...AccessKeyControllers,
  ...ConfigControllers,
  ...LoginLogControllers,
  ...OperationLogControllers,
  ...TestControllers,
];

const AllServices = [
  UserService,
  AuthService,
  AuthorizationService,
  RoleService,
  DomainService,
  MenuService,
  EndpointService,
  LoginLogService,
  OperationLogService,
  AccessKeyService,
  SystemConfigService,
];

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { jwtSecret, jwtExpiresIn } = configService.get<ISecurityConfig>(
          securityRegToken,
          { infer: true },
        );
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: `${jwtExpiresIn}s` },
        };
      },
    }),
  ],
  controllers: AllControllers,
  providers: AllServices,
  exports: AllServices,
})
export class ApiModule {}
