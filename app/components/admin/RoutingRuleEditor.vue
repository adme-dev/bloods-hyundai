<template>
  <ClientOnly>
    <Dialog :open="true" @update:open="(open) => !open && $emit('close')">
      <DialogScrollContent class="max-w-3xl max-h-[90vh] flex flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle>{{ isEdit ? 'Edit Routing Rule' : 'Add Routing Rule' }}</DialogTitle>
        <DialogDescription>
          Configure conditions and actions for this routing rule
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 overflow-y-auto flex-1 pr-2">
        <!-- Error Alert -->
        <Alert v-if="errors.length > 0" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Please fix the following errors:</AlertTitle>
          <AlertDescription>
            <ul class="mt-2 list-disc list-inside">
              <li v-for="(error, idx) in errors" :key="idx">{{ error }}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <!-- Rule Name & Enabled -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="rule-name">
              Rule Name <span class="text-red-500">*</span>
            </Label>
            <Input
              id="rule-name"
              v-model="form.name"
              type="text"
              required
              placeholder="e.g., New Vehicle Enquiries"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <Switch
              :checked="form.enabled"
              @update:checked="form.enabled = $event"
              class="shrink-0"
            />
            <Label>{{ form.enabled ? 'Enabled' : 'Disabled' }}</Label>
          </div>
        </div>

        <!-- Conditions Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="text-base">Conditions</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="addCondition"
            >
              <Plus class="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          </div>

          <p v-if="form.conditions.length === 0" class="text-sm text-muted-foreground italic">
            No conditions (will match all enquiries)
          </p>

          <div v-else class="space-y-3">
            <Card
              v-for="(condition, index) in form.conditions"
              :key="index"
            >
              <CardContent class="pt-6">
                <div class="flex items-start gap-2">
                  <!-- Field Selector -->
                  <div class="flex-1">
                    <Select v-model="condition.field">
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Core Fields</SelectLabel>
                          <SelectItem value="type">Enquiry Type</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="firstName">First Name</SelectItem>
                          <SelectItem value="lastName">Last Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="suburb">Suburb</SelectItem>
                          <SelectItem value="state">State</SelectItem>
                          <SelectItem value="postcode">Postcode</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Vehicle Info</SelectLabel>
                          <SelectItem value="vehicleInfo.condition">Vehicle Condition</SelectItem>
                          <SelectItem value="vehicleInfo.make">Vehicle Make</SelectItem>
                          <SelectItem value="vehicleInfo.model">Vehicle Model</SelectItem>
                          <SelectItem value="vehicleInfo.year">Vehicle Year</SelectItem>
                          <SelectItem value="vehicleInfo.price">Vehicle Price</SelectItem>
                          <SelectItem value="vehicleInfo.stockId">Stock ID</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Flags</SelectLabel>
                          <SelectItem value="testDrive">Test Drive Requested</SelectItem>
                          <SelectItem value="tradeIn">Trade-In Interest</SelectItem>
                          <SelectItem value="financeInterest">Finance Interest</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Operator Selector -->
                  <div class="flex-1">
                    <Select v-model="condition.operator">
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Comparison</SelectLabel>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="not_equals">not equals</SelectItem>
                          <SelectItem value="greater_than">greater than</SelectItem>
                          <SelectItem value="less_than">less than</SelectItem>
                          <SelectItem value="greater_than_or_equal">greater than or equal</SelectItem>
                          <SelectItem value="less_than_or_equal">less than or equal</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>String</SelectLabel>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="not_contains">does not contain</SelectItem>
                          <SelectItem value="starts_with">starts with</SelectItem>
                          <SelectItem value="ends_with">ends with</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Array</SelectLabel>
                          <SelectItem value="in_array">in list</SelectItem>
                          <SelectItem value="not_in_array">not in list</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Other</SelectLabel>
                          <SelectItem value="is_empty">is empty</SelectItem>
                          <SelectItem value="is_not_empty">is not empty</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Value Input -->
                  <div class="flex-1">
                    <Input
                      v-if="!['is_empty', 'is_not_empty'].includes(condition.operator)"
                      v-model="condition.value"
                      type="text"
                      placeholder="Value..."
                    />
                    <span v-else class="flex items-center h-10 text-sm text-muted-foreground italic">
                      (no value needed)
                    </span>
                  </div>

                  <!-- Remove Button -->
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    @click="removeCondition(index)"
                    class="text-destructive hover:text-destructive"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <p class="text-xs text-muted-foreground">
            All conditions must be true for the rule to match (AND logic)
          </p>
        </div>

        <!-- Actions Section -->
        <div class="space-y-4">
          <Label class="text-base">
            Actions <span class="text-red-500">*</span>
          </Label>

          <!-- Email Recipients -->
          <div class="space-y-3">
            <Label>
              Send Email To <span class="text-red-500">*</span>
            </Label>
            <div class="space-y-2">
              <div
                v-for="(email, index) in form.actions.send_to"
                :key="index"
                class="flex items-center gap-2"
              >
                <Input
                  v-model="form.actions.send_to[index]"
                  type="email"
                  required
                  placeholder="email@example.com"
                />
                <Button
                  v-if="form.actions.send_to.length > 1"
                  type="button"
                  variant="ghost"
                  size="icon"
                  @click="removeEmail(index)"
                  class="text-destructive hover:text-destructive"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="addEmail"
            >
              <Plus class="h-4 w-4 mr-1" />
              Add Email
            </Button>
          </div>

          <!-- Priority -->
          <div class="space-y-2">
            <Label>Priority</Label>
            <Select v-model="form.actions.priority">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Auto-Assign (Optional) -->
          <div class="space-y-2">
            <Label>Auto-Assign To (Optional)</Label>
            <Select v-model="form.actions.assign_to">
              <SelectTrigger>
                <SelectValue placeholder="None (manual assignment)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (manual assignment)</SelectItem>
                <SelectItem v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                  {{ staff.firstName }} {{ staff.lastName }} ({{ staff.role }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        </form>

      <!-- Footer Buttons -->
      <DialogFooter class="shrink-0 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          @click="$emit('close')"
        >
          Cancel
        </Button>
        <Button
          @click="handleSubmit"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : (isEdit ? 'Update Rule' : 'Create Rule') }}
        </Button>
      </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Plus, X, AlertCircle } from 'lucide-vue-next';
