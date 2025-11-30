import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Req,
} from '@nestjs/common';
//import { CreateEmployeeDto } from './dto/create-employee.dto';

import { EmployeeProfileService } from './employee-profile.service';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { SystemRole } from './enums/employee-profile.enums';
import { RegisterEmployeeDto } from './dto/register-employee.dto';

import { Roles } from '../auth/decorator/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Controller('employee-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeProfileController {
    constructor(private readonly svc: EmployeeProfileService) {}
    //---------------------
    // '/employee-profile'
    //---------------------
    @Post()
    //@Roles(SystemRole.HR_MANAGER)
    createEmployee(@Body() dto: RegisterEmployeeDto) {
        return this.svc.createEmployee(dto);
    }

    //get all employees
    @Get()
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
    getAll(@Req() req) {
        return this.svc.getAllEmployees(req.user);
    } 
    
    //-------------------------------
    // '/employee-profile/candidate'
    //-------------------------------
    
    @Post('candidate')
    @Roles(SystemRole.RECRUITER)
    createCandidate(@Body() dto: CreateCandidateDto) {
        return this.svc.createCandidate(dto);
    }

    //---------------------------------
    // '/employee-profile/my-employees'
    //---------------------------------
    @Get('my-employees')
    @Roles(SystemRole.DEPARTMENT_HEAD)
    getEmployeesInMyDepartment(@Req() req) {
        console.log("alooooooooooooooo",req.user._id)
        return this.svc.getEmployeesInDepartment(req.user.primaryDepartmentId, req.user);
    }

    //-------------------------------------
    // '/employee-profile/change-requests'
    //-------------------------------------

    //HR views all change requests
    @Get('change-requests/all')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_ADMIN,
        SystemRole.HR_EMPLOYEE,
    )
    getAllCRs(@Req() req) {
        return this.svc.listChangeRequests(req.user);
    }

    @Get('change-request/:requestId')
    @Roles(
        SystemRole.DEPARTMENT_EMPLOYEE,
        SystemRole.HR_EMPLOYEE,
    )
    getMyCRs(@Req() req) {
        return this.svc.getChangeRequest(req.user);
    }

    //HR reviews a change request
    @Post('change-request/:requestId/review')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_ADMIN,
        SystemRole.HR_EMPLOYEE
    )
    reviewCR(
        @Param('requestId') requestId: string,
        @Body() body: { approve: boolean; reviewerRole: SystemRole; patch?: any },
        @Req() req
    ) {
        return this.svc.reviewChangeRequest(
        requestId,
        body.approve,
        req.user,
        body.patch,
        );
    }
    //------------------------------------
    // '/employee-profile/:employeeNumber'
    //------------------------------------

    @Get(':employeeNumber/my-profile')
    getMyProfile(@Param('employeeNumber') employeeNumber: string, @Req() req) {
        return this.svc.getMyProfile(employeeNumber, req.user);
    }

    //immediate update // kolo mmkn y edit
    @Put(':employeeNumber/my-profile/immediate')
    updateSelfImmediate(
        @Param('employeeNumber') employeeNumber: string,
        @Body() dto: UpdateEmployeeSelfImmediateDto,
        @Req() req
    ) {
        return this.svc.updateEmployeeSelfImmediate(employeeNumber, dto, req.user);
    }

    // Critical changes → change request
    @Post(':employeeNumber/my-profile/change-request')
    @Roles(
        SystemRole.DEPARTMENT_EMPLOYEE,
        SystemRole.HR_EMPLOYEE
    )
    createChangeRequest(
        @Param('employeeNumber') employeeNumber: string, 
        @Body() dto: CreateEmployeeChangeRequestDto,
        @Req() req
    ) {
        return this.svc.createChangeRequest(employeeNumber, dto, req.user);
    }

    //------------------------
    // '/employee-profile/:id'
    //------------------------

    //get specific employee by id
    @Get(':id')
    @Roles(
        SystemRole.HR_MANAGER,
        SystemRole.HR_EMPLOYEE,
        SystemRole.HR_ADMIN,
        SystemRole.SYSTEM_ADMIN,
        SystemRole.DEPARTMENT_HEAD,
    )
    getOne(@Param('id') id: string, @Req() req) {
        return this.svc.getEmployee(id, req.user);
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

    
}
