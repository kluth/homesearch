/**
 * House Finder Backend - NestJS API Server
 * Orchestrates property extraction from multiple sources
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('🏠 Starting House Finder Backend...');

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend access
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global API prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application running on: http://localhost:${port}/${globalPrefix}`);
  logger.log(`📊 Health check: http://localhost:${port}/${globalPrefix}/extraction/health`);
  logger.log(`🔍 Extraction API: http://localhost:${port}/${globalPrefix}/extraction`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
