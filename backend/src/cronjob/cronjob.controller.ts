import { Controller } from '@nestjs/common';
import { CronjobService } from './cronjob.service';

@Controller('cronjob')
export class CronjobController {
  constructor(private readonly cronjobService: CronjobService) {}
}
