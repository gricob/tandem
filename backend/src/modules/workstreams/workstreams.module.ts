import { Module } from '@nestjs/common';
import { DeliverablesModule } from '../deliverables/deliverables.module';
import { WorkstreamsController } from './workstreams.controller';
import { WorkstreamsService } from './workstreams.service';

@Module({
  imports: [DeliverablesModule],
  controllers: [WorkstreamsController],
  providers: [WorkstreamsService],
})
export class WorkstreamsModule {}
