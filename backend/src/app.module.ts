import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DeliverablesModule } from './modules/deliverables/deliverables.module';
import { FormResponsesModule } from './modules/form-responses/form-responses.module';
import { FormTemplatesModule } from './modules/form-templates/form-templates.module';
import { FormsModule } from './modules/forms/forms.module';
import { HealthModule } from './modules/health/health.module';
import { UserStoriesModule } from './modules/user-stories/user-stories.module';
import { WorkstreamsModule } from './modules/workstreams/workstreams.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    FormTemplatesModule,
    FormsModule,
    FormResponsesModule,
    DeliverablesModule,
    UserStoriesModule,
    WorkstreamsModule,
  ],
})
export class AppModule {}
