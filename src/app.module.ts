import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { FedModule } from './fed/fed.module';
import { BmtModule } from './bmt/bmt.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ComparisonModule } from './comparison/comparison.module';
import { RcaModule } from './rca/rca.module';
import { HiveModule } from './hive/hive.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_DATABASE', 'opex_compare'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
    }),
    CommonModule,
    AuthModule,
    FedModule,
    BmtModule,
    WorkflowModule,
    ComparisonModule,
    RcaModule,
    HiveModule,
  ],
})
export class AppModule {}
