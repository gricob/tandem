import { Module } from '@nestjs/common';
import { RequireAdminGuard } from './require-admin.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, RequireAdminGuard],
  exports: [UsersService, RequireAdminGuard],
})
export class UsersModule {}
