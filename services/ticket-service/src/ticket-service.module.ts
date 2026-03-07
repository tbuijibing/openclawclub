import { Module } from '@nestjs/common';
import { TicketServiceController } from './ticket-service.controller';
import { TicketService } from './ticket.service';

@Module({
  controllers: [TicketServiceController],
  providers: [TicketService],
})
export class TicketServiceModule {}
