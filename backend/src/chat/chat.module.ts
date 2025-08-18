import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { DataExtractorService } from './data-extractor.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { WsRateLimitGuard } from './guards/ws-rate-limit.guard';
import { CalculationModule } from '../calculation/calculation.module';
import { VerificationModule } from '../verification/verification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CalculationModule, VerificationModule, UserModule],
  controllers: [ChatController],
  providers: [
    ChatService, 
    ChatGateway, 
    DataExtractorService,
    WsAuthGuard,
    WsRateLimitGuard,
  ],
  exports: [ChatService],
})
export class ChatModule {}