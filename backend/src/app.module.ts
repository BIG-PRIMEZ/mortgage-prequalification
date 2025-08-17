import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { CalculationModule } from './calculation/calculation.module';
import { VerificationModule } from './verification/verification.module';
import { UserModule } from './user/user.module';
import { CustomSessionMiddleware } from './shared/middleware/custom-session.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ChatModule,
    CalculationModule,
    VerificationModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CustomSessionMiddleware)
      .forRoutes('*');
  }
}
