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

import { UserService } from '../../../services/user.service';
import { PageUsersDto } from '../dto/page-users.dto';
import { UserCreateDto, UserUpdateDto } from '../dto/user.dto';

@ApiTags('User - Module')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'user', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated users' })
  async pageUsers(@Query() dto: PageUsersDto): Promise<ApiRes<any>> {
    const result = await this.userService.pageUsers({
      current: dto.current,
      size: dto.size,
      username: dto.username,
      nickName: dto.nickName,
      status: dto.status,
    });
    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'user', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(
    @Body() dto: UserCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.userService.createUser({
      username: dto.username,
      password: dto.password,
      domain: dto.domain,
      nickName: dto.nickName,
      avatar: dto.avatar,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'user', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Body() dto: UserUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.userService.updateUser({
      id: dto.id,
      username: dto.username,
      nickName: dto.nickName,
      avatar: dto.avatar,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'user', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete user by ID' })
  async deleteUser(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.userService.deleteUser(id);
    return ApiRes.ok();
  }
}
