import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';

import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { SystemRole } from './enums/employee-profile.enums';


@Controller('employee-profile')
export class EmployeeProfileController {
    constructor(private readonly svc: EmployeeProfileService) {}

    //HR creates employee
    @Post()
    createEmployee(@Body() dto: CreateEmployeeDto) {
        return this.svc.createEmployee(dto);
    }

    //Get all employees
    @Get()
    getAll() {
        return this.svc.getAllEmployees();
    }

    //Get employee by id
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.svc.getEmployee(id);
    }

    // Immediate update
    @Put(':id/self/immediate')
    updateSelfImmediate(@Param('id') id: string, @Body() dto: UpdateEmployeeSelfImmediateDto) {
        return this.svc.updateEmployeeSelfImmediate(id, dto);
    }

    // Critical changes → change request
    @Post(':id/self/request-change')
    createChangeRequest(@Param('id') id: string, @Body() dto: CreateEmployeeChangeRequestDto) {
        return this.svc.createChangeRequest(id, dto);
    }

    //Admin/HR update lel employee
    @Put(':id/admin')
    updateAdmin(@Param('id') id: string, @Body() dto: UpdateEmployeeAdminDto) {
        return this.svc.updateEmployeeAdmin(id, dto);
    }

    //HR views all change requests
    @Get('change-requests/all')
    getAllCRs() {
        return this.svc.listChangeRequests();
    }

    //HR reviews a change request
    @Post('change-request/:requestId/review')
    reviewCR(
        @Param('requestId') requestId: string,
        @Body() body: { approve: boolean; reviewerRole: SystemRole; patch?: any },
    ) {
        return this.svc.reviewChangeRequest(
        requestId,
        body.approve,
        body.reviewerRole,
        body.patch,
        );
    }

}
