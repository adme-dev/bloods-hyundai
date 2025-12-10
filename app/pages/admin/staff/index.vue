<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Staff Management</h1>
        <p class="text-sm text-muted-foreground">Manage your dealership team and their access levels</p>
      </div>
      <Button @click="openAddModal">
        <Plus class="mr-2 h-4 w-4" /> Add staff member
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search staff..."
          class="pl-9"
        />
      </div>
      <Select v-model="filterDepartment">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          <SelectItem value="executive">Executive</SelectItem>
          <SelectItem value="sales">Sales</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
          <SelectItem value="service">Service</SelectItem>
          <SelectItem value="parts">Parts</SelectItem>
          <SelectItem value="admin">Administration</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Staff List -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Team Roster</CardTitle>
        <CardDescription>{{ filteredStaff.length }} of {{ staff.length }} staff members</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="member in filteredStaff" :key="member.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar class="h-9 w-9">
                    <AvatarImage :src="getGravatarUrl(member.email)" :alt="member.firstName" />
                    <AvatarFallback>{{ getInitials(member) }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium">{{ member.firstName }} {{ member.lastName }}</div>
                    <div class="text-sm text-muted-foreground">{{ member.email }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getRoleBadgeVariant(member.role)">
                  {{ formatRole(member.role) }}
                </Badge>
              </TableCell>
              <TableCell>
                <span class="text-sm text-muted-foreground">
                  {{ getDepartmentFromRole(member.role) }}
                </span>
              </TableCell>
              <TableCell>
                <Badge :variant="member.isActive ? 'default' : 'outline'">
                  {{ member.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="icon" @click="openEditModal(member)">
                    <PenSquare class="h-4 w-4" />
                  </Button>
                  <Button
                    :variant="member.isActive ? 'outline' : 'secondary'"
                    size="icon"
                    @click="toggleStatus(member)"
                    :disabled="member.id === currentUser?.id"
                    :title="member.id === currentUser?.id ? 'Cannot deactivate yourself' : (member.isActive ? 'Deactivate' : 'Activate')"
                  >
                    <Power class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!pending && filteredStaff.length === 0">
              <TableCell colspan="5">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  <template v-if="staff.length === 0">
                    No staff members found. Add your first team member to get started.
                  </template>
                  <template v-else>
                    No staff members match your filters.
                  </template>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="pending">
              <TableCell colspan="5">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  Loading staff directory...
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Add Staff Modal -->
    <Dialog :open="showAddModal" @update:open="showAddModal = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>Add a new team member to your dealership.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="addStaff" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>First Name</Label>
              <Input v-model="formData.firstName" required />
            </div>
            <div class="space-y-2">
              <Label>Last Name</Label>
              <Input v-model="formData.lastName" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Email</Label>
            <Input v-model="formData.email" type="email" required />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Department</Label>
              <Select v-model="formData.department" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="parts">Parts</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Role</Label>
              <Select v-model="formData.role" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <template v-for="role in getAvailableRoles(formData.department)" :key="role.value">
                    <SelectItem :value="role.value">{{ role.label }}</SelectItem>
                  </template>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="space-y-2">
            <Label>Temporary Password</Label>
            <Input v-model="formData.password" type="password" minlength="8" required />
            <p class="text-xs text-muted-foreground">Minimum 8 characters. User should change on first login.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddModal = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Adding...' : 'Add Staff' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Edit Staff Modal -->
    <Dialog :open="showEditModal" @update:open="showEditModal = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>Update staff member details and access level.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateStaff" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>First Name</Label>
              <Input v-model="editData.firstName" required />
            </div>
            <div class="space-y-2">
              <Label>Last Name</Label>
              <Input v-model="editData.lastName" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Email</Label>
            <Input v-model="editData.email" type="email" required />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Department</Label>
              <Select v-model="editData.department">
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="parts">Parts</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Role</Label>
              <Select v-model="editData.role" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <template v-for="role in getAvailableRoles(editData.department)" :key="role.value">
                    <SelectItem :value="role.value">{{ role.label }}</SelectItem>
                  </template>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="editData.isActive" :disabled="editData.id === currentUser?.id">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="true">Active</SelectItem>
                <SelectItem :value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="editData.id === currentUser?.id" class="text-xs text-muted-foreground">
              You cannot deactivate your own account.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEditModal = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Plus, PenSquare, Power, Search } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useToast } from '~/composables/useToast';
import { getGravatarUrl } from '~/utils/gravatar';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { toast } = useToast();

// Fetch staff data
const { data, pending, refresh } = await useFetch('/api/admin/staff');
const staff = computed(() => data.value?.staff || []);

// Get current user from auth state
const { data: authData } = await useFetch('/api/admin/auth/me');
const currentUser = computed(() => authData.value?.user);

// Filter state
const searchQuery = ref('');
const filterDepartment = ref('all');
const filterStatus = ref('all');

// Filtered staff list
const filteredStaff = computed(() => {
  return staff.value.filter((member: any) => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const email = member.email.toLowerCase();
      if (!fullName.includes(query) && !email.includes(query)) {
        return false;
      }
    }

    // Department filter
    if (filterDepartment.value !== 'all') {
      const memberDept = getDepartmentFromRole(member.role).toLowerCase();
      if (memberDept !== filterDepartment.value) {
        return false;
      }
    }

    // Status filter
    if (filterStatus.value !== 'all') {
      if (filterStatus.value === 'active' && !member.isActive) return false;
      if (filterStatus.value === 'inactive' && member.isActive) return false;
    }

    return true;
  });
});

// Modal states
const showAddModal = ref(false);
const showEditModal = ref(false);
const saving = ref(false);

// Form data for add modal
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  department: 'sales',
  role: 'sales',
  password: '',
});

