import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { ApiRes } from '@lib/infra/rest/res.response';

import { LoginLogService } from '../../../../services/login-log.service';
import { PageLoginLogsQueryDto } from '../dto/page-login-log.dto';

@ApiTags('Login Log - Module')
@Controller('login-log')
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'login-log', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated login logs' })
  async pageLoginLogs(
    @Query() dto: PageLoginLogsQueryDto,
  ): Promise<ApiRes<any>> {
    const result = await this.loginLogService.pageLoginLogs({
      current: dto.current,
      size: dto.size,
      username: dto.username,
      domain: dto.domain,
      address: dto.address,
      type: dto.type,
    });
    return ApiRes.success(result);
  }
}
