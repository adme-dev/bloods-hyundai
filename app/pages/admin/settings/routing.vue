<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Define automation for enquiry notifications</p>
        <h1 class="text-3xl font-semibold tracking-tight">Routing Rules</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Sync
        </Button>
        <Button size="sm" @click="openCreate">
          <Plus class="mr-2 h-4 w-4" /> New rule
        </Button>
      </div>
    </div>

    <Card v-if="pending">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        Loading routing rules...
      </CardContent>
    </Card>

    <template v-else>
      <div v-if="rules.length" class="space-y-4">
        <Card
          v-for="(rule, index) in rules"
          :key="rule.id"
          class="border-muted"
        >
          <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex flex-1 items-start gap-3 min-w-0">
              <Switch
                :checked="rule.enabled"
                @update:checked="(value) => toggleRule(rule, value)"
                class="shrink-0"
              />
              <div>
                <CardTitle class="text-lg leading-tight flex items-center gap-2">
                  {{ rule.name }}
                  <Badge
                    v-if="rule.actions.priority"
                    :variant="priorityVariant(rule.actions.priority)"
                    class="uppercase"
                  >
                    {{ rule.actions.priority }}
                  </Badge>
                </CardTitle>
                <p class="text-xs text-muted-foreground">
                  {{ rule.enabled ? 'Rule is active' : 'Rule is disabled' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="icon" @click="editRule(rule)" title="Edit">
                <PenSquare class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                :disabled="index === 0"
                @click="moveRule(index, -1)"
                title="Move up"
              >
                <ArrowUp class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                :disabled="index === rules.length - 1"
                @click="moveRule(index, 1)"
                title="Move down"
              >
                <ArrowDown class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive" @click="deleteRule(rule)" title="Delete">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent class="space-y-6">
            <div>
              <p class="text-sm font-medium text-muted-foreground mb-2">Conditions</p>
              <div v-if="rule.conditions.length" class="space-y-2">
                <div
                  v-for="(condition, idx) in rule.conditions"
                  :key="idx"
                  class="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-muted px-3 py-2 text-sm"
                >
                  <Badge variant="outline">{{ formatField(condition.field) }}</Badge>
                  <span class="text-muted-foreground">{{ formatOperator(condition.operator) }}</span>
                  <span class="font-medium">{{ formatValue(condition.value) }}</span>
                </div>
              </div>
              <Alert v-else variant="secondary">
                <AlertDescription>No conditions &mdash; this rule matches all enquiries.</AlertDescription>
              </Alert>
            </div>

            <Separator />

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-lg bg-muted/60 p-4">
                <p class="text-xs uppercase text-muted-foreground tracking-wide">Recipients</p>
                <div class="mt-2 flex items-center gap-2 text-sm font-medium">
                  <Mail class="h-4 w-4 text-muted-foreground" />
                  {{ rule.actions.send_to.join(', ') }}
                </div>
              </div>
              <div class="rounded-lg bg-muted/60 p-4">
                <p class="text-xs uppercase text-muted-foreground tracking-wide">Auto-assign</p>
                <p class="mt-2 text-sm font-medium">
                  {{ findStaffName(rule.actions.assign_to) }}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter class="flex flex-col gap-2 border-t bg-muted/30 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Evaluation order: Rule {{ index + 1 }} of {{ rules.length }}</span>
            <span>Higher rules execute first</span>
          </CardFooter>
        </Card>
      </div>

      <Card v-else class="text-center">
        <CardHeader>
          <CardTitle>No routing rules yet</CardTitle>
          <CardDescription>Add your first rule to start automating notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="openCreate">
            <Plus class="mr-2 h-4 w-4" /> Create rule
          </Button>
        </CardContent>
      </Card>
    </template>

    <Alert variant="secondary">
      <AlertTitle>How it works</AlertTitle>
      <AlertDescription>
        Rules run from top to bottom. The first match handles the enquiry, so keep your catch-all rule last.
      </AlertDescription>
    </Alert>

    <RoutingRuleEditor
      v-if="showAddModal || showEditModal"
      :rule="editingRule"
      :staff-members="staffMembers"
      @close="closeModals"
      @save="handleSaveRule"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, RefreshCw, PenSquare, ArrowUp, ArrowDown, Trash2, Mail } from 'lucide-vue-next';
import RoutingRuleEditor from '~/components/admin/RoutingRuleEditor.vue';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Switch } from '~/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Separator } from '~/components/ui/separator';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: {
    send_to: string[];
    priority?: string;
    assign_to?: string;
  };
}

