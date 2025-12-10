<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Staff Management</h1>
        <p class="text-sm text-muted-foreground">Empower your team with the right access</p>
      </div>
      <Button @click="showAddModal = true">
        <Plus class="mr-2 h-4 w-4" /> Add staff member
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Team roster</CardTitle>
        <CardDescription>{{ staff.length }} active profiles</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="member in staff" :key="member.id">
              <TableCell>
                <div class="font-medium">{{ member.firstName }} {{ member.lastName }}</div>
              </TableCell>
              <TableCell>
                <p class="text-sm text-muted-foreground">{{ member.email }}</p>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{{ formatRole(member.role) }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="member.isActive ? 'default' : 'outline'">
                  {{ member.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="icon" @click="editStaff(member)">
                    <PenSquare class="h-4 w-4" />
                  </Button>
                  <Button
                    :variant="member.isActive ? 'outline' : 'secondary'"
                    size="icon"
                    @click="toggleStatus(member)"
                  >
                    <Power class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!pending && staff.length === 0">
              <TableCell colspan="5">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  No staff members found.
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="pending">
              <TableCell colspan="5">
                <div class="py-10 text-center text-sm text-muted-foreground">
                  Loading staff directory…
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Add/Edit Modal -->
    <Dialog :open="showAddModal" @update:open="showAddModal = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
          <DialogDescription>Grant a teammate access to the Sale Hyundai admin.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="addStaff" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>First Name</Label>
              <Input v-model="newStaff.firstName" required />
            </div>
            <div class="space-y-2">
              <Label>Last Name</Label>
              <Input v-model="newStaff.lastName" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Email</Label>
            <Input v-model="newStaff.email" type="email" required />
          </div>
          <div class="space-y-2">
            <Label>Role</Label>
            <Select v-model="newStaff.role" required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dealer_admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="parts">Parts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Temporary Password</Label>
            <Input v-model="newStaff.password" type="password" minlength="8" required />
            <p class="text-xs text-muted-foreground">Minimum 8 characters</p>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, PenSquare, Power } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
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
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { data, pending, refresh } = await useFetch('/api/admin/staff');
const staff = computed(() => data.value?.staff || []);

const showAddModal = ref(false);
const saving = ref(false);
const newStaff = ref({
  firstName: '',
  lastName: '',
  email: '',
  role: 'sales',
  password: '',
});

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    dealer_admin: 'Admin',
    sales: 'Sales',
    service: 'Service',
    parts: 'Parts',
  };
  return roles[role] || role;
};

const addStaff = async () => {
  saving.value = true;
  try {
    await $fetch('/api/admin/staff', {
      method: 'POST',
      body: newStaff.value,
    });
    showAddModal.value = false;
    newStaff.value = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'sales',
      password: '',
    };
    refresh();
  } catch (err: any) {
    console.error('Failed to add staff:', err);
    alert(err.data?.message || 'Failed to add staff member');
  } finally {
    saving.value = false;
  }
};

const editStaff = (member: any) => {
  // TODO: Implement edit functionality
  alert('Edit functionality coming soon');
};

const toggleStatus = async (member: any) => {
  try {
    await $fetch(`/api/admin/staff/${member.id}/status`, {
      method: 'PATCH',
      body: { isActive: !member.isActive },
    });
    refresh();
  } catch (err) {
    console.error('Failed to toggle status:', err);
  }
};
</script>

