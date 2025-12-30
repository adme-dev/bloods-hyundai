<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="navigateTo('/admin/forms')">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="formConfig.iconBg">
              <component :is="formConfig.icon" class="h-6 w-6" :class="formConfig.iconColor" />
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">{{ formConfig.name }}</h1>
              <p class="text-sm text-muted-foreground">{{ formConfig.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="saveSuccess" class="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle class="h-4 w-4" />
          Saved!
        </span>
        <span v-if="saveError" class="text-sm text-red-600">
          {{ saveError }}
        </span>
        <Button variant="outline" @click="previewForm">
          <Eye class="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button @click="saveSettings" :disabled="saving">
          <Save class="mr-2 h-4 w-4" />
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <Tabs v-model="activeTab" class="space-y-6">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="settings">
          <Settings class="mr-2 h-4 w-4" />
          Form Settings
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell class="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="confirmations">
          <CheckCircle class="mr-2 h-4 w-4" />
          Confirmations
        </TabsTrigger>
        <TabsTrigger value="routing">
          <GitBranch class="mr-2 h-4 w-4" />
          Routing
        </TabsTrigger>
      </TabsList>

      <!-- Form Settings Tab -->
      <TabsContent value="settings" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic form settings and behavior</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Form Status</Label>
                <p class="text-sm text-muted-foreground">Enable or disable this form</p>
              </div>
              <Switch v-model="settings.isActive" />
            </div>
            <Separator />
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="form-title">Form Title</Label>
                <Input id="form-title" v-model="settings.title" placeholder="Form title shown to users" />
              </div>
              <div class="space-y-2">
                <Label for="form-slug">Form Slug</Label>
                <Input id="form-slug" :value="slug" disabled class="bg-muted" />
                <p class="text-xs text-muted-foreground">Used in URLs and API calls</p>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="form-description">Description</Label>
              <Textarea 
                id="form-description" 
                v-model="settings.description" 
                placeholder="Brief description of the form purpose"
                rows="2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Behavior</CardTitle>
            <CardDescription>Configure what happens when users submit</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Save to Database</Label>
                <p class="text-sm text-muted-foreground">Store submissions in the enquiry system</p>
              </div>
              <Switch v-model="settings.saveToDatabase" />
            </div>
            <Separator />
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Require All Fields</Label>
                <p class="text-sm text-muted-foreground">Make all form fields mandatory</p>
              </div>
              <Switch v-model="settings.requireAllFields" />
            </div>
            <Separator />
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Anti-Spam Protection</Label>
                <p class="text-sm text-muted-foreground">Enable honeypot and rate limiting</p>
              </div>
              <Switch v-model="settings.antiSpam" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Assignment</CardTitle>
            <CardDescription>Auto-assign submissions to a team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label>Assign To</Label>
              <Select v-model="settings.defaultAssignee">
                <SelectTrigger>
                  <SelectValue placeholder="No default assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No default assignment</SelectItem>
                  <SelectItem v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                    {{ staff.firstName }} {{ staff.lastName }} ({{ staff.role }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                This can be overridden by routing rules
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Notifications Tab -->
      <TabsContent value="notifications" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium">Notifications</h3>
            <p class="text-sm text-muted-foreground">
              Configure email notifications for admin and customers
            </p>
          </div>
          <Button @click="addNotification">
            <Plus class="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[100px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Send To</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="notification in notifications" :key="notification.id">
              <TableCell>
                <Badge :variant="notification.isActive ? 'default' : 'secondary'">
                  {{ notification.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </TableCell>
              <TableCell>
                <button 
                  class="font-medium text-primary hover:underline"
                  @click="editNotification(notification)"
                >
                  {{ notification.name }}
                </button>
              </TableCell>
              <TableCell class="max-w-[300px] truncate">
                {{ notification.subject }}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {{ notification.type === 'admin' ? 'Admin' : 'Customer' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" @click="editNotification(notification)">
                    <PenSquare class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="duplicateNotification(notification)">
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="text-destructive" @click="deleteNotification(notification)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="notifications.length === 0">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
                No notifications configured. Click "Add New" to create one.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>

      <!-- Confirmations Tab -->
      <TabsContent value="confirmations" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Confirmation Message</CardTitle>
            <CardDescription>
              What users see after successfully submitting the form
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="space-y-2">
              <Label>Confirmation Type</Label>
              <Select v-model="confirmation.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Show Message</SelectItem>
                  <SelectItem value="redirect">Redirect to Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="confirmation.type === 'message'" class="space-y-4">
              <div class="space-y-2">
                <Label>Title</Label>
                <Input v-model="confirmation.title" placeholder="Thank you for your enquiry!" />
              </div>
              <div class="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  v-model="confirmation.message" 
                  placeholder="We'll be in touch within 24 hours..."
                  rows="4"
                />
              </div>
              <div class="space-y-2">
                <Label>Button Text</Label>
                <Input v-model="confirmation.buttonText" placeholder="Back to Home" />
              </div>
              <div class="space-y-2">
                <Label>Button Link</Label>
                <Input v-model="confirmation.buttonLink" placeholder="/" />
              </div>
            </div>

            <div v-else class="space-y-2">
              <Label>Redirect URL</Label>
              <Input v-model="confirmation.redirectUrl" placeholder="/thank-you" />
              <p class="text-xs text-muted-foreground">
                Users will be redirected to this page after submission
              </p>
            </div>

            <!-- Preview -->
            <Separator />
            <div class="space-y-2">
              <Label>Preview</Label>
              <Card class="bg-muted/50">
                <CardContent class="pt-6 text-center">
                  <CheckCircle class="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 class="text-xl font-semibold">{{ confirmation.title || 'Thank you!' }}</h3>
                  <p class="mt-2 text-muted-foreground">
                    {{ confirmation.message || 'Your submission has been received.' }}
                  </p>
                  <Button class="mt-4" variant="outline">
                    {{ confirmation.buttonText || 'Continue' }}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Routing Tab -->
      <TabsContent value="routing" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium">Routing Rules</h3>
            <p class="text-sm text-muted-foreground">
              Route {{ formConfig.name }} submissions based on field values
            </p>
          </div>
          <Button @click="addRoutingRule">
            <Plus class="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>

        <!-- Rules List -->
        <div v-if="formRules.length > 0" class="space-y-4">
          <Card 
            v-for="(rule, index) in formRules" 
            :key="rule.id"
            class="overflow-hidden"
          >
            <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-3">
              <div class="flex flex-1 items-start gap-3 min-w-0">
                <Switch
                  :checked="rule.enabled"
                  @update:checked="(value) => toggleRuleEnabled(rule, value)"
                  class="shrink-0"
                />
                <div>
                  <p class="font-semibold">{{ rule.name }}</p>
                  <p class="text-sm text-muted-foreground">
                    Priority: 
                    <Badge :variant="priorityVariant(rule.actions.priority)" class="ml-1">
                      {{ rule.actions.priority }}
                    </Badge>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="icon" @click="editRoutingRule(rule)">
                  <PenSquare class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  :disabled="index === 0"
                  @click="moveRuleUp(index)"
                >
                  <ArrowUp class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  :disabled="index === formRules.length - 1"
                  @click="moveRuleDown(index)"
                >
                  <ArrowDown class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" class="text-destructive" @click="deleteRoutingRule(rule)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <!-- Conditions -->
              <div class="space-y-3">
                <div class="text-sm font-medium text-muted-foreground">When:</div>
                <div v-if="rule.conditions.length > 0" class="flex flex-wrap gap-2">
                  <Badge 
                    v-for="(condition, cIndex) in rule.conditions" 
                    :key="cIndex"
                    variant="outline"
                    class="font-mono text-xs"
                  >
                    {{ formatField(condition.field) }} {{ formatOperator(condition.operator) }} "{{ condition.value }}"
                  </Badge>
                </div>
                <p v-else class="text-sm text-muted-foreground italic">All submissions (no conditions)</p>
                
                <!-- Actions -->
                <div class="text-sm font-medium text-muted-foreground mt-4">Then send to:</div>
                <div class="flex flex-wrap items-center gap-2">
                  <Badge 
                    v-for="email in rule.actions.send_to" 
                    :key="email"
                    class="bg-primary/10 text-primary border-primary/20"
                  >
                    <Mail class="mr-1 h-3 w-3" />
                    {{ email }}
                  </Badge>
                  <Badge v-if="rule.actions.assign_to" variant="secondary">
                    <User class="mr-1 h-3 w-3" />
                    Assign to: {{ findStaffName(rule.actions.assign_to) }}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Empty State -->
        <Card v-else>
          <CardContent class="py-12 text-center">
            <GitBranch class="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 class="text-lg font-medium mb-2">No routing rules yet</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Create rules to route {{ formConfig.name }} submissions based on field values
            </p>
            <Button @click="addRoutingRule">
              <Plus class="mr-2 h-4 w-4" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>

        <!-- Tips -->
        <Alert>
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>How routing works</AlertTitle>
          <AlertDescription>
            <ul class="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Rules are evaluated in order from top to bottom</li>
              <li>The first matching rule determines where the submission is sent</li>
              <li>Use drag handles or arrows to reorder rules</li>
              <li>Rules without conditions match all submissions (useful as a fallback)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </TabsContent>
    </Tabs>

    <!-- Notification Editor Modal -->
    <NotificationEditor
      v-if="showNotificationEditor"
      :notification="editingNotification"
      :form-slug="slug"
      @close="showNotificationEditor = false"
      @save="handleSaveNotification"
    />

    <!-- Routing Rule Editor Modal -->
    <RoutingRuleEditor
      v-if="showRoutingEditor"
      :rule="editingRule"
      :staff-members="staffMembers"
      :form-slug="slug"
      @close="showRoutingEditor = false"
      @save="handleSaveRoutingRule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  Settings,
  Bell,
  CheckCircle,
  GitBranch,
  Plus,
  PenSquare,
  Copy,
  Trash2,
  Car,
  MessageSquare,
  DollarSign,
  Wrench,
  Package,
  ShoppingCart,
  Mail,
  User,
  AlertCircle,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import NotificationEditor from '~/components/admin/NotificationEditor.vue';
import RoutingRuleEditor from '~/components/admin/RoutingRuleEditor.vue';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

// Handle tab from URL query parameter
const validTabs = ['settings', 'notifications', 'confirmations', 'routing'];
const getInitialTab = () => {
  const tab = route.query.tab as string;
  return validTabs.includes(tab) ? tab : 'settings';
};

// Form configuration mapping
const formConfigs: Record<string, any> = {
  vehicle: { name: 'Car Sales', description: 'Vehicle enquiries', icon: Car, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  contact: { name: 'Contact Us', description: 'General enquiries', icon: MessageSquare, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  finance: { name: 'Finance Enquiry', description: 'Finance applications', icon: DollarSign, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  service: { name: 'Service Enquiry', description: 'Service bookings', icon: Wrench, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  sell_car: { name: 'Sell My Car', description: 'Trade-in valuations', icon: Car, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  parts: { name: 'Parts Enquiry', description: 'Parts requests', icon: Package, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  accessories: { name: 'Accessories', description: 'Accessories orders', icon: ShoppingCart, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  test_drive: { name: 'Test Drive', description: 'Test drive bookings', icon: Car, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
};

const formConfig = computed(() => formConfigs[slug] || { name: slug, description: '', icon: MessageSquare, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' });

const activeTab = ref(getInitialTab());

// Sync tab with URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
const saving = ref(false);
const showNotificationEditor = ref(false);
const editingNotification = ref<any>(null);

// Fetch form settings
const { data: formData, pending: formLoading, refresh: refreshFormData } = await useFetch(`/api/admin/forms/${slug}`);

// Fetch staff for assignment dropdown
const { data: staffData } = await useFetch('/api/admin/staff');
const staffMembers = computed(() => staffData.value?.staff || []);

// Fetch routing rules
const { data: routingData, refresh: refreshRouting } = await useFetch('/api/admin/settings/routing');

// Filter rules that apply to this form type
const formRules = computed(() => {
  const rules = routingData.value?.rules || [];
  return rules.filter((rule: any) => 
    rule.conditions.some((c: any) => c.field === 'type' && c.value === slug) ||
    (rule.conditions.length === 0) // Rules with no conditions apply to all
  );
});

// Routing rule management
const showRoutingEditor = ref(false);
const editingRule = ref<any>(null);

const findStaffName = (staffId: string) => {
  const staff = staffMembers.value.find((s: any) => s.id === staffId);
  return staff ? `${staff.firstName} ${staff.lastName}` : staffId;
};

const formatField = (field: string) => {
  const map: Record<string, string> = {
    'type': 'Form Type',
    'vehicleInfo.condition': 'Vehicle Condition',
    'vehicleInfo.make': 'Vehicle Make',
    'vehicleInfo.model': 'Vehicle Model',
    'testDrive': 'Test Drive',
    'financeInterest': 'Finance Interest',
  };
  return map[field] || field;
};

const formatOperator = (op: string) => {
  const map: Record<string, string> = {
    'equals': '=',
    'not_equals': '≠',
    'contains': '∋',
    'starts_with': 'starts with',
    'ends_with': 'ends with',
  };
  return map[op] || op;
};

const priorityVariant = (priority: string) => {
  switch (priority) {
    case 'high': return 'destructive';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const addRoutingRule = () => {
  // Pre-fill with this form type condition
  editingRule.value = {
    name: '',
    enabled: true,
    conditions: [{ field: 'type', operator: 'equals', value: slug }],
    actions: { send_to: [''], priority: 'normal', assign_to: '' },
  };
  showRoutingEditor.value = true;
};

const editRoutingRule = (rule: any) => {
  editingRule.value = rule;
  showRoutingEditor.value = true;
};

const toggleRuleEnabled = async (rule: any, enabled: boolean) => {
  try {
    await $fetch('/api/admin/settings/routing', {
      method: 'PUT',
      body: { 
        rules: routingData.value?.rules.map((r: any) => 
          r.id === rule.id ? { ...r, enabled } : r
        )
      },
    });
    await refreshRouting();
  } catch (error) {
    console.error('Failed to toggle rule:', error);
  }
};

const moveRuleUp = async (index: number) => {
  if (index <= 0) return;
  const allRules = [...(routingData.value?.rules || [])];
  const ruleIndex = allRules.findIndex((r: any) => r.id === formRules.value[index].id);
  if (ruleIndex > 0) {
    [allRules[ruleIndex - 1], allRules[ruleIndex]] = [allRules[ruleIndex], allRules[ruleIndex - 1]];
    await saveRulesOrder(allRules);
  }
};

const moveRuleDown = async (index: number) => {
  if (index >= formRules.value.length - 1) return;
  const allRules = [...(routingData.value?.rules || [])];
  const ruleIndex = allRules.findIndex((r: any) => r.id === formRules.value[index].id);
  if (ruleIndex < allRules.length - 1) {
    [allRules[ruleIndex], allRules[ruleIndex + 1]] = [allRules[ruleIndex + 1], allRules[ruleIndex]];
    await saveRulesOrder(allRules);
  }
};

const saveRulesOrder = async (rules: any[]) => {
  try {
    await $fetch('/api/admin/settings/routing', {
      method: 'PUT',
      body: { rules },
    });
    await refreshRouting();
  } catch (error) {
    console.error('Failed to reorder rules:', error);
  }
};

const deleteRoutingRule = async (rule: any) => {
  if (!confirm(`Delete rule "${rule.name}"?`)) return;
  try {
    await $fetch('/api/admin/settings/routing', {
      method: 'PUT',
      body: { 
        rules: routingData.value?.rules.filter((r: any) => r.id !== rule.id)
      },
    });
    await refreshRouting();
  } catch (error) {
    console.error('Failed to delete rule:', error);
  }
};

const handleSaveRoutingRule = async (ruleData: any) => {
  try {
    const allRules = [...(routingData.value?.rules || [])];
    
    if (editingRule.value?.id) {
      // Update existing
      const index = allRules.findIndex((r: any) => r.id === editingRule.value.id);
      if (index >= 0) {
        allRules[index] = { ...ruleData, id: editingRule.value.id };
      }
    } else {
      // Add new
      allRules.push({ ...ruleData, id: `rule-${Date.now()}` });
    }
    
    await $fetch('/api/admin/settings/routing', {
      method: 'PUT',
      body: { rules: allRules },
    });
    await refreshRouting();
    showRoutingEditor.value = false;
  } catch (error) {
    console.error('Failed to save rule:', error);
  }
};

// Settings state - initialize with defaults, will be updated by watch
const settings = ref({
  isActive: true,
  title: formConfig.value.name,
  description: formConfig.value.description,
  saveToDatabase: true,
  requireAllFields: false,
  antiSpam: true,
  defaultAssignee: '__none__',
});

// Notifications state
const notifications = ref<any[]>([]);

// Confirmation state
const confirmation = ref({
  type: 'message',
  title: 'Thank you for your enquiry!',
  message: "We've received your submission and will be in touch within 24 hours.",
  buttonText: 'Back to Home',
  buttonLink: '/',
  redirectUrl: '/thank-you',
});

// Watch for formData to load and sync state
watch(formData, (data) => {
  if (data) {
    // Update settings from fetched data
    settings.value = {
      isActive: data.settings?.isActive ?? true,
      title: data.settings?.title || formConfig.value.name,
      description: data.settings?.description || formConfig.value.description,
      saveToDatabase: data.settings?.saveToDatabase ?? true,
      requireAllFields: data.settings?.requireAllFields ?? false,
      antiSpam: data.settings?.antiSpam ?? true,
      defaultAssignee: data.settings?.defaultAssignee || '__none__',
    };
    
    // Update notifications
    if (data.notifications) {
      notifications.value = data.notifications;
    }
    
    // Update confirmation
    if (data.confirmation) {
      confirmation.value = {
        type: data.confirmation.type || 'message',
        title: data.confirmation.title || 'Thank you for your enquiry!',
        message: data.confirmation.message || "We've received your submission and will be in touch within 24 hours.",
        buttonText: data.confirmation.buttonText || 'Back to Home',
        buttonLink: data.confirmation.buttonLink || '/',
        redirectUrl: data.confirmation.redirectUrl || '/thank-you',
      };
    }
  }
}, { immediate: true });

const previewForm = () => {
  const routes: Record<string, string> = {
    vehicle: '/car-sales',
    contact: '/contact',
    finance: '/finance',
    service: '/service',
    sell_car: '/sell-my-car',
    parts: '/parts',
    accessories: '/accessories',
    test_drive: '/test-drive',
  };
  window.open(routes[slug] || '/', '_blank');
};

const saveSuccess = ref(false);
const saveError = ref('');

const saveSettings = async () => {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';
  
  try {
    const result = await $fetch(`/api/admin/forms/${slug}`, {
      method: 'PUT',
      body: {
        settings: {
          ...settings.value,
          defaultAssignee: settings.value.defaultAssignee === '__none__' ? null : settings.value.defaultAssignee,
        },
        notifications: notifications.value,
        confirmation: confirmation.value,
      },
    });
    console.log('✅ Settings saved:', result);
    
    // Refresh form data to sync with saved state
    await refreshFormData();
    
    saveSuccess.value = true;
    setTimeout(() => saveSuccess.value = false, 3000);
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    saveError.value = error?.data?.message || error?.message || 'Failed to save settings';
    setTimeout(() => saveError.value = '', 5000);
  } finally {
    saving.value = false;
  }
};

const addNotification = () => {
  editingNotification.value = null;
  showNotificationEditor.value = true;
};

const editNotification = (notification: any) => {
  editingNotification.value = notification;
  showNotificationEditor.value = true;
};

const duplicateNotification = (notification: any) => {
  const newNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    name: `${notification.name} (Copy)`,
  };
  notifications.value.push(newNotification);
};

const deleteNotification = (notification: any) => {
  if (confirm(`Delete "${notification.name}"?`)) {
    notifications.value = notifications.value.filter((n: any) => n.id !== notification.id);
  }
};

const handleSaveNotification = async (notificationData: any) => {
  // Update local state
  if (editingNotification.value) {
    const index = notifications.value.findIndex((n: any) => n.id === editingNotification.value.id);
    if (index >= 0) {
      notifications.value[index] = { ...notificationData, id: editingNotification.value.id };
    }
  } else {
    notifications.value.push({
      ...notificationData,
      id: `notif-${Date.now()}`,
    });
  }
  showNotificationEditor.value = false;
  
  // Auto-save to database
  await saveSettings();
};
</script>










