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
} from './models/employee-profile.schema';

import {
  EmployeeProfileChangeRequest,
} from './models/ep-change-request.schema';

import {
  ProfileChangeStatus,
  SystemRole,
} from './enums/employee-profile.enums';

//DTOS
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { Counter } from './models/counter.schema';

@Injectable()
export class EmployeeProfileService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private empModel: Model<EmployeeProfileDocument>,

        @InjectModel(EmployeeProfile.name)
        private employeeModel: Model<EmployeeProfile>,

        @InjectModel('Counter')
        private readonly counterModel: Model<any>,

        @InjectModel(EmployeeProfileChangeRequest.name)
        private changeReqModel: Model<EmployeeProfileChangeRequest>,
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

    async createEmployee(dto: CreateEmployeeDto) {
        const employeeNumber = await this.getNextEmployeeNumber();

        const created = new this.empModel({
        ...dto,
        employeeNumber,
        });

        return created.save();
    }

    async getAllEmployees() {
        return this.empModel.find().lean();
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
        id: string,
        dto: UpdateEmployeeSelfImmediateDto,
        user: any
    ) {
        if (user.id !== id)
            throw new ForbiddenException("You can only update your own profile.");

        if (dto.address && typeof dto.address === "string") {
            dto.address = { city: dto.address };
        }

        return this.empModel.findByIdAndUpdate(
            id,
            { ...dto, updatedAt: new Date() },
            { new: true }
        );
    }

    // Admin update (contract, position, etc.)
    // async updateEmployeeAdmin(id: string, dto: UpdateEmployeeAdminDto, user:any) {
    //     // if (user.id !== id)
    //     //     throw new ForbiddenException("You can only submit change requests for yourself.");

    //     if (!Types.ObjectId.isValid(id))
    //         throw new BadRequestException('Invalid employee ID');

    //     const requestId = `REQ-${Date.now()}`;

    //     return this.changeReqModel.create({
    //         requestId,
    //         employeeProfileId: id,
    //         status: ProfileChangeStatus.PENDING,
    //         submittedAt: new Date(),
    //     });
    // }
    async updateEmployeeAdmin(id: string, dto: UpdateEmployeeAdminDto, user: any) {
    if (!Types.ObjectId.isValid(id))
        throw new BadRequestException('Invalid employee ID');

    return this.employeeModel.findByIdAndUpdate(id, dto, { new: true });
}


    // ----------------------------- //
    //     PROFILE CHANGE REQUESTS   //
    // ----------------------------- //

    async createChangeRequest(id: string, dto: CreateEmployeeChangeRequestDto,user:any) {
         if (user.id !== id)
            throw new ForbiddenException("You can only submit change requests for yourself.");

        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        const requestId = `REQ-${Date.now()}`;

        return this.changeReqModel.create({
            requestId,
            employeeProfileId: id,
            requestDescription: dto.requestDescription,
            reason: dto.reason,
            status: ProfileChangeStatus.PENDING,
            submittedAt: new Date(),
        });
    }

    async listChangeRequests() {
        return this.changeReqModel
        .find()
        .populate('employeeProfileId')
        .lean();
    }

    async getChangeRequest(requestId: string) {
        return this.changeReqModel.findOne({ requestId }).lean();
    }

    async reviewChangeRequest(
        requestId: string,
        approve: boolean,
        // reviewerRole: SystemRole,
        patch?: any
        ) {
        const req = await this.changeReqModel.findOne({ requestId });
        if (!req) throw new NotFoundException('Request not found');

        req.status = approve
            ? ProfileChangeStatus.APPROVED
            : ProfileChangeStatus.REJECTED;

        req.processedAt = new Date();
        await req.save();

        if (approve && patch) {
            await this.empModel.findByIdAndUpdate(
                req.employeeProfileId,
                { ...patch, updatedAt: new Date() }
            );
        }

        return req;
    }

}
