import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExportsService } from './exports.service';
import { CreateExportDto } from './dto/create-export.dto';
import { UpdateExportDto } from './dto/update-export.dto';
import { FilterPaginationDto } from 'src/common/dto/filter-pagination.dto';

@Controller()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}


  @MessagePattern('createExport')
  create(@Payload() createExportDto: CreateExportDto) {
    return this.exportsService.create(createExportDto);
  }

  @MessagePattern('findAllExports')
  findAll(@Payload() filterPaginationDto: FilterPaginationDto) {
    return this.exportsService.findAll(filterPaginationDto);
  }

  @MessagePattern('findOneExport')
  findOne(@Payload() id: string) {
    return this.exportsService.findOne(id);
  }

  @MessagePattern('updateExport')
  update(@Payload() payload: {id: string, updateExportDto: UpdateExportDto}) {
    return this.exportsService.update(payload.id, payload.updateExportDto);
  }
}
