import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { logtoConfig } from '../config/logto.config';
import { LogtoService } from './logto.service';

@Module({
  imports: [ConfigModule.forFeature(logtoConfig)],
  providers: [LogtoService],
  exports: [LogtoService],
})
export class LogtoModule {}
