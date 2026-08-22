import { Module } from '@nestjs/common';
import { FormsModule } from '../forms/forms.module';
import { AcceptanceCriteriaController } from './acceptance-criteria.controller';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { UserStoriesController } from './user-stories.controller';
import { UserStoriesService } from './user-stories.service';

@Module({
  imports: [FormsModule],
  controllers: [UserStoriesController, AcceptanceCriteriaController],
  providers: [UserStoriesService, AcceptanceCriteriaService],
  exports: [UserStoriesService],
})
export class UserStoriesModule {}
