import { Controller, Post, Body } from '@nestjs/common';
import { CalculationService } from './calculation.service';
import type { UserData } from '../shared/interfaces/conversation.interface';

@Controller('calculation')
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) {}

  @Post('borrowing-capacity')
  async calculateBorrowingCapacity(@Body() userData: UserData) {
    return this.calculationService.calculateBorrowingCapacity(userData);
  }
}