import { ApiProperty } from '@nestjs/swagger';
import { FormResponseDto } from '../../forms/dto/form-response.dto';
import { AcceptanceCriterionResponseDto } from './acceptance-criterion-response.dto';

export class UserStoryResponseDto extends FormResponseDto {
  @ApiProperty() deliverableId!: string;
  @ApiProperty() orderIndex!: number;
  @ApiProperty({ type: [AcceptanceCriterionResponseDto] })
  acceptanceCriteria!: AcceptanceCriterionResponseDto[];
}
