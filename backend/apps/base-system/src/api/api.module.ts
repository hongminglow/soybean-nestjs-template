import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ISecurityConfig, securityRegToken } from '@lib/config/security.config';

import { Controllers as AccessKeyControllers } from './access-key/rest';
import { Controllers as EndpointControllers } from './endpoint/rest';
import { Controllers as IamControllers } from './iam/rest';
import { Controllers as LoginLogControllers } from './log-audit/login-log/rest';
import { Controllers as OperationLogControllers } from './log-audit/operation-log/rest';
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
  UserService,
} from '../services';

const AllControllers = [
  ...IamControllers,
  ...EndpointControllers,
  ...AccessKeyControllers,
  ...LoginLogControllers,
  ...OperationLogControllers,
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
