import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter, HttpExceptionFilter } from './common/filters';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('app.allowedOrigins') as string[],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Apply global exception filters
  app.useGlobalFilters(new GlobalExceptionFilter(), new HttpExceptionFilter());

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('BizFinance Pro API')
    .setDescription(
      'Complete API documentation for BizFinance Pro - An AI-powered all-in-one platform for managing any business type while seamlessly integrating personal financial management.',
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Organizations', 'Multi-tenant organization management')
    .addTag('Accounts', 'Bank account management and balance tracking')
    .addTag('Transactions', 'Transaction management with categorization')
    .addTag('Categories', 'Income and expense categorization')
    .addTag('Budgets', 'Budget management with tracking and alerts')
    .addTag('Goals', 'Financial goal tracking')
    .addTag('Contacts', 'CRM contact management')
    .addTag('Invoices', 'Invoicing and payment management')
    .addTag('Products', 'Product and inventory management')
    .addTag('Projects', 'Project management with tasks')
    .addTag('Expenses', 'Expense tracking and reimbursement')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: '/api-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port: number = configService.get('app.port', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();
