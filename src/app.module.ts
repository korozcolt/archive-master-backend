import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ConfigModule } from './config/config.module';
import { ConfigurationsModule } from './modules/configurations/configurations.module';
import { DatabaseModule } from './config/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { Module } from '@nestjs/common';
import { RedisModule } from './config/redis/redis-cache.module';
import { RolesModule } from './modules/roles/roles.module';
import { StatusModule } from './modules/status/status.module';
import { TagsModule } from './modules/tags/tags.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { UsersModule } from './modules/users/users.module';
import { VersioningModule } from './common/versioning/versioning.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    CompaniesModule,
    UsersModule,
    RolesModule,
    CategoriesModule,
    StatusModule,
    TagsModule,
    TemplatesModule,
    ConfigurationsModule,
    RedisModule,
    VersioningModule,
    WorkflowModule,
  ],
})
export class AppModule {}
