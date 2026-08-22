import { Module } from '@nestjs/common';
import { UserStoriesModule } from '../user-stories/user-stories.module';
import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';

@Module({
  imports: [UserStoriesModule],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
})
export class DeliverablesModule {}
