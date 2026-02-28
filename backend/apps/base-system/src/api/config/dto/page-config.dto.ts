import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@lib/infra/rest/pagination-params';

export class PageConfigQueryDto extends PaginationParams {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'configKey must be a string' })
  @IsNotEmpty({ message: 'configKey cannot be empty' })
  configKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status?: Status;
}
