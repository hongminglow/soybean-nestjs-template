import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { ApiRes } from '@lib/infra/rest/res.response';

import { EndpointService } from '../../../services/endpoint.service';
import { PageEndpointsQueryDto } from '../dto/page-endpoint.dto';

@ApiTags('Endpoint - Module')
@Controller('endpoint')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'endpoint', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated endpoints' })
  async pageEndpoints(
    @Query() dto: PageEndpointsQueryDto,
  ): Promise<ApiRes<any>> {
    const result = await this.endpointService.pageEndpoints({
      current: dto.current,
      size: dto.size,
      path: dto.path,
      method: dto.method,
      action: dto.action,
      resource: dto.resource,
    });
    return ApiRes.success(result);
  }

  @Get('tree')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'endpoint', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get endpoints grouped by controller' })
  async getEndpointsTree(): Promise<ApiRes<any>> {
    const result = await this.endpointService.getEndpointsTree();
    return ApiRes.success(result);
  }

  @Get('authApiEndpoint')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'endpoint', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get authorized API endpoints for a role' })
  async getAuthApiEndpoint(
    @Query('roleCode') roleCode: string,
    @Query('domain') domain: string,
  ): Promise<ApiRes<any>> {
    const result = await this.endpointService.getAuthApiEndpoint(
      roleCode,
      domain,
    );
    return ApiRes.success(result);
  }
}
