import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import {
  CreateTicketDto,
  RateTicketDto,
} from './dto/ticket.dto';

@Controller('tickets')
export class TicketServiceController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'ticket-service' };
  }

  @Post()
  createTicket(@Body() dto: CreateTicketDto) {
    return this.ticketService.createTicket(dto);
  }

  @Get(':id')
  getTicket(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @Get()
  listTickets(@Query('userId') userId?: string, @Query('agentId') agentId?: string) {
    if (userId) return this.ticketService.listTicketsByUser(userId);
    if (agentId) return this.ticketService.listTicketsByAgent(agentId);
    return [];
  }

  @Post(':id/assign')
  assignTicket(@Param('id') ticketId: string, @Body() body: { agentId: string }) {
    return this.ticketService.assignTicket({ ticketId, agentId: body.agentId });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') ticketId: string, @Body() body: { status: string }) {
    return this.ticketService.updateTicketStatus({ ticketId, status: body.status as any });
  }

  @Post(':id/resolve')
  resolveTicket(@Param('id') ticketId: string) {
    return this.ticketService.resolveTicket(ticketId);
  }

  @Post(':id/rate')
  rateTicket(@Param('id') ticketId: string, @Body() body: { rating: number }) {
    return this.ticketService.rateTicket({ ticketId, rating: body.rating });
  }

  @Post('sla/check')
  checkSlaEscalation() {
    return this.ticketService.checkSlaEscalation();
  }
}
