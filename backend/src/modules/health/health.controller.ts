import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'The API is up and reachable.' })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
