import { Configuration } from './entities/configuration.entity';
import { ConfigurationGroup } from './entities/configuration-group.entity';
import { ConfigurationHistory } from './entities/configuration-history.entity';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigurationGroup, Configuration, ConfigurationHistory])],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
  exports: [ConfigurationsService],
})
export class ConfigurationsModule {}
