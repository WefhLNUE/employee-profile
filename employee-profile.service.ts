import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

//SCHEMAS AND ENUMS
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './Models/employee-profile.schema';

import {
  EmployeeProfileChangeRequest,
} from './Models/ep-change-request.schema';

import {
  ProfileChangeStatus,
  SystemRole,
  CandidateStatus,
} from './enums/employee-profile.enums';

//DTOS
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { Counter } from './Models/counter.schema';
import { Candidate } from './Models/candidate.schema';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { EmployeeSystemRole } from './Models/employee-system-role.schema';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Department } from 'src/organization-structure/Models/department.schema';
import { Position } from 'src/organization-structure/Models/position.schema';


@Injectable()
export class EmployeeProfileService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private empModel: Model<EmployeeProfileDocument>,

        @InjectModel(EmployeeProfile.name)
        private employeeModel: Model<EmployeeProfile>,

        @InjectModel(Counter.name)
        private readonly counterModel: Model<any>,

        @InjectModel(EmployeeProfileChangeRequest.name)
        private changeReqModel: Model<EmployeeProfileChangeRequest>,

        @InjectModel(EmployeeSystemRole.name)
        private empRoleModel: Model<EmployeeSystemRole>,

        @InjectModel(Candidate.name)
        private candidateModel: Model<Candidate>,

        @InjectModel(Department.name)
        private departmentModel: Model<Department>,
    ) {}

    private async getNextEmployeeNumber(): Promise<string> {
        const counter = await this.counterModel.findOneAndUpdate(
        { name: 'employeeNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
        );

        const number = counter.value + 1000; // 1001, 1002, 1003...
        return `EMP-${number}`;
    }

    // ----------------------------- //
    //         EMPLOYEE CRUD         //
    // ----------------------------- //
    
    async createEmployee(dto: RegisterEmployeeDto) {
        const employeeNumber = await this.getNextEmployeeNumber();

        const created = new this.empModel({
            ...dto,
            employeeNumber,
        });

        return created.save();
    }

    async createCandidate(dto: CreateCandidateDto) {
        const candidateNumber = `CAND-${Date.now()}`;

        // Create the candidate
        const candidate = await this.candidateModel.create({
            ...dto,
            candidateNumber,
            applicationDate: new Date(),
            status: CandidateStatus.APPLIED,
        });

        // If roles are provided, create role assignments
        if (dto.roles && dto.roles.length > 0) {
            await this.empRoleModel.create({
                employeeProfileId: candidate._id,
                roles: dto.roles,
                isActive: true,
            });
        }

        return candidate;
    }

    async findByRole(role: SystemRole) {
        const roleRecords = await this.empRoleModel
            .find({ roles: role, isActive: true })
            .populate('employeeProfileId')
            .lean()
            .exec();

        return roleRecords
            .filter(r => r.employeeProfileId)
            .map(r => r.employeeProfileId as any);
    }
    async getMyProfile(employeeNumber: string, user: any) {
        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");

        if(user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only view your own profile.");
        return employee;
    }


async getMyRoles(employeeId: string | Types.ObjectId): Promise<string[]> {
  const id = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId;

  console.log('Querying roles for employeeProfileId:', id);

  const record = await this.empRoleModel.findOne({ employeeProfileId: id, isActive: true }).exec();

  console.log('Found record:', record);

  return record?.roles || [];
}


    async getAllEmployees(user: any) {
        // return this.empModel.find().lean();
            const hrRoles = [
            SystemRole.HR_MANAGER,
            SystemRole.HR_EMPLOYEE,
            SystemRole.HR_ADMIN,
            SystemRole.SYSTEM_ADMIN,
        ];

        // HR can see all employees
        if (user.roles.some(r => hrRoles.includes(r))) {
            return this.empModel.find().lean();
        }

        // Department Head → only employees in their department
        if (user.roles.includes(SystemRole.DEPARTMENT_HEAD)) {
            if (!user.primaryDepartmentId) {
                throw new ForbiddenException("Your department is not set.");
            }

            return this.empModel
                .find({ primaryDepartmentId: user.primaryDepartmentId })
                .lean();
        }

        // // Department Employee should NOT access this list
        // if (user.roles === SystemRole.DEPARTMENT_EMPLOYEE) {
        //     throw new ForbiddenException("You are not allowed to view all employees.");
        // }

        throw new ForbiddenException("You are not allowed to view this resource.");
    }

    async getEmployee(id: string, user: any) {
        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        const emp = await this.empModel.findById(id).lean();
        if (!emp) throw new NotFoundException('Employee not found');

        // ----------------------------
        // ACCESS CONTROL LOGIC
        // ----------------------------

        const hrRoles = [
            SystemRole.HR_MANAGER,
            SystemRole.HR_EMPLOYEE,
            SystemRole.HR_ADMIN,
            SystemRole.SYSTEM_ADMIN
        ];

        if (hrRoles.includes(user.role)) {
            return emp;
        }

        if (user.role === SystemRole.DEPARTMENT_EMPLOYEE) {
            if (!user.primaryDepartmentId || !emp.primaryDepartmentId) {
                throw new ForbiddenException("Your department is not set.");
            }
            if (emp.primaryDepartmentId.toString() !== user.primaryDepartmentId.toString()){
                throw new ForbiddenException(
                    "You can only view employees in your department."
                );
            }
        }

        if (user.role === SystemRole.DEPARTMENT_HEAD) {
            if (!user.primaryDepartmentId || !emp.primaryDepartmentId)
                throw new ForbiddenException("Missing department assignment");

            if (emp.primaryDepartmentId.toString() !== user.primaryDepartmentId.toString())
                throw new ForbiddenException("You can only view employees in your department");
        }
        return emp;
    }

    async updateEmployeeSelfImmediate(
        employeeNumber: string,
        dto: UpdateEmployeeSelfImmediateDto,
        user: any
    ) {
        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");
        
        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only update your own profile.");

        // Only allow these fields
        const allowedFields = [
            "profilePictureUrl",
            "biography",
            "address",
            "personalEmail",
            "mobilePhone"
        ];

        const updateData: Record<string, any> = {};


        for (const key of allowedFields) {
            if (dto[key] !== undefined) {
                updateData[key] = dto[key];
            }
        }

        // Handle address conversion logic
        if (updateData.address) {

            // If address is a STRING → treat it as city
            if (typeof updateData.address === "string") {
                updateData.address = { city: updateData.address };
            }

            // If address is an OBJECT → allow only known fields
            if (typeof updateData.address === "object") {
                updateData.address = {
                    ...(updateData.address.city && { city: updateData.address.city }),
                    ...(updateData.address.streetAddress && { streetAddress: updateData.address.streetAddress }),
                    ...(updateData.address.country && { country: updateData.address.country })
                };
            }
        }

        updateData["updatedAt"] = new Date();

        return this.empModel.findByIdAndUpdate(employee._id, updateData, { new: true });
    }


    async updateEmployeeAdmin(id: string, dto: UpdateEmployeeAdminDto, user: any) {
    if (!Types.ObjectId.isValid(id))
        throw new BadRequestException('Invalid employee ID');

    return this.employeeModel.findByIdAndUpdate(id, dto, { new: true });
}

    // async getByEmployeeNumber(employeeNumber: string) {
    //     const employee = await this.empModel.findOne({ employeeNumber });

    //     if (!employee) {
    //         throw new NotFoundException('Employee not found');
    //     }

    //     return employee;
    // }


    // ----------------------------- //
    //     PROFILE CHANGE REQUESTS   //
    // ----------------------------- //

    async createChangeRequest(employeeNumber: string, dto: CreateEmployeeChangeRequestDto,user:any) {
        //debug
        console.log("logged in emp no: " , user.employeeNumber)
        console.log("in url emp no:", employeeNumber);
        console.log("equal?", user.employeeNumber === employeeNumber);

        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only submit change requests for yourself.");
        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");

        // if (!Types.ObjectId.isValid(employee._id))
        //     throw new BadRequestException('Invalid employee ID');

        const requestId = `REQ-${Date.now()}`;

        return this.changeReqModel.create({
            requestId,
            employeeProfileId: employee._id,
            requestDescription: dto.requestDescription,
            reason: dto.reason,
            status: ProfileChangeStatus.PENDING,
            submittedAt: new Date(),
        });
    }

    async listChangeRequests(user:any) {
        if(user.roles.includes(SystemRole.HR_MANAGER) || user.roles.includes(SystemRole.HR_ADMIN)){
            return this.changeReqModel
                .find()
                .populate('employeeProfileId')
                .lean();
        }
        if(user.roles.includes(SystemRole.HR_EMPLOYEE)){
            return this.changeReqModel
                .find()
                .populate({
                    path: 'employeeProfileId',
                    match: { roles: SystemRole.DEPARTMENT_EMPLOYEE },
                })
                .lean()
                .then(res => res.filter(r => r.employeeProfileId !== null));
        }
        throw new ForbiddenException('Not allowed');
    }

    async getChangeRequest(requestId: string) {
        return this.changeReqModel.findOne({ requestId }).lean();
    }

    async reviewChangeRequest(
        requestId: string,
        approve: boolean,
        user: any,
        patch?: any
        ) {
        const req = await this.changeReqModel
            .findOne({ requestId })
            .populate('employeeProfileId')
            .lean();

        if (!req) throw new NotFoundException('Request not found');

        const employee = req.employeeProfileId;
        const empRole = await this.empRoleModel
            .findOne({ employeeProfileId: employee._id })
            .lean();
        if (!empRole) throw new NotFoundException('Role Connection not found');
        //------------------
        // access controll
        //------------------
        if (
            user.roles.includes(SystemRole.HR_MANAGER) ||
            user.roles.includes(SystemRole.HR_ADMIN)
        ) {
            // OK -> continue
        }
        // HR_EMPLOYEE => only allowed if employee has DEPARTMENT_EMPLOYEE role
        else if (user.roles.includes(SystemRole.HR_EMPLOYEE)) {
            if (!empRole.roles.includes(SystemRole.DEPARTMENT_EMPLOYEE)) {
                throw new ForbiddenException(
                    "You cannot review requests for this employee"
                );
            }
        }
        else {
            throw new ForbiddenException("Not allowed");
        }
        //------------------
        const update: any = {
            status: approve
                ? ProfileChangeStatus.APPROVED
                : ProfileChangeStatus.REJECTED,
            processedAt: new Date(),
        };

        await this.changeReqModel.updateOne({ requestId }, update);

        if (approve && patch) {
            await this.empModel.findByIdAndUpdate(
                req.employeeProfileId,
                { ...patch, updatedAt: new Date() }
            );
        }

        //return { ...req, ...update };
        const reqUpdated = this.changeReqModel.findOne({ requestId }).lean();
        return reqUpdated;
    }

    async getEmployeesInDepartment(departmentId: string, user: any) {
        console.log("Department ID from logged in user:", departmentId);
        if (!departmentId) {
            throw new ForbiddenException("Department ID missing from token.");
        }

        //--------------------------------------------
        //IF I WILL REMOVE ME FEL EMPSSSS
        return this.empModel
            .find({
                primaryDepartmentId: departmentId,
                employeeNumber: { $ne: user.employeeNumber }   // exclude me
            })
            .select('firstName lastName employeeNumber primaryDepartmentId primaryPositionId')
            .lean();

        //--------------------------------------------
        //IF I WILL PRINT ME FO2 ABL BA2EET EL EMPSSSS
        // const employees = await this.empModel
        //     .find({ primaryDepartmentId: departmentId})
        //     .select('firstName lastName employeeNumber primaryDepartmentId primaryPositionId')
        //     .lean();

        // //return employees;
        // console.log(user.employeeNumber)
        // const me = employees.find(e => e.employeeNumber === user.employeeNumber);
        // const others = employees.filter(e => e.employeeNumber !== user.employeeNumber);

        // let final = me ? [me, ...others] : others;

        // // Remove employeeNumber BEFORE sending response
        // return final.map(emp => {
        //     const { employeeNumber, ...rest } = emp;
        //     return rest;
        // });

    }


}