// Form data for edit modal
const editData = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  role: '',
  isActive: true,
});

// Role definitions by department
const rolesByDepartment: Record<string, { value: string; label: string }[]> = {
  executive: [
    { value: 'dealer_admin', label: 'Dealer Admin' },
    { value: 'general_manager', label: 'General Manager' },
  ],
  sales: [
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'sales', label: 'Sales Consultant' },
  ],
  finance: [
    { value: 'finance_manager', label: 'Finance Manager' },
  ],
  service: [
    { value: 'service_manager', label: 'Service Manager' },
    { value: 'service_advisor', label: 'Service Advisor' },
    { value: 'technician', label: 'Technician' },
  ],
  parts: [
    { value: 'parts_manager', label: 'Parts Manager' },
    { value: 'parts', label: 'Parts Counter' },
  ],
  admin: [
    { value: 'dealer_admin', label: 'Administrator' },
  ],
};

// Get available roles based on department
const getAvailableRoles = (department: string) => {
  return rolesByDepartment[department] || rolesByDepartment.sales;
};

// When department changes in add form, reset role to first available
watch(() => formData.value.department, (newDept) => {
  const roles = getAvailableRoles(newDept);
  if (roles.length > 0) {
    formData.value.role = roles[0].value;
  }
});

// When department changes in edit form, reset role to first available
watch(() => editData.value.department, (newDept) => {
  const roles = getAvailableRoles(newDept);
  if (roles.length > 0 && !roles.some(r => r.value === editData.value.role)) {
    editData.value.role = roles[0].value;
  }
});

// Format role for display
const formatRole = (role: string) => {
  const roleLabels: Record<string, string> = {
    dealer_admin: 'Admin',
    general_manager: 'General Manager',
    sales_manager: 'Sales Manager',
    sales: 'Sales',
    finance_manager: 'Finance Manager',
    service_manager: 'Service Manager',
    service_advisor: 'Service Advisor',
    technician: 'Technician',
    parts_manager: 'Parts Manager',
    parts: 'Parts',
  };
  return roleLabels[role] || role;
};

// Get department from role
const getDepartmentFromRole = (role: string) => {
  const roleToDept: Record<string, string> = {
    dealer_admin: 'Executive',
    general_manager: 'Executive',
    sales_manager: 'Sales',
    sales: 'Sales',
    finance_manager: 'Finance',
    service_manager: 'Service',
    service_advisor: 'Service',
    technician: 'Service',
    parts_manager: 'Parts',
    parts: 'Parts',
  };
  return roleToDept[role] || 'General';
};

// Get badge variant based on role
const getRoleBadgeVariant = (role: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    dealer_admin: 'default',
    general_manager: 'default',
    sales_manager: 'secondary',
    finance_manager: 'secondary',
    service_manager: 'secondary',
    parts_manager: 'secondary',
  };
  return variants[role] || 'outline';
};

// Get initials for avatar
const getInitials = (member: any) => {
  return `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
};

// Open add modal
const openAddModal = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    department: 'sales',
    role: 'sales',
    password: '',
  };
  showAddModal.value = true;
};

// Open edit modal
const openEditModal = (member: any) => {
  const dept = getDepartmentFromRole(member.role).toLowerCase();
  editData.value = {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    department: dept === 'general' ? 'sales' : dept,
    role: member.role,
    isActive: member.isActive,
  };
  showEditModal.value = true;
};

// Add new staff member
const addStaff = async () => {
  saving.value = true;
  try {
    await $fetch('/api/admin/staff', {
      method: 'POST',
      body: {
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        role: formData.value.role,
        password: formData.value.password,
      },
    });
    showAddModal.value = false;
    toast.success(
      `${formData.value.firstName} ${formData.value.lastName} has been added to your team.`,
      'Staff member added'
    );
    refresh();
  } catch (err: any) {
    console.error('Failed to add staff:', err);
    toast.error(
      err.data?.message || 'An error occurred while adding the staff member.',
      'Failed to add staff'
    );
  } finally {
    saving.value = false;
  }
};

// Update staff member
const updateStaff = async () => {
  saving.value = true;
  try {
    await $fetch(`/api/admin/staff/${editData.value.id}`, {
      method: 'PATCH',
      body: {
        firstName: editData.value.firstName,
        lastName: editData.value.lastName,
        email: editData.value.email,
        role: editData.value.role,
        department: editData.value.department,
      },
    });

    // If status changed, update that separately
    const originalMember = staff.value.find((m: any) => m.id === editData.value.id);
    if (originalMember && originalMember.isActive !== editData.value.isActive) {
      await $fetch(`/api/admin/staff/${editData.value.id}/status`, {
        method: 'PATCH',
        body: { isActive: editData.value.isActive },
      });
    }

    showEditModal.value = false;
    toast.success(
      `${editData.value.firstName} ${editData.value.lastName}'s details have been updated.`,
      'Staff member updated'
    );
    refresh();
  } catch (err: any) {
    console.error('Failed to update staff:', err);
    toast.error(
      err.data?.message || 'An error occurred while updating the staff member.',
      'Failed to update staff'
    );
  } finally {
    saving.value = false;
  }
};

// Toggle staff status
const toggleStatus = async (member: any) => {
  try {
    await $fetch(`/api/admin/staff/${member.id}/status`, {
      method: 'PATCH',
      body: { isActive: !member.isActive },
    });
    toast.success(
      `${member.firstName} ${member.lastName} is now ${member.isActive ? 'inactive' : 'active'}.`,
      member.isActive ? 'Staff deactivated' : 'Staff activated'
    );
    refresh();
  } catch (err) {
    console.error('Failed to toggle status:', err);
    toast.error(
      'An error occurred while updating the staff status.',
      'Failed to update status'
    );
  }
};
</script>
