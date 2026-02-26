import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AccessKeyCreateDto {
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'domain must be a string or null' })
  @Type(() => String)
  domain!: string | null;

  @ApiProperty({ required: false })
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status!: Status;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string or null' })
  @Type(() => String)
  description!: string | null;
}

export class AccessKeyUpdateDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  id!: string;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'domain must be a string or null' })
  @Type(() => String)
  domain?: string | null;

  @ApiProperty({ required: true })
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status!: Status;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string or null' })
  @Type(() => String)
  description?: string | null;
}
