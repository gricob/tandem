import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAcceptanceCriterionDto {
  @ApiProperty({
    description:
      'Id of the form template this acceptance criterion is created from.',
  })
  @IsString()
  @IsNotEmpty()
  formTemplateId!: string;
}
