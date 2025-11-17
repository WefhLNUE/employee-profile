import mongoose from 'mongoose';
import { DepartmentManagerSchema } from '../employee-profile/models/departmentManager.schema';
import { PositionSchema } from '../organizational-structure/models/position.schema';
import { EmployeeSchema } from '../employee-profile/models/employee.schema';
import { HRManagerSchema } from '../employee-profile/models/hrmanager.schema';
import { AppraisalTemplateSchema } from '../performance-optimization/models/appraisalTemplate.schema';
import { AppraisalCycleSchema } from '../performance-optimization/models/appraisalCycle.schema';
import { EmployeeAppraisalSchema } from '../performance-optimization/models/employeeAppraisal.schema';
import { AppraisalDisputeSchema } from '../performance-optimization/models/appraisalDispute.schema';
import { AppraisalHistorySchema } from '../performance-optimization/models/aprraisalhistory.schema';
import { OrgNotificationSchema } from '../organizational-structure/models/orgChangeNotification.schema';
import { StructuralChangeRequestSchema } from '../organizational-structure/models/structuralChangeRequest.schema';
import { DepartmentSchema } from '../organizational-structure/models/department.schema';
import mongooseModule from 'mongoose';

async function main() {
  await mongoose.connect(
    'mongodb+srv://kanzy:UKNASQYpMP8fhSfS@hrcuster.fqiw4vw.mongodb.net/yourDatabaseName?retryWrites=true&w=majority'
  );
  console.log('Connected to MongoDB');

  const Department = mongoose.model('Department', DepartmentSchema);
  const Position = mongoose.model('Position', PositionSchema);
  const Employee = mongoose.model('Employee', EmployeeSchema);
  const DepartmentManager = mongoose.model('DepartmentManager', DepartmentManagerSchema);
  const HRManager = mongoose.model('HRManager', HRManagerSchema);
  const AppraisalTemplate = mongoose.model('AppraisalTemplate', AppraisalTemplateSchema);
  const AppraisalCycle = mongoose.model('AppraisalCycle', AppraisalCycleSchema);
  const EmployeeAppraisal = mongoose.model('EmployeeAppraisal', EmployeeAppraisalSchema);
  const AppraisalDispute = mongoose.model('AppraisalDispute', AppraisalDisputeSchema);
  const AppraisalHistory = mongoose.model('AppraisalHistory', AppraisalHistorySchema);
  const OrgNotification = mongoose.model('OrgNotification', OrgNotificationSchema);
  const StructuralChangeRequest = mongoose.model('StructuralChangeRequest', StructuralChangeRequestSchema);

  // Clear existing data (optional)
  await Promise.all([
    Department.deleteMany({}),
    Position.deleteMany({}),
    Employee.deleteMany({}),
    DepartmentManager.deleteMany({}),
    HRManager.deleteMany({}),
    AppraisalTemplate.deleteMany({}),
    AppraisalCycle.deleteMany({}),
    EmployeeAppraisal.deleteMany({}),
    AppraisalDispute.deleteMany({}),
    AppraisalHistory.deleteMany({}),
    OrgNotification.deleteMany({}),
    StructuralChangeRequest.deleteMany({})
  ]);
  
  console.log('Collections cleared');
  
  // ------------------------------
  // Step 2: Create Dummy Departments
  // ------------------------------
   const department1 = await Department.create({
    departmentId: 'D001',
    name: 'Human Resources',
    departmentCode: 'HR',
    isActive: true,
    positions: [],
  });

  const department2 = await Department.create({
    departmentId: 'D002',
    name: 'Software Engineering',
    departmentCode: 'SE',
    isActive: true,
    positions: [],
  });

  // ------------------------------
  // Step 3: Create Dummy Positions
  // ------------------------------
  const position1 = await Position.create({
    title: 'HR Specialist',
    departmentId: department1.departmentId,
    code: 'HR1',
    payGrade: 'PG3',
  });

  const position2 = await Position.create({
    title: 'Software Engineer',
    departmentId: department2.departmentId,
    code: 'SE1',
    payGrade: 'PG4',
  });

   department1.positions.push(1); // Example numeric ID
  department2.positions.push(2);
  await department1.save();
  await department2.save();
  // ------------------------------
  // Step 4: Create a Dummy Department Manager
  // ------------------------------
  const deptManager1 = await DepartmentManager.create({
    managerId: 'DM001',
    managerDepartment: department1.departmentId,
    managerPosition: position1._id,
    firstName: 'John',
    lastName: 'Doe',
    emailOfficial: 'john.doe@company.com',
    password: 'password123',
    phoneNumber: '0123456789',
    teamMembers: [],
    summary: { totalTeamSize: 0, positionsCount: {}, departmentsCount: {}, payGradesCount: {} },
  });

  const deptManager2 = await DepartmentManager.create({
    managerId: 'DM002',
    managerDepartment: department2.departmentId,
    managerPosition: position2._id,
    firstName: 'Jane',
    lastName: 'Smith',
    emailOfficial: 'jane.smith@company.com',
    password: 'password123',
    phoneNumber: '0987654321',
    teamMembers: [],
    summary: { totalTeamSize: 0, positionsCount: {}, departmentsCount: {}, payGradesCount: {} },
  });

  // ------------------------------
  // Step 4: Create Employees
  // ------------------------------
  const employee1 = await Employee.create({
    employeeId: 'E001',
    firstName: 'Alice',
    lastName: 'Johnson',
    emailOfficial: 'alice.johnson@company.com',
    password: 'password123',
    phoneNumber: '0111122233',
    position: position1._id,
    department: department1.departmentId,
    reportsTo: deptManager1.managerId,
    employmentType: 'Full-time',
    currentStatus: 'Active',
  });

  const employee2 = await Employee.create({
    employeeId: 'E002',
    firstName: 'Bob',
    lastName: 'Williams',
    emailOfficial: 'bob.williams@company.com',
    password: 'password123',
    phoneNumber: '0445566778',
    position: position2._id,
    department: department2.departmentId,
    reportsTo: deptManager2.managerId,
    employmentType: 'Full-time',
    currentStatus: 'Active',
  });

  // ------------------------------
  // Step 6: Create Dummy HR Manager
  // ------------------------------
  const hrManager = await HRManager.create({
    hrManagerId: 'HR001',
    firstName: 'Alice',
    lastName: 'Brown',
    emailOfficial: 'alice.brown@company.com',
    password: 'password123',
    phoneNumber: '0112233445',
    assignedDepartments: [department1.departmentId, department2.departmentId],
    isActive: true,
  });

  console.log('Dummy data inserted!');
  process.exit(0);
}

main().catch(console.error);
