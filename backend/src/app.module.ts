import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { FormTypesModule } from './modules/form-types/form-types.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, FormTypesModule],
})
export class AppModule {}
