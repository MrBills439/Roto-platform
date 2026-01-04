export type Role = "ADMIN" | "MANAGER" | "TEAM_LEADER" | "STAFF";
export type Gender = "M" | "F" | "OTHER" | "NA";
export type ShiftType = "LONG_DAY" | "MID_DAY" | "WAKE_NIGHT" | "SLEEP_IN" | "CUSTOM";

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    role: Role;
    fullName: string;
    email: string;
  };
};

export type House = {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  gender: Gender | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type Shift = {
  id: string;
  houseId: string;
  name: string | null;
  shiftType: ShiftType;
  shiftDate: string;
  startTime: string;
  endTime: string;
  requiredStaffCount: number;
  notes: string | null;
  lastEditedById: string | null;
  lastEditedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentCreateResponse = {
  id: string;
  shiftId: string;
  staffUserId: string;
  staffName: string;
  staffGender: Gender;
};

export type AssignmentDeleteResponse = { id: string };

export type AssignmentListItem = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  shift: {
    id: string;
    name: string | null;
    shiftType: ShiftType;
    shiftDate: string;
    house: {
      id: string;
      name: string;
    };
  };
};

export type RotaWeekResponse = {
  weekStart: string;
  weekEnd: string;
  houses: Array<{
    id: string;
    name: string;
    location: string;
    shifts: Array<{
      id: string;
      shiftDate: string;
      startTime: string;
      endTime: string;
      endsNextDay: boolean;
      shiftType: ShiftType;
      requiredStaffCount: number;
      assignments: Array<{
        id: string;
        staffUserId: string;
        staffName: string;
        staffGender: Gender;
      }>;
      lastEditedBy?: { id: string; name: string };
      lastEditedAt?: string;
    }>;
  }>;
};

export type Availability = {
  id: string;
  userId: string;
  type: \"AVAILABLE\" | \"UNAVAILABLE\" | \"LEAVE\";
  startDate: string;
  endDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; role: Role };
};

export type OpenShift = Shift & { assignedCount: number; openSlots: number };

export type ShiftApplication = {
  id: string;
  shiftId: string;
  userId: string;
  status: \"PENDING\" | \"APPROVED\" | \"REJECTED\";
  decidedById: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  shift: Shift;
  user: { id: string; firstName: string; lastName: string; email: string };
};

export type ShiftTemplate = {
  id: string;
  name: string;
  createdById: string;
  createdAt: string;
  items: Array<{
    id: string;
    templateId: string;
    houseId: string;
    name: string | null;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    requiredStaffCount: number;
    dayOfWeek: number;
  }>;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
};
