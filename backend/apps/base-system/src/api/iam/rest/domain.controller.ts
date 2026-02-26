import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { ApiRes } from '@lib/infra/rest/res.response';
import { IAuthentication } from '@lib/typings/global';

import { DomainService } from '../../../services/domain.service';
import { DomainCreateDto, DomainUpdateDto } from '../dto/domain.dto';
import { PageDomainsDto } from '../dto/page-domains.dto';

@ApiTags('Domain - Module')
@Controller('domain')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'domain', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated domains' })
  async pageDomains(@Query() dto: PageDomainsDto): Promise<ApiRes<any>> {
    const result = await this.domainService.pageDomains({
      current: dto.current,
      size: dto.size,
      name: dto.name,
      status: dto.status,
    });
    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'domain', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create a new domain' })
  async createDomain(
    @Body() dto: DomainCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.domainService.createDomain({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'domain', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update domain' })
  async updateDomain(
    @Body() dto: DomainUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.domainService.updateDomain({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'domain', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete domain by ID' })
  async deleteDomain(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.domainService.deleteDomain(id);
    return ApiRes.ok();
  }
}
