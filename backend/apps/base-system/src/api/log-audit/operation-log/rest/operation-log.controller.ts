import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { Log } from '@lib/infra/decorators/log.decorator';
import { LogInterceptor } from '@lib/infra/interceptors/log.interceptor';
import { ApiRes } from '@lib/infra/rest/res.response';

import { OperationLogService } from '../../../../services/operation-log.service';
import { PageOperationLogsQueryDto } from '../dto/page-operation-log.dto';

@ApiTags('Operation Log - Module')
@Controller('operation-log')
@UseInterceptors(LogInterceptor)
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'operation-log', action: AuthActionVerb.READ })
  @Log('OperationLog', 'Query operation logs', {
    logParams: true,
    logResponse: false,
  })
  @ApiOperation({ summary: 'Get paginated operation logs' })
  async pageOperationLogs(
    @Query() dto: PageOperationLogsQueryDto,
  ): Promise<ApiRes<any>> {
    const result = await this.operationLogService.pageOperationLogs({
      current: dto.current,
      size: dto.size,
      username: dto.username,
      domain: dto.domain,
      moduleName: dto.moduleName,
      method: dto.method,
    });
    return ApiRes.success(result);
  }
}
