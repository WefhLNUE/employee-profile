import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Req,
} from '@nestjs/common';

import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { SystemRole } from './enums/employee-profile.enums';

import { Roles } from '../auth/decorator/roles.decorator';

@Controller('employee-profile')
export class EmployeeProfileController {
    constructor(private readonly svc: EmployeeProfileService) {}

    //HR creates employee
    @Post()
    @Roles(SystemRole.HR_MANAGER)
    createEmployee(@Body() dto: CreateEmployeeDto) {
        return this.svc.createEmployee(dto);
    }

    //Get all employees
    @Get()
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
    getAll() {
        return this.svc.getAllEmployees();
    }

    //Get employee by id
    @Get(':id')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_EMPLOYEE,
        SystemRole.HR_ADMIN,
        SystemRole.SYSTEM_ADMIN,
        SystemRole.DEPARTMENT_HEAD,
        SystemRole.DEPARTMENT_EMPLOYEE
    )
    getOne(@Param('id') id: string, @Req() req) {
        return this.svc.getEmployee(id, req.user);
    }   

    // Immediate update
    @Put(':id/self/immediate')
    // @Roles(
    //     SystemRole.DEPARTMENT_EMPLOYEE,
    //     SystemRole.DEPARTMENT_HEAD
    // )
    updateSelfImmediate(
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeSelfImmediateDto,
        @Req() req
    ) {
        return this.svc.updateEmployeeSelfImmediate(id, dto, req.user);
    }

    // Critical changes → change request
    @Post(':id/self/change-request')
    @Roles(
        SystemRole.DEPARTMENT_EMPLOYEE,
        SystemRole.HR_EMPLOYEE
    )
    createChangeRequest(
        @Param('id') id: string, 
        @Body() dto: CreateEmployeeChangeRequestDto,
        @Req() req
    ) {
        return this.svc.createChangeRequest(id, dto, req.user);
    }

    //Admin/HR update lel employee
    @Put(':id/admin')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_ADMIN,
        SystemRole.SYSTEM_ADMIN
    )
    updateAdmin(@Param('id') id: string, @Body() dto: UpdateEmployeeAdminDto, @Req() req) {
        return this.svc.updateEmployeeAdmin(id, dto, req.user);
    }

    //HR views all change requests
    @Get('change-requests/all')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_ADMIN,
        SystemRole.HR_EMPLOYEE,
        SystemRole.SYSTEM_ADMIN
    )
    getAllCRs() {
        return this.svc.listChangeRequests();
    }

    //HR reviews a change request
    @Post('change-request/:requestId/review')
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN)
    reviewCR(
        @Param('requestId') requestId: string,
        @Body() body: { approve: boolean; reviewerRole: SystemRole; patch?: any },
        @Req() req
    ) {
        return this.svc.reviewChangeRequest(
        requestId,
        body.approve,
        // req.user.role,
        body.patch,
        );
    }

}
