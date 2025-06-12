# Staff Management API Documentation

## Overview

The Staff Management API provides endpoints for managing studio staff, including hiring, training, assignment, and performance tracking. This system is crucial for maintaining studio operations and ensuring project quality.

## API Endpoints

### Staff Operations

#### Get All Staff
```typescript
GET /api/staff
```
Returns a list of all staff members in the studio.

**Response:**
```typescript
{
  staff: StaffMember[];
  total: number;
  available: number;
  assigned: number;
}
```

#### Get Staff Member
```typescript
GET /api/staff/:id
```
Returns detailed information about a specific staff member.

**Response:**
```typescript
{
  staff: StaffMember;
  performance: StaffPerformance;
  assignments: ProjectAssignment[];
}
```

#### Hire Staff Member
```typescript
POST /api/staff/hire
```
Hires a new staff member for the studio.

**Request Body:**
```typescript
{
  type: StaffType;
  skills: StaffSkill[];
  experience: number;
  salary: number;
}
```

**Response:**
```typescript
{
  staff: StaffMember;
  cost: number;
  message: string;
}
```

#### Train Staff Member
```typescript
POST /api/staff/:id/train
```
Initiates training for a staff member to improve their skills.

**Request Body:**
```typescript
{
  skill: StaffSkill;
  duration: number;
  cost: number;
}
```

**Response:**
```typescript
{
  staff: StaffMember;
  improvement: number;
  cost: number;
  message: string;
}
```

#### Assign Staff Member
```typescript
POST /api/staff/:id/assign
```
Assigns a staff member to a project.

**Request Body:**
```typescript
{
  projectId: string;
  role: ProjectRole;
  duration: number;
}
```

**Response:**
```typescript
{
  assignment: ProjectAssignment;
  message: string;
}
```

#### Update Staff Status
```typescript
PATCH /api/staff/:id/status
```
Updates a staff member's status (available, assigned, training, etc.).

**Request Body:**
```typescript
{
  status: StaffStatus;
  reason?: string;
}
```

**Response:**
```typescript
{
  staff: StaffMember;
  message: string;
}
```

## Data Types

### StaffMember
```typescript
interface StaffMember {
  id: string;
  name: string;
  type: StaffType;
  skills: StaffSkill[];
  experience: number;
  salary: number;
  status: StaffStatus;
  performance: StaffPerformance;
  hireDate: Date;
  lastTraining: Date;
  currentAssignment?: string;
}
```

### StaffPerformance
```typescript
interface StaffPerformance {
  quality: number;
  efficiency: number;
  reliability: number;
  innovation: number;
  leadership: number;
  lastEvaluation: Date;
}
```

### ProjectAssignment
```typescript
interface ProjectAssignment {
  projectId: string;
  role: ProjectRole;
  startDate: Date;
  endDate: Date;
  status: AssignmentStatus;
  performance: number;
}
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

Common error codes:
- `STAFF_NOT_FOUND`: Staff member not found
- `INVALID_ASSIGNMENT`: Invalid project assignment
- `INSUFFICIENT_FUNDS`: Not enough money for operation
- `STAFF_UNAVAILABLE`: Staff member not available
- `INVALID_TRAINING`: Invalid training request

## Rate Limiting

- Maximum 100 requests per minute per client
- Maximum 1000 requests per hour per client

## Authentication

All endpoints require authentication using a valid API key in the request header:

```
Authorization: Bearer <api_key>
```

## Best Practices

1. **Staff Assignment**
   - Check staff availability before assignment
   - Consider staff skills and experience
   - Monitor assignment duration
   - Track performance metrics

2. **Training Management**
   - Balance training costs with benefits
   - Schedule training during downtime
   - Focus on critical skills first
   - Track training effectiveness

3. **Performance Monitoring**
   - Regular evaluation of staff performance
   - Track project outcomes
   - Monitor skill development
   - Adjust assignments based on performance

4. **Resource Management**
   - Maintain optimal staff-to-project ratio
   - Balance salary costs with productivity
   - Plan for staff development
   - Monitor overall studio efficiency 