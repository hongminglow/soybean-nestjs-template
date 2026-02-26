import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';

import { UserService } from '../../../services';

@ApiTags('Test - Module')
@Controller('test')
export class TestController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Mock endpoint: get user list',
    description:
      'Provides a simple example endpoint that returns a paged list of users.',
  })
  async getUsers(): Promise<ApiRes<any>> {
    const data = await this.userService.pageUsers({ current: 1, size: 20 });
    return ApiRes.success(data);
  }
}