import {
  Dialog,
  DialogScrollContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

interface RoutingCondition {
  field: string;
  operator: string;
  value: any;
}

interface RoutingActions {
  send_to: string[];
  priority?: string;
  assign_to?: string;
}

interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingActions;
}

interface Props {
  rule?: RoutingRule | null;
  staffMembers?: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  formSlug?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rule: null,
  staffMembers: () => [],
  formSlug: '',
});

const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => !!props.rule);

// Default conditions based on formSlug
const getDefaultConditions = (): RoutingCondition[] => {
  if (props.rule?.conditions) {
    return JSON.parse(JSON.stringify(props.rule.conditions));
  }
  // If we're editing from a form page, pre-fill with the form type condition
  if (props.formSlug) {
    return [{ field: 'type', operator: 'equals', value: props.formSlug }];
  }
  return [];
};

// Form state
const form = reactive<{
  name: string;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingActions;
}>({
  name: props.rule?.name || '',
  enabled: props.rule?.enabled ?? true,
  conditions: getDefaultConditions(),
  actions: props.rule?.actions ? {
    ...JSON.parse(JSON.stringify(props.rule.actions)),
    assign_to: props.rule.actions.assign_to || '__none__',
  } : {
    send_to: [''],
    priority: 'normal',
    assign_to: '__none__',
  },
});

const errors = ref<string[]>([]);
const saving = ref(false);

// Conditions
const addCondition = () => {
  form.conditions.push({
    field: '',
    operator: '',
    value: '',
  });
};

const removeCondition = (index: number) => {
  form.conditions.splice(index, 1);
};

// Email recipients
const addEmail = () => {
  form.actions.send_to.push('');
};

const removeEmail = (index: number) => {
  form.actions.send_to.splice(index, 1);
};

// Validation
const validate = (): boolean => {
  errors.value = [];

  if (!form.name.trim()) {
    errors.value.push('Rule name is required');
  }

  if (form.actions.send_to.length === 0 || !form.actions.send_to[0]) {
    errors.value.push('At least one email recipient is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of form.actions.send_to) {
    if (email && !emailRegex.test(email)) {
      errors.value.push(`Invalid email format: ${email}`);
    }
  }

  // Validate conditions
  for (let i = 0; i < form.conditions.length; i++) {
    const condition = form.conditions[i];
    if (!condition.field) {
      errors.value.push(`Condition ${i + 1}: Field is required`);
    }
    if (!condition.operator) {
      errors.value.push(`Condition ${i + 1}: Operator is required`);
    }
    if (!['is_empty', 'is_not_empty'].includes(condition.operator) && !condition.value) {
      errors.value.push(`Condition ${i + 1}: Value is required`);
    }
  }

  return errors.value.length === 0;
};

// Submit
const handleSubmit = async () => {
  if (!validate()) return;

  saving.value = true;

  try {
    const ruleData: RoutingRule = {
      id: props.rule?.id || `rule-${Date.now()}`,
      name: form.name.trim(),
      enabled: form.enabled,
      conditions: form.conditions.filter(c => c.field && c.operator),
      actions: {
        send_to: form.actions.send_to.filter(e => e.trim()),
        priority: form.actions.priority || 'normal',
        assign_to: form.actions.assign_to === '__none__' ? undefined : form.actions.assign_to,
      },
    };

    emit('save', ruleData);
  } catch (error) {
    console.error('Error saving rule:', error);
    errors.value = ['Failed to save rule. Please try again.'];
  } finally {
    saving.value = false;
  }
};
</script>
