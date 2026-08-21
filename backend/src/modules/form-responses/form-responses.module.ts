import { Module } from '@nestjs/common';
import { FormResponsesController } from './form-responses.controller';
import { FormResponsesService } from './form-responses.service';

@Module({
  controllers: [FormResponsesController],
  providers: [FormResponsesService],
})
export class FormResponsesModule {}
