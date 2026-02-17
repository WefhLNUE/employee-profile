import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

//SCHEMAS AND ENUMS
import {
    EmployeeProfile,
    EmployeeProfileDocument,
} from './Models/employee-profile.schema';

import {
    DepartmentAssignment,
    DepartmentAssignmentDocument
} from 'src/organization-structure/Models/department-assignment.schema';

import {
    PositionAssignment,
    PositionAssignmentDocument
} from 'src/organization-structure/Models/position-assignment.schema';

import {
    EmployeeProfileChangeRequest,
} from './Models/ep-change-request.schema';

import {
    ProfileChangeStatus,
    SystemRole,
    CandidateStatus,
    EmployeeStatus
} from './enums/employee-profile.enums';

//DTOS
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeAdminDto } from './dto/update-employee-admin.dto';
import { UpdateEmployeeSelfImmediateDto } from './dto/update-self-immediate.dto';
import { CreateEmployeeChangeRequestDto } from './dto/create-change-request.dto';
import { CreateLegalChangeRequestDto } from './dto/create-legal-change-request.dto';
import { Counter } from './Models/counter.schema';
import { Candidate } from './Models/candidate.schema';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { EmployeeSystemRole } from './Models/employee-system-role.schema';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Department } from 'src/organization-structure/Models/department.schema';
import { Position } from 'src/organization-structure/Models/position.schema';
import { Application } from 'src/recruitment/Models/application.schema';
import { ApplicationStatusHistory } from 'src/recruitment/Models/application-history.schema';
import { AppraisalRecord } from 'src/performance/Models/appraisal-record.schema';
import { AppraisalTemplate } from 'src/performance/Models/appraisal-template.schema';
import { AppraisalRecordStatus } from 'src/performance/enums/performance.enums';
import { PayrollConfigurationService } from 'src/payroll-configuration/payroll-configuration.service';
import { NotificationService } from 'src/time-management/services/notification.service';


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

        @InjectModel(PositionAssignment.name)
        private positionAssignmentModel: Model<PositionAssignmentDocument>,

        @InjectModel(DepartmentAssignment.name)
        private departmentAssignmentModel: Model<DepartmentAssignment>,

        @InjectModel(Application.name)
        private applicationModel: Model<Application>,

        @InjectModel(ApplicationStatusHistory.name)
        private applicationHistoryModel: Model<ApplicationStatusHistory>,

        @InjectModel(AppraisalRecord.name)
        private appraisalRecordModel: Model<AppraisalRecord>,

        @InjectModel(AppraisalTemplate.name)
        private appraisalTemplateModel: Model<AppraisalTemplate>,

        private readonly payrollConfigService: PayrollConfigurationService,
        private readonly notificationService: NotificationService,
    ) { }

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
        return candidate;
    }

    async updateCandidateStatus(
        candidateId: string,
        status: CandidateStatus,
        notes?: string,
        changedBy?: string,
        applicationId?: string // Optional: if provided, only update this specific application
    ) {
        const candidate = await this.candidateModel.findById(candidateId);

        if (!candidate) {
            throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
        }

        const oldStatus = candidate.status;

        // Update candidate status
        candidate.status = status;
        await candidate.save();

        // Map CandidateStatus to ApplicationStatus for updating applications
        const candidateToApplicationStatusMap: Partial<Record<CandidateStatus, string>> = {
            [CandidateStatus.APPLIED]: 'submitted',
            [CandidateStatus.SCREENING]: 'in_process',
            [CandidateStatus.INTERVIEW]: 'in_process',
            [CandidateStatus.OFFER_SENT]: 'offer',
            [CandidateStatus.OFFER_ACCEPTED]: 'offer',
            [CandidateStatus.HIRED]: 'hired',
            [CandidateStatus.REJECTED]: 'rejected',
            [CandidateStatus.WITHDRAWN]: 'rejected',
        };

        const applicationStatus = candidateToApplicationStatusMap[status];

        // If a specific applicationId is provided, only update that application
        // Otherwise, only create a history record for the candidate status change (not all applications)
        if (applicationId) {
            const application = await this.applicationModel.findOne({
                _id: new Types.ObjectId(applicationId),
                candidateId: new Types.ObjectId(candidateId)
            });

            if (application) {
                // Update the application's status if there's a mapping
                if (applicationStatus) {
                    application.status = applicationStatus as any;
                    await application.save();
                }

                // Create history record for this specific application
                const historyRecord = new this.applicationHistoryModel({
                    applicationId: application._id,
                    oldStatus: application.status,
                    newStatus: applicationStatus || status,
                    changedBy: changedBy ? new Types.ObjectId(changedBy) : undefined,
                    changedAt: new Date(),
                    notes: notes || `Candidate status updated from ${oldStatus} to ${status}`,
                });
                await historyRecord.save();
            }
        }

        return {
            candidate,
            oldStatus,
            newStatus: status,
            notes
        };
    }

    /**
     * Get all candidates for talent pool view
     * Access: HR Manager, HR Employee, Recruiter
     */
    async getAllCandidates(user: any) {
        const hrRoles = [
            SystemRole.HR_MANAGER,
            SystemRole.HR_EMPLOYEE,
            SystemRole.HR_ADMIN,
            SystemRole.RECRUITER,
            SystemRole.SYSTEM_ADMIN,
        ];

        // Check if user has appropriate role
        if (!user.roles.some(r => hrRoles.includes(r))) {
            throw new ForbiddenException("You don't have permission to view all candidates");
        }

        return this.candidateModel
            .find()
            .sort({ applicationDate: -1, createdAt: -1 })
            .lean();
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

    async getAllEmployeesForSelection(user: any) {
        // Return all active employees with minimal data for selection dropdowns
        return this.empModel
            .find({ status: 'ACTIVE' })
            .select('_id firstName lastName employeeNumber primaryDepartmentId primaryPositionId')
            .populate('primaryPositionId', 'title code departmentId')
            .populate('primaryDepartmentId', 'name code')
            .lean();
    }

    async getSupervisors(user: any) {
        // Get employees who are department heads or HR managers
        const supervisorRoles = [
            SystemRole.DEPARTMENT_HEAD,
            SystemRole.HR_MANAGER,
            SystemRole.HR_ADMIN,
        ];

        const roleRecords = await this.empRoleModel
            .find({ roles: { $in: supervisorRoles }, isActive: true })
            .populate('employeeProfileId')
            .lean()
            .exec();

        return roleRecords
            .filter(r => r.employeeProfileId)
            .map(r => {
                const emp = r.employeeProfileId as any;
                return {
                    _id: emp._id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    employeeNumber: emp.employeeNumber,
                    primaryPositionId: emp.primaryPositionId,
                };
            });
    }
    async getMyProfile(employeeNumber: string, user: any) {
        const employee = await this.empModel.findOne({ employeeNumber })
            .populate('primaryPositionId')
            .populate('primaryDepartmentId')
            .lean();
        if (!employee) throw new NotFoundException("Employee not found");

        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only view your own profile.");
        return employee;
    }

    async getEmployeeById(employeeId: string, user: any) {
        if (!Types.ObjectId.isValid(employeeId)) {
            throw new BadRequestException('Invalid employee ID');
        }

        const employee = await this.empModel.findById(employeeId).lean();

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        // Department Head access control
        if (user.roles?.includes(SystemRole.DEPARTMENT_HEAD)) {
            if (!user.primaryDepartmentId) {
                throw new ForbiddenException('Your department is not set.');
            }

            if (
                !employee.primaryDepartmentId ||
                employee.primaryDepartmentId.toString() !==
                user.primaryDepartmentId.toString()
            ) {
                throw new ForbiddenException(
                    'You are not allowed to access employees outside your department.'
                );
            }
        }

        // Fetch permissions and roles
        const roleRecord = await this.empRoleModel.findOne({ employeeProfileId: employee._id, isActive: true }).lean() as any;

        return {
            ...employee,
            permissions: roleRecord?.permissions || [],
            roles: roleRecord?.roles || [],
            permissionsLastUpdated: roleRecord?.updatedAt,
        };
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
            return this.empModel.find()
                .populate('primaryPositionId')
                .populate('primaryDepartmentId')
                .lean();
        }

        // Department Head or Department Employee → only employees in their department
        if (
            user.roles.includes(SystemRole.DEPARTMENT_HEAD)
        ) {
            if (!user.primaryDepartmentId) {
                // If they have no department, they can only see themselves (or nothing)
                // Returning just themselves for consistency
                return this.empModel
                    .find({ employeeNumber: user.employeeNumber })
                    .populate('primaryPositionId')
                    .populate('primaryDepartmentId')
                    .lean();
            }

            return this.empModel
                .find({ primaryDepartmentId: user.primaryDepartmentId })
                .populate('primaryPositionId')
                .populate('primaryDepartmentId')
                .lean();
        }

        throw new ForbiddenException("You are not allowed to view this resource.");
    }

    // Internal method - no access control, for system use only

    async getEmployee(id: string, user: any) {
        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        const emp = await this.empModel.findById(id)
            .populate('primaryPositionId')
            .populate('primaryDepartmentId')
            .populate('payGradeId')
            .populate('supervisorPositionId')
            .populate('supervisorId')
            .lean() as any;
        if (!emp) throw new NotFoundException('Employee not found');

        // SYNC LAST APPRAISAL DATA
        try {
            const lastAppraisal = await this.appraisalRecordModel
                .findOne({
                    employeeProfileId: emp._id,
                    status: AppraisalRecordStatus.HR_PUBLISHED
                })
                .sort({ hrPublishedAt: -1, createdAt: -1 })
                .lean();

            if (lastAppraisal) {
                // If the employee record is outdated (or we just want to ensure it's always actively fresh)
                const updateNeeded = !emp.lastAppraisalRecordId || emp.lastAppraisalRecordId.toString() !== lastAppraisal._id.toString();

                if (true) { // Always sync on fetch for now to be safe
                    // Get template for scale type
                    const template = await this.appraisalTemplateModel.findById(lastAppraisal.templateId).lean();

                    const updates: any = {
                        lastAppraisalRecordId: lastAppraisal._id,
                        lastAppraisalCycleId: lastAppraisal.cycleId,
                        lastAppraisalTemplateId: lastAppraisal.templateId,
                        lastAppraisalDate: lastAppraisal.hrPublishedAt || lastAppraisal.managerSubmittedAt,
                        lastAppraisalScore: lastAppraisal.totalScore,
                        lastAppraisalRatingLabel: lastAppraisal.overallRatingLabel,
                        lastDevelopmentPlanSummary: lastAppraisal.managerSummary, // Using manager summary as plan summary
                        lastAppraisalScaleType: template?.ratingScale?.type
                    };

                    // Update DB
                    await this.empModel.findByIdAndUpdate(emp._id, updates);

                    // Update local object for return
                    Object.assign(emp, updates);
                }
            }
        } catch (error) {
            console.error('Error syncing appraisal data in getEmployee:', error);
            // Don't fail the request, just log
        }

        // ----------------------------
        // ACCESS CONTROL LOGIC
        // ----------------------------

        const hrRoles = [
            SystemRole.HR_MANAGER,
            SystemRole.HR_EMPLOYEE,
            SystemRole.HR_ADMIN,
            SystemRole.SYSTEM_ADMIN
        ];
        // Fetch role record regardless of active status so admins can see/restore roles
        const roleRecord = await this.empRoleModel.findOne({ employeeProfileId: emp._id }).lean();

        // Check if user has ANY of the hr roles
        if (user.roles.some(r => hrRoles.includes(r))) {
            return {
                ...emp,
                permissions: roleRecord?.permissions || [],
                roles: roleRecord?.roles || [],
                permissionsLastUpdated: (roleRecord as any)?.updatedAt,
            };
        }

        // Check for DEPARTMENT_EMPLOYEE
        if (user.roles.includes(SystemRole.DEPARTMENT_EMPLOYEE)) {
            // Must have a department set
            if (!user.primaryDepartmentId || !emp.primaryDepartmentId) {
                // If the user or target emp has no dept, we can't verify 'same dept' logic
            }

            // Handle populated department object
            const empDeptId = (emp.primaryDepartmentId as any)?._id
                ? (emp.primaryDepartmentId as any)._id.toString()
                : emp.primaryDepartmentId?.toString();

            // Only view employees in YOUR department
            if (
                user.primaryDepartmentId &&
                empDeptId &&
                empDeptId === user.primaryDepartmentId.toString()
            ) {
                return {
                    ...emp,
                    permissions: roleRecord?.permissions || [],
                    roles: roleRecord?.roles || [],
                    permissionsLastUpdated: (roleRecord as any)?.updatedAt,
                };
            }

            // Fallback: if it is literally ME
            // user.id usually comes from JWT payload.id (or _id)
            if (user.id === emp._id.toString()) {
                return {
                    ...emp,
                    permissions: roleRecord?.permissions || [],
                    roles: roleRecord?.roles || [],
                };
            }
        }

        // Check for DEPARTMENT_HEAD
        if (user.roles.includes(SystemRole.DEPARTMENT_HEAD)) {
            if (!user.primaryDepartmentId)
                throw new ForbiddenException("Your department is not set.");

            // Handle populated department object
            const empDeptId = (emp.primaryDepartmentId as any)?._id
                ? (emp.primaryDepartmentId as any)._id.toString()
                : emp.primaryDepartmentId?.toString();

            console.log('--- DEBUG DEPT HEAD ACCESS ---');
            console.log('User Roles:', user.roles);
            console.log('User Dept ID:', user.primaryDepartmentId);
            console.log('Target Emp ID:', emp._id);
            console.log('Target Emp Dept ID (Raw):', emp.primaryDepartmentId);
            console.log('Target Emp Dept ID (Resolved):', empDeptId);
            console.log('Comparison:', empDeptId, '===', user.primaryDepartmentId?.toString());
            console.log('------------------------------');

            // Fallback: if it is literally ME
            if (user.id === emp._id.toString()) {
                return {
                    ...emp,
                    permissions: roleRecord?.permissions || [],
                    roles: roleRecord?.roles || [],
                    permissionsLastUpdated: (roleRecord as any)?.updatedAt,
                };
            }

            // Can view if in same department
            if (
                empDeptId &&
                empDeptId === user.primaryDepartmentId.toString()
            ) {
                return {
                    ...emp,
                    permissions: roleRecord?.permissions || [],
                    roles: roleRecord?.roles || [],
                    permissionsLastUpdated: (roleRecord as any)?.updatedAt,
                };
            }
        }

        throw new ForbiddenException("You are not allowed to view this employee.");
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

        const updatedEmployee = await this.empModel.findByIdAndUpdate(employee._id, updateData, { new: true });

        // NOTIFICATION LOGIC
        try {
            const message = `Employee ${employee.firstName} ${employee.lastName} updated their profile.`;

            // 1. Notify the employee themselves
            await this.notificationService.createNotification(employee._id, "You have successfully updated your profile.");

            // 2. Notify HR Managers
            // Find all employees who have the HR_MANAGER role
            const hrManagers = await this.empRoleModel.find({
                roles: SystemRole.HR_MANAGER,
                isActive: true
            }).populate('employeeProfileId');

            for (const record of hrManagers) {
                if (record.employeeProfileId) {
                    const hrId = (record.employeeProfileId as any)._id;
                    // Avoid duplicate notification if the employee is also an HR Manager updating their own profile
                    if (hrId.toString() !== employee._id.toString()) {
                        await this.notificationService.createNotification(hrId, message);
                    }
                }
            }

        } catch (error) {
            console.error("Failed to send profile update notifications:", error);
            // We do not throw here, so the update itself remains successful
        }

        return updatedEmployee;
    }


    async updateEmployeeAdmin(id: string, dto: UpdateEmployeeAdminDto, user: any) {
        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        const { permissions, roles, ...profileData } = dto;

        // Clean up empty strings for ObjectIds to avoid CastError
        const idFields = [
            'primaryPositionId',
            'primaryDepartmentId',
            'supervisorPositionId',
            'payGradeId',
            'lastAppraisalRecordId',
            'lastAppraisalCycleId',
            'lastAppraisalTemplateId'
        ];

        idFields.forEach(field => {
            if (profileData[field] === '') {
                profileData[field] = null;
            } else if (profileData[field] && typeof profileData[field] === 'string' && Types.ObjectId.isValid(profileData[field])) {
                profileData[field] = new Types.ObjectId(profileData[field]);
            }

        });

        // Handle address fields - merge with existing address instead of replacing
        const { streetAddress, city, country, ...restData } = profileData;
        if (streetAddress !== undefined || city !== undefined || country !== undefined) {
            // Fetch existing employee to get current address
            const existingEmployee = await this.empModel.findById(id);
            const currentAddress = existingEmployee?.address || {};

            restData['address'] = {
                streetAddress: streetAddress !== undefined ? streetAddress : currentAddress.streetAddress,
                city: city !== undefined ? city : currentAddress.city,
                country: country !== undefined ? country : currentAddress.country
            };
        }

        // Handle Pay Grade Name Input
        if (dto.payGradeName) {
            const gradeName = dto.payGradeName.trim();
            // 1. Try to find existing pay grade
            let payGradeDoc = await this.payrollConfigService.getAllPayGrades().then(grades =>
                grades.find(g => g.grade === gradeName)
            );

            // 2. If not found, create it as DRAFT with defaults
            if (!payGradeDoc) {
                try {
                    payGradeDoc = await this.payrollConfigService.createPayGrade({
                        grade: gradeName,
                        baseSalary: 6000,
                        grossSalary: 6000,
                    });
                } catch (err) {
                    // Fallback/log if creation fails (e.g. valid checks)
                    console.error("Failed to auto-create pay grade:", err);
                    throw new BadRequestException(`Failed to create new pay grade '${gradeName}': ${err.message}`);
                }
            }

            // 3. Assign the ID
            if (payGradeDoc) {
                restData.payGradeId = payGradeDoc._id as any;
            }
        }

        // Fetch current state BEFORE update to detect changes
        const oldEmployee = await this.empModel.findById(id);

        // Update profile
        const updatedProfile = await this.employeeModel.findByIdAndUpdate(id, restData, { new: true });

        // HISTORY TRACKING LOGIC (Position & Department)
        try {
            if (oldEmployee && updatedProfile) {
                // --- Position Change Tracking ---
                const oldPosId = oldEmployee.primaryPositionId ? oldEmployee.primaryPositionId.toString() : null;
                const newPosId = updatedProfile.primaryPositionId ? updatedProfile.primaryPositionId.toString() : null;

                if (oldPosId !== newPosId) {
                    // 1. Archive Old Position
                    if (oldPosId) {
                        const closed = await this.positionAssignmentModel.updateMany(
                            {
                                employeeProfileId: oldEmployee._id,
                                positionId: oldEmployee.primaryPositionId,
                                endDate: { $exists: false }
                            },
                            { $set: { endDate: new Date(), reason: 'Position Change (Closed)' } }
                        );

                        // If no active record found, create one and close it immediately (Audit gap filler)
                        if (closed.modifiedCount === 0) {
                            try {
                                await this.positionAssignmentModel.create({
                                    employeeProfileId: oldEmployee._id,
                                    positionId: oldEmployee.primaryPositionId,
                                    departmentId: oldEmployee.primaryDepartmentId,
                                    startDate: oldEmployee.contractStartDate || oldEmployee.dateOfHire || new Date(),
                                    endDate: new Date(),
                                    reason: 'Position Change (Archived)',
                                    notes: `Position changed to ${updatedProfile.primaryPositionId || 'None'}`
                                });
                            } catch (innerErr) {
                                console.warn('Failed to create archive position log', innerErr);
                            }
                        }
                    }

                    // 2. Create New Active Position
                    if (newPosId) {
                        await this.positionAssignmentModel.create({
                            employeeProfileId: oldEmployee._id,
                            positionId: updatedProfile.primaryPositionId,
                            departmentId: updatedProfile.primaryDepartmentId, // Can be null if optional
                            startDate: new Date(),
                            reason: 'Position Change (New)',
                            notes: `Position changed from ${oldPosId || 'None'}`
                        });
                    }
                }

                // --- Department Change Tracking ---
                const oldDeptId = oldEmployee.primaryDepartmentId ? oldEmployee.primaryDepartmentId.toString() : null;
                const newDeptId = updatedProfile.primaryDepartmentId ? updatedProfile.primaryDepartmentId.toString() : null;

                if (oldDeptId !== newDeptId) {
                    // 1. Archive Old Department
                    if (oldDeptId) {
                        const closed = await this.departmentAssignmentModel.updateMany(
                            {
                                employeeProfileId: oldEmployee._id,
                                departmentId: oldEmployee.primaryDepartmentId,
                                endDate: { $exists: false }
                            },
                            { $set: { endDate: new Date(), reason: 'Department Change (Closed)' } }
                        );

                        if (closed.modifiedCount === 0) {
                            try {
                                await this.departmentAssignmentModel.create({
                                    employeeProfileId: oldEmployee._id,
                                    departmentId: oldEmployee.primaryDepartmentId,
                                    positionId: oldEmployee.primaryPositionId,
                                    startDate: oldEmployee.contractStartDate || oldEmployee.dateOfHire || new Date(),
                                    endDate: new Date(),
                                    reason: 'Department Change (Archived)',
                                    notes: `Department changed to ${updatedProfile.primaryDepartmentId || 'None'}`
                                });
                            } catch (innerErr) {
                                console.warn('Failed to create archive department log', innerErr);
                            }
                        }
                    }

                    // 2. Create New Active Department
                    if (newDeptId) {
                        await this.departmentAssignmentModel.create({
                            employeeProfileId: oldEmployee._id,
                            departmentId: updatedProfile.primaryDepartmentId,
                            positionId: updatedProfile.primaryPositionId,
                            startDate: new Date(),
                            reason: 'Department Change (New)',
                            notes: `Department changed from ${oldDeptId || 'None'}`
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to track position/department history:", error);
            // Valid to fail silently as it shouldn't block the main update
        }

        return updatedProfile;

        // Update permissions/roles if provided
        if (permissions !== undefined || roles !== undefined) {
            const updateData: any = { isActive: true };
            if (permissions !== undefined) updateData.permissions = permissions;
            if (roles !== undefined) updateData.roles = roles;

            await this.empRoleModel.findOneAndUpdate(
                { employeeProfileId: new Types.ObjectId(id) },
                updateData,
                { upsert: true }
            );
        }

        // NOTIFICATION LOGIC
        try {
            // Notify the employee that their profile was updated by an admin/manager
            const message = `Your profile has been updated by an administrator.`;
            await this.notificationService.createNotification(id, message);
        } catch (error) {
            console.error("Failed to send admin profile update notification:", error);
            // We do not throw here, so the update itself remains successful
        }

        return updatedProfile;
    }

    // ----------------------------- //
    //     PROFILE CHANGE REQUESTS   //
    // ----------------------------- //

    async createChangeRequest(employeeNumber: string, dto: CreateEmployeeChangeRequestDto, user: any) {
        //debug
        console.log("logged in emp no: ", user.employeeNumber)
        console.log("in url emp no:", employeeNumber);
        console.log("equal?", user.employeeNumber === employeeNumber);

        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only submit change requests for yourself.");
        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");

        // if (!Types.ObjectId.isValid(employee._id))
        //     throw new BadRequestException('Invalid employee ID');

        const requestId = `REQ-${Date.now()}`;

        const changeRequest = await this.changeReqModel.create({
            requestId,
            employeeProfileId: employee._id,
            requestDescription: dto.requestDescription,
            reason: dto.reason,
            status: ProfileChangeStatus.PENDING,
            submittedAt: new Date(),
        });

        // NOTIFICATION LOGIC
        try {
            const message = `Employee ${employee.firstName} ${employee.lastName} submitted a profile change request (${requestId}).`;

            // Notify HR Managers
            const hrManagers = await this.empRoleModel.find({
                roles: SystemRole.HR_MANAGER,
                isActive: true
            }).populate('employeeProfileId');

            for (const record of hrManagers) {
                if (record.employeeProfileId) {
                    const hrId = (record.employeeProfileId as any)._id;
                    await this.notificationService.createNotification(hrId, message);
                }
            }

        } catch (error) {
            console.error("Failed to send change request notifications:", error);
            // We do not throw here, so the request creation itself remains successful
        }

        return changeRequest;
    }

    async createLegalChangeRequest(employeeNumber: string, dto: CreateLegalChangeRequestDto, user: any) {
        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only submit change requests for yourself.");

        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");

        const requestId = `LEGAL-REQ-${Date.now()}`;

        // Build description from the requested changes
        const changes: string[] = [];
        if (dto.newLegalFirstName) changes.push(`Legal First Name: ${dto.newLegalFirstName}`);
        if (dto.newLegalLastName) changes.push(`Legal Last Name: ${dto.newLegalLastName}`);
        if (dto.newMaritalStatus) changes.push(`Marital Status: ${dto.newMaritalStatus}`);

        const requestDescription = `Legal/Marital Status Change Request:\n${changes.join('\n')}`;

        const changeRequest = await this.changeReqModel.create({
            requestId,
            employeeProfileId: employee._id,
            requestDescription,
            reason: dto.reason,
            status: ProfileChangeStatus.PENDING,
            submittedAt: new Date(),
        });

        // NOTIFICATION LOGIC
        try {
            const message = `Employee ${employee.firstName} ${employee.lastName} submitted a legal/marital status change request (${requestId}).`;

            // Notify HR Managers
            const hrManagers = await this.empRoleModel.find({
                roles: SystemRole.HR_MANAGER,
                isActive: true
            }).populate('employeeProfileId');

            for (const record of hrManagers) {
                if (record.employeeProfileId) {
                    const hrId = (record.employeeProfileId as any)._id;
                    await this.notificationService.createNotification(hrId, message);
                }
            }

        } catch (error) {
            console.error("Failed to send legal change request notifications:", error);
            // We do not throw here, so the request creation itself remains successful
        }

        return changeRequest;
    }

    async getMyChangeRequests(employeeNumber: string, user: any) {
        if (user.employeeNumber !== employeeNumber)
            throw new ForbiddenException("You can only view your own change requests.");

        const employee = await this.empModel.findOne({ employeeNumber });
        if (!employee) throw new NotFoundException("Employee not found");

        return this.changeReqModel
            .find({ employeeProfileId: employee._id })
            .populate('employeeProfileId')
            .lean();
    }


    async listChangeRequests(user: any) {
        if (user.roles.includes(SystemRole.HR_MANAGER) || user.roles.includes(SystemRole.HR_ADMIN)) {
            return this.changeReqModel
                .find()
                .populate('employeeProfileId')
                .lean();
        }
        if (user.roles.includes(SystemRole.HR_EMPLOYEE)) {
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

    async getChangeRequestById(requestId: string, user: any) {
        console.log(`[getChangeRequestById] RequestID: ${requestId}, User:`, user);

        if (!user) {
            console.error('[getChangeRequestById] User object is missing!');
            throw new InternalServerErrorException('User context missing');
        }

        // Fetch the request and populate employee info
        const request = await this.changeReqModel
            .findOne({ requestId })
            .populate('employeeProfileId')
            .lean();

        console.log('[getChangeRequestById] Fetched Request:', request ? 'Found' : 'Not Found');
        if (request) {
            console.log('[getChangeRequestById] EmployeeProfileId:', request.employeeProfileId);
        }

        if (!request) throw new NotFoundException('Change request not found');

        // Access control: HR roles can access any request
        const allowedHrRoles = [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE];
        const userRoles = user.roles || [];

        if (allowedHrRoles.some(role => userRoles.includes(role))) {
            return request;
        }

        // Otherwise, check if this request belongs to the logged-in user
        // Ensure employeeProfileId exists before accessing _id
        if (
            request.employeeProfileId &&
            request.employeeProfileId._id &&
            request.employeeProfileId._id.toString() === user.id
        ) {
            return request;
        }

        throw new ForbiddenException('Not allowed to view this request');
    }


    async reviewChangeRequest(
        requestId: string,
        action: ProfileChangeStatus,
        user: any,
        patch?: any
    ) {
        const req = await this.changeReqModel
            .findOne({ requestId })
            .populate('employeeProfileId')
            .lean();

        if (!req) throw new NotFoundException('Request not found');

        const employee = req.employeeProfileId;
        if (!employee) throw new BadRequestException('Employee record not found for this request');

        const empRole = await this.empRoleModel
            .findOne({ employeeProfileId: employee._id })
            .lean();
        if (!empRole) throw new NotFoundException('Role Connection not found');
        //------------------
        // access control
        //------------------
        const isOwner = req.employeeProfileId?._id
            ? req.employeeProfileId._id.toString() === user.id
            : req.employeeProfileId?.toString() === user.id;

        // Requester can CANCEL their own request
        if (action === ProfileChangeStatus.CANCELED) {
            if (!isOwner) {
                throw new ForbiddenException("Only the requester can cancel this request.");
            }
            if (req.status !== ProfileChangeStatus.PENDING) {
                throw new BadRequestException("Only pending requests can be canceled.");
            }
            // OK -> continue to actual update
        }
        else if (
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
        const update: any = { processedAt: new Date() };

        if (action === ProfileChangeStatus.APPROVED) update.status = ProfileChangeStatus.APPROVED;
        else if (action === ProfileChangeStatus.REJECTED) update.status = ProfileChangeStatus.REJECTED;
        else if (action === ProfileChangeStatus.CANCELED) update.status = ProfileChangeStatus.CANCELED;

        await this.changeReqModel.updateOne({ requestId }, update);

        if (action === ProfileChangeStatus.APPROVED && patch) {
            await this.empModel.findByIdAndUpdate(
                req.employeeProfileId,
                { ...patch, updatedAt: new Date() }
            );
        }

        // NOTIFICATION LOGIC
        try {
            const message = `Your change request (${requestId}) has been ${action}.`;
            // Notify the requesting employee
            const recipientId = req.employeeProfileId._id || req.employeeProfileId;
            await this.notificationService.createNotification(recipientId, message);
        } catch (error) {
            console.error("Failed to send review notification:", error);
            // Non-blocking
        }

        const reqUpdated = await this.changeReqModel.findOne({ requestId }).populate('employeeProfileId').lean();
        return reqUpdated;
    }

    async getEmployeesInDepartment(departmentId: string, user: any) {
        console.log(`[getEmployeesInDepartment] DeptID: '${departmentId}' (${typeof departmentId})`);
        console.log(`[getEmployeesInDepartment] User: ${user.employeeNumber}`);

        if (!departmentId) {
            console.error('[getEmployeesInDepartment] Department ID missing from token/profile.');
            throw new ForbiddenException("Department ID missing.");
        }

        let deptObjectId: Types.ObjectId | null = null;
        try {
            deptObjectId = new Types.ObjectId(departmentId);
        } catch (e) {
            console.warn('[getEmployeesInDepartment] Provided ID is not a valid ObjectId:', departmentId);
        }

        const hrRoles = [
            SystemRole.HR_MANAGER,
            SystemRole.HR_EMPLOYEE,
            SystemRole.HR_ADMIN,
            SystemRole.SYSTEM_ADMIN
        ];

        // Build query to be robust against string vs ObjectId mismatch
        const query: any = {
            $or: [
                { primaryDepartmentId: departmentId }
            ],
            employeeNumber: { $ne: user.employeeNumber },
            status: EmployeeStatus.ACTIVE
        };

        if (deptObjectId) {
            query.$or.push({ primaryDepartmentId: deptObjectId });
        }

        console.log('[getEmployeesInDepartment] Query Filter:', JSON.stringify(query));

        // Build base query
        const baseQuery = this.empModel.find(query);

        // Restricted view for Department Heads (unless they also have HR privileges)
        if (!user.roles.some(r => hrRoles.includes(r))) {
            return baseQuery
                .select('firstName lastName employeeNumber workEmail mobilePhone profilePictureUrl status primaryPositionId primaryDepartmentId')
                .populate('primaryPositionId')
                .populate('primaryDepartmentId')
                .lean();
        }

        // Full view for HR roles
        return baseQuery
            .populate('primaryPositionId')
            .populate('primaryDepartmentId')
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


    async getUniquePermissions(): Promise<string[]> {
        return this.empRoleModel.distinct('permissions');
    }

    async deactivateEmployee(id: string, status: EmployeeStatus, user: any) {
        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        // Validate Status - must be an inactive status
        const inactiveStatuses = [
            EmployeeStatus.TERMINATED,
            EmployeeStatus.RETIRED,
            EmployeeStatus.INACTIVE,
            EmployeeStatus.SUSPENDED // Maybe? Let's include it.
        ];

        if (!inactiveStatuses.includes(status)) {
            throw new BadRequestException(`Invalid deactivation status. Must be one of: ${inactiveStatuses.join(', ')}`);
        }

        const emp = await this.empModel.findById(id);
        if (!emp) throw new NotFoundException('Employee not found');

        // 1. Update Employee Profile Status
        emp.status = status;
        emp.statusEffectiveFrom = new Date();
        await emp.save();

        // 2. Disable System Access (isActive = false)
        await this.empRoleModel.findOneAndUpdate(
            { employeeProfileId: emp._id },
            { isActive: false },
            { new: true }
        );

        console.log(`[Deactivate] Employee ${emp.employeeNumber} deactivated by ${user.employeeNumber}. Status: ${status}, Access Revoked.`);

        return {
            message: 'Employee deactivated successfully',
            employee: emp
        };
    }

    async reactivateEmployee(id: string, user: any) {
        if (!Types.ObjectId.isValid(id))
            throw new BadRequestException('Invalid employee ID');

        const emp = await this.empModel.findById(id);
        if (!emp) throw new NotFoundException('Employee not found');

        if (emp.status === EmployeeStatus.ACTIVE) {
            throw new BadRequestException('Employee is already active');
        }

        // 1. Update Employee Profile Status
        emp.status = EmployeeStatus.ACTIVE;
        emp.statusEffectiveFrom = new Date();
        await emp.save();

        // 2. Restore System Access (isActive = true)
        await this.empRoleModel.findOneAndUpdate(
            { employeeProfileId: emp._id },
            { isActive: true },
            { new: true }
        );

        console.log(`[Reactivate] Employee ${emp.employeeNumber} reactivated by ${user.employeeNumber}. Access Restored.`);

        return {
            message: 'Employee reactivated successfully',
            employee: emp
        };
    }
}
