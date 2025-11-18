import mongoose from 'mongoose';
import {AppraisalTemplateSchema} from '../performance-optimization/models/appraisalTemplate.schema';
import {AppraisalCycleSchema} from '../performance-optimization/models/appraisalCycle.schema';
import {EmployeeAppraisalSchema} from '../performance-optimization/models/employeeAppraisal.schema';
import {AppraisalDisputeSchema} from '../performance-optimization/models/appraisalDispute.schema';
import {AppraisalHistorySchema} from '../performance-optimization/models/aprraisalhistory.schema';

// Other existing collections
import { EmployeeSchema } from '../employee-profile/models/employee.schema';
import { DepartmentManagerSchema } from '../employee-profile/models/departmentManager.schema';
import { HRManagerSchema } from '../employee-profile/models/hrmanager.schema';

async function main() {
  await mongoose.connect(
    'mongodb+srv://kanzy:UKNASQYpMP8fhSfS@hrcuster.fqiw4vw.mongodb.net/test?retryWrites=true&w=majority'
  );

  console.log('Connected to MongoDB: test');

  const Employee = mongoose.model('Employee', EmployeeSchema);
  const DepartmentManager = mongoose.model('DepartmentManager', DepartmentManagerSchema);
  const HRManager = mongoose.model('HRManager', HRManagerSchema);

  const AppraisalTemplate = mongoose.model('AppraisalTemplate', AppraisalTemplateSchema);
  const AppraisalCycle = mongoose.model('AppraisalCycle', AppraisalCycleSchema);
  const EmployeeAppraisal = mongoose.model('EmployeeAppraisal', EmployeeAppraisalSchema);
  const AppraisalDispute = mongoose.model('AppraisalDispute', AppraisalDisputeSchema);
  const AppraisalHistory = mongoose.model('AppraisalHistory', AppraisalHistorySchema);

  //bc i alr created employees managers and hr in main seed file
  const employee = await Employee.findOne();
  const manager = await DepartmentManager.findOne();
  const hr = await HRManager.findOne();

  if (!employee || !manager || !hr) {
    console.error('Missing employee, manager, or HR manager. Run main seed first.');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Create Appraisal Template
  // ---------------------------------------------------------------------------
  const template = await AppraisalTemplate.create({
    templateId: 'T001',
    templateName: 'General Annual Appraisal Template',
    description: 'Standard company-wide yearly appraisal format.',
    ratingScale: [
      {
        label: 'Excellent',
        value: 5,
        criteria: [
          {
            criteriaName: 'Communication',
            criteriaWeight: 30,
            description: 'Effectiveness in communication.',
            minScore: 1,
            maxScore: 5,
          },
          {
            criteriaName: 'Technical Skills',
            criteriaWeight: 40,
            description: 'Coding / engineering performance.',
          },
          {
            criteriaName: 'Teamwork',
            criteriaWeight: 30,
          },
        ],
      },
      {
        label: 'Good',
        value: 4,
        criteria: [],
      },
    ],
    assignedDepartments: [],
    assignedPositions: [],
    createdBy: hr._id,
    isActive: true,
  });

  console.log('Template created');

  // ---------------------------------------------------------------------------
  // 5Create Appraisal Cycle
  // ---------------------------------------------------------------------------
  const cycle = await AppraisalCycle.create({
    cycleId: 'CYCLE2025',
    cycleName: 'Annual Review 2025',
    description: 'Full-year performance evaluation.',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    submissionDeadline: new Date('2025-12-20'),
    publicationDate: new Date('2026-01-10'),
    status: 'Draft',
    templateId: template._id,
    cycleType: 'annual',
    departments: [],
    employees: [employee._id],
    createdBy: hr._id,
    isPublished: false,
  });

  console.log('Appraisal cycle created');

  // ---------------------------------------------------------------------------
  // Create Employee Appraisal
  // ---------------------------------------------------------------------------
  const appraisal = await EmployeeAppraisal.create({
    appraisalId: 'A001',
    cycleId: cycle._id,
    employeeId: employee._id,
    reviewedBy: manager._id,
    templateId: template._id,
    sections: [
      {
        sectionTitle: 'Performance Overview',
        ratings: [
          {
            questionText: 'How well does the employee communicate?',
            ratingValue: 4,
            managerComment: 'Good communication overall.',
            attendanceScore: 90,
            punctualityScore: 88,
          },
          {
            questionText: 'Technical skill assessment',
            ratingValue: 5,
            managerComment: 'Excellent programming abilities.',
          },
        ],
      },
    ],
    overallRating: 4.5,
    overallComments: 'Strong year with consistent high-quality work.',
    developmentRecommendations: [
      {
        recommendation: 'Attend leadership workshop',
        priority: 'MEDIUM',
        targetDate: new Date('2026-06-01'),
      },
    ],
    status: 'Submitted',
    submittedAt: new Date(),
  });

  console.log('Employee appraisal created');

  // ---------------------------------------------------------------------------
  // Create Appraisal Dispute
  // ---------------------------------------------------------------------------
  const dispute = await AppraisalDispute.create({
    disputeId: 'D001',
    appraisalId: appraisal._id,
    raisedBy: employee._id,
    disputeReason: 'I disagree with the technical skill score.',
    submittedAt: new Date(),
    status: 'Pending',
    originalRating: 4.5,
  });

  console.log('Dispute created');

  // Link dispute to appraisal
  appraisal.disputeId = dispute._id;
  appraisal.hasDispute = true;
  await appraisal.save();

  // ---------------------------------------------------------------------------
  // Create Appraisal History
  // ---------------------------------------------------------------------------
  await AppraisalHistory.create({
    historyId: 'H001',
    employeeId: employee._id,
    appraisalId: appraisal._id,
    cycleId: cycle._id,
    archivedAt: new Date(),
    finalRating: appraisal.overallRating,
    snapshotData: appraisal.toObject(),
    appraisalType: 'Annual',
    cycleName: cycle.cycleName,
    reviewedBy: manager.managerId,
    hasDispute: true,
    disputeResolution: 'Pending review',
  });

  console.log('Appraisal history created');
  console.log('All appraisal-related dummy data inserted successfully!');

  process.exit(0);
}

main().catch(console.error);
