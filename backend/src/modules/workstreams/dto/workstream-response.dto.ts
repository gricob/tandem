import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliverableResponseDto } from '../../deliverables/dto/deliverable-response.dto';

export class WorkstreamResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [DeliverableResponseDto] })
  deliverables!: DeliverableResponseDto[];
}
