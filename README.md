# Employee Profile Module (Backend)

## Overview
This module handles employee management, self-service profile updates, change requests, and candidate management. Integrated with the Time Management module for notification logging.

## 1. Employee Management
### US-E2-04: View Profile
- **Controller:** `EmployeeProfileController.getMyProfile` / `getOne`
- **Service:** `EmployeeProfileService.getMyProfile` / `getEmployee`
- **Access:** Users can view their own; HR/Dept Heads view others based on permission.

### US-EP-05: Deactivation
- **Controller:** `deactivateEmployee` (`PATCH /:id/deactivate`)
- **Service:** `deactivateEmployee` (Handles termination logic)

## 2. Self-Service Updates (Immediate)
### US-E2-05 & US-E2-12
- **Endpoint:** `PUT /:employeeNumber/my-profile/immediate`
- **Service:** `updateEmployeeSelfImmediate`
- **Fields:** `profilePictureUrl`, `biography`, `address`, `personalEmail`, `mobilePhone`
- **Notifications:** 
  - Employee receives: "You have successfully updated your profile."
  - All HR Managers receive: "Employee [Name] updated their profile."

## 3. Change Requests (Workflow)
### US-E6-02 & US-E2-06
- **Endpoints:** 
  - `POST .../change-request` (General data)
  - `POST .../legal-change-request` (Legal name, marital status)
- **Service:** `createChangeRequest`, `createLegalChangeRequest`
- **Review:** HR Admins review via `POST .../review` (`APPROVE` patches data, `REJECT` closes request).
- **Notifications:**
  - All HR Managers receive notification when change requests are submitted
  - Includes request ID for tracking

## 4. Manager Access
### US-E4-01 & US-E4-02
- **Endpoint:** `GET /my-employees`
- **Service:** `getEmployeesInDepartment` (Restricted to `DEPARTMENT_HEAD`)

## 5. Administration
### US-EP-04 & US-E7-05
- **Endpoint:** `PUT /:id/admin`
- **Service:** `updateEmployeeAdmin`
- **Access:** HR Managers and HR Admins only (System Admin excluded)
- **Capabilities:** 
  - Full profile edit including personal info, contact details, address, banking, professional info
  - Contract and employment status management
  - Organizational assignment (position, department, supervisor, pay grade)
  - Role/Permission assignment
  - Address field merging (preserves existing fields when updating partial data)
- **Notifications:**
  - Employee receives: "Your profile has been updated by an administrator."

## 6. Cross-Module Integration
- **Time Management Module:** Exports `NotificationService` for logging notifications
- **Employee Profile Module:** Imports `TimeManagementModule` to access notification functionality
