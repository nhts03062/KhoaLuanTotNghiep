import { PartialType } from '@nestjs/mapped-types';
import { FilterPtDto } from './filter-pt.dto';

export class FilterUserDto extends PartialType(FilterPtDto) {}
