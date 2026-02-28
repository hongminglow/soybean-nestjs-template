import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ConfigCreateDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'configKey must be a string' })
  @IsNotEmpty({ message: 'configKey cannot be empty' })
  configKey!: string;

  @ApiProperty({ required: true })
  @IsString({ message: 'configValue must be a string' })
  @IsNotEmpty({ message: 'configValue cannot be empty' })
  configValue!: string;

  @ApiProperty({ required: true })
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status!: Status;
}

export class ConfigUpdateDto extends ConfigCreateDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id!: string;
}
