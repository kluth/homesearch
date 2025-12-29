import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExtractionController } from './extraction.controller';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [],
  controllers: [AppController, ExtractionController],
  providers: [AppService, OrchestratorService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly orchestrator: OrchestratorService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing House Finder Backend...');

    // Initialize orchestrator
    await this.orchestrator.initialize();

    this.logger.log('House Finder Backend initialized successfully');
  }
}
