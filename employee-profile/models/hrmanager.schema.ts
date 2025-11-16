import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../enums/employee.enum';
import { ApprovalPriority, HRManagerAction, HRManagerPermission } from '../enums/hrmanager.enum';
import { BasePerson } from 'person.schema';

export type HRManagerDocument = HydratedDocument<HRManager>;

/**
 * HR Manager Schema
 * 
 * This schema represents HR Managers who have administrative access to:
 * - Review and approve employee profile change requests (US-E2-03)
 * - Edit any part of an employee's profile (US-EP-04)
 * - Deactivate employee profiles (US-EP-05)
 * - Assign roles and access permissions (US-E7-05)
 * - Search for employee data (US-E6-03)
 * 
 * All actions are audit-trailed per BR 22
 */
@Schema({ timestamps: true })
export class HRManager extends BasePerson{
  // Authentication & Identification
  @Prop({ required: true, unique: true })
  hrManagerId: string;

  @Prop({ required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email: string;

  // Role & Permissions (US-E7-05)
  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.HR,
    required: true,
  })
  role: Role;

  //Status
  @Prop({ default: true }) isActive: boolean;

  // @Prop({
  //   type: [String],
  //   enum: Object.values(HRManagerPermission),
  //   default: [
  //     HRManagerPermission.VIEW_EMPLOYEE_PROFILES,
  //     HRManagerPermission.EDIT_EMPLOYEE_PROFILES,
  //     HRManagerPermission.APPROVE_CORRECTION_REQUESTS,
  //     HRManagerPermission.DEACTIVATE_EMPLOYEES,
  //     HRManagerPermission.ASSIGN_ROLES,
  //     HRManagerPermission.SEARCH_EMPLOYEES,
  //     HRManagerPermission.VIEW_AUDIT_LOGS,
  //   ],
  // })
  // permissions: HRManagerPermission[];

  // Department Assignment (if HR Manager is assigned to specific departments)
  @Prop({
    type: [String],
    default: [],
  })
  assignedDepartments?: string[]; // Department IDs from Org Structure module

  @Prop()
  lastLoginAt?: Date;

  // Audit Trail for HR Manager Actions (BR 22)
  @Prop({
    type: [
      {
        action: {
          type: String,
          enum: Object.values(HRManagerAction),
        },
        targetEmployeeId: String,
        targetField: String, // Field that was modified
        oldValue: MongooseSchema.Types.Mixed,
        newValue: MongooseSchema.Types.Mixed,
        reason: String, // Justification for the action
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
      },
    ],
    default: [],
  })
  actionHistory: {
    action: HRManagerAction;
    targetEmployeeId: string;
    targetField?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    timestamp: Date;
    ipAddress?: string;
  }[];

  // Pending Tasks Queue (for tracking correction requests to review)
  @Prop({
    type: [
      {
        employeeId: String,
        requestId: String, // Reference to correction request
        fieldName: String,
        requestedValue: String,
        submittedAt: Date,
        priority: {
          type: String,
          enum: Object.values(ApprovalPriority),
          default: ApprovalPriority.MEDIUM,
        },
      },
    ],
    default: [],
  })
  pendingApprovals: {
    employeeId: string;
    requestId: string;
    fieldName: string;
    requestedValue: string;
    submittedAt: Date;
    priority: ApprovalPriority;
  }[];

  // System Configuration Access (US-E7-04)
  @Prop({ default: false })
  canConfigureWorkflowRules: boolean;

  @Prop({ default: false })
  canManageSystemSettings: boolean;
}

export const HRManagerSchema = SchemaFactory.createForClass(HRManager);

// Indexes for performance
HRManagerSchema.index({ email: 1 });
HRManagerSchema.index({ hrManagerId: 1 });
HRManagerSchema.index({ isActive: 1 });
HRManagerSchema.index({ 'actionHistory.timestamp': -1 }); // For audit log queries