const { data, pending, refresh } = await useFetch('/api/admin/settings/routing');
const rules = computed(() => (data.value?.rules || []) as RoutingRule[]);

// Fetch staff members for auto-assignment
const { data: staffData } = await useFetch('/api/admin/staff');
const staffMembers = computed(() => staffData.value?.staff || []);

const showAddModal = ref(false);
const showEditModal = ref(false);
const editingRule = ref<RoutingRule | null>(null);

const openCreate = () => {
  editingRule.value = null;
  showAddModal.value = true;
};

const findStaffName = (id?: string) => {
  if (!id) return 'No auto-assign';
  const staff = staffMembers.value?.find((member: any) => member.id === id);
  if (!staff) return 'No auto-assign';
  return `${staff.firstName} ${staff.lastName}`;
};

const formatValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value === true) return 'true';
  if (value === false) return 'false';
  return String(value ?? '');
};

const fieldLabels: Record<string, string> = {
  type: 'Enquiry type',
  status: 'Status',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  suburb: 'Suburb',
  state: 'State',
  postcode: 'Postcode',
  'vehicleInfo.condition': 'Vehicle condition',
  'vehicleInfo.make': 'Vehicle make',
  'vehicleInfo.model': 'Vehicle model',
  'vehicleInfo.year': 'Vehicle year',
  'vehicleInfo.price': 'Vehicle price',
  testDrive: 'Test drive',
  tradeIn: 'Trade-in',
};

const operatorLabels: Record<string, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  greater_than: '>',
  less_than: '<',
  greater_than_or_equal: '≥',
  less_than_or_equal: '≤',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  in_array: 'in list',
  not_in_array: 'not in list',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

const formatField = (field: string) => fieldLabels[field] || field;
const formatOperator = (operator: string) => operatorLabels[operator] || operator;

const priorityVariant = (priority?: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    low: 'outline',
    normal: 'secondary',
    high: 'default',
    urgent: 'destructive',
  };
  return map[priority || 'normal'] || 'secondary';
};

const formatRelative = (value?: string) => {
  if (!value) return 'just now';
  const date = new Date(value);
  const timestamp = Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const toggleRule = async (rule: RoutingRule, enabled: boolean) => {
  try {
    await $fetch(`/api/admin/settings/routing/${rule.id}`, {
      method: 'PUT',
      body: {
        rule: {
          ...rule,
          enabled,
        },
      },
    });
    refresh();
  } catch (error) {
    console.error('Failed to toggle rule:', error);
    alert('Failed to toggle rule');
  }
};

const editRule = (rule: RoutingRule) => {
  editingRule.value = rule;
  showEditModal.value = true;
};

const deleteRule = async (rule: RoutingRule) => {
  if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
    return;
  }
  
  try {
    await $fetch(`/api/admin/settings/routing/${rule.id}`, {
      method: 'DELETE',
    });
    refresh();
  } catch (error) {
    console.error('Failed to delete rule:', error);
    alert('Failed to delete rule');
  }
};

const moveRule = async (index: number, direction: number) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= rules.value.length) return;
  
  const reorderedRules = [...rules.value];
  const [removed] = reorderedRules.splice(index, 1);
  reorderedRules.splice(newIndex, 0, removed);
  
  try {
    await Promise.all(
      reorderedRules.map((rule) =>
        $fetch(`/api/admin/settings/routing/${rule.id}`, {
          method: 'PUT',
          body: { rule },
        }),
      ),
    );
    refresh();
  } catch (error) {
    console.error('Failed to reorder rules:', error);
    alert('Failed to reorder rules');
  }
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  editingRule.value = null;
};

const handleSaveRule = async (ruleData: RoutingRule) => {
  try {
    if (editingRule.value) {
      await $fetch(`/api/admin/settings/routing/${ruleData.id}`, {
        method: 'PUT',
        body: { rule: ruleData },
      });
    } else {
      await $fetch('/api/admin/settings/routing', {
        method: 'POST',
        body: { rule: ruleData },
      });
    }
    
    closeModals();
    refresh();
  } catch (error: any) {
    console.error('Failed to save rule:', error);
    alert(error.data?.message || 'Failed to save rule');
  }
};
</script>
