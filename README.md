<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# BizFinance Pro - Backend API

A comprehensive finance management backend built with NestJS, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication & Security**: JWT-based auth with 2FA, session management
- 💰 **Personal Finance**: Accounts, transactions, budgets, goals tracking
- 📊 **Business Operations**: CRM, invoicing, inventory management
- 📈 **Project Management**: Projects, tasks, time tracking
- 🏢 **Multi-tenant**: Organization and team management
- 🔍 **Advanced Search**: Filtering, pagination, and reporting
- 📄 **API Documentation**: Auto-generated Swagger/OpenAPI docs

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd finance-backend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy `.env` file and update with your values:
```bash
cp .env .env.local
```

Required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance?schema=public"
JWT_SECRET="your-secure-secret-key"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"
PORT=3000
NODE_ENV=development
```

### 4. Database Setup

Generate Prisma Client:
```bash
npx prisma generate
```

Run migrations:
```bash
npx prisma migrate dev
```

### 5. Run the Application

Development mode (with hot-reload):
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Database Management

### View Database
```bash
npx prisma studio
```

### Create Migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Reset Database
```bash
npx prisma migrate reset
```

### Deploy Migrations (Production)
```bash
npx prisma migrate deploy
```

## API Documentation

Once the application is running, visit:
- Swagger UI: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`

## Project Structure

```
src/
├── accounts/         # Account management
├── auth/            # Authentication & authorization
├── budgets/         # Budget tracking
├── categories/      # Transaction categories
├── common/          # Shared utilities & filters
├── config/          # Configuration modules
├── contacts/        # CRM contacts
├── expenses/        # Expense tracking
├── goals/           # Financial goals
├── invoices/        # Invoice management
├── organizations/   # Multi-tenant organizations
├── prisma/          # Prisma service
├── products/        # Product catalog
├── projects/        # Project management
├── transactions/    # Financial transactions
├── app.module.ts    # Root module
└── main.ts          # Application entry point
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Migration from MongoDB

This project was migrated from MongoDB to PostgreSQL. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
