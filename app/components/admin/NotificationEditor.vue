<template>
  <ClientOnly>
    <Dialog :open="true" @update:open="(open) => !open && $emit('close')">
      <DialogScrollContent class="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader class="shrink-0">
          <DialogTitle>{{ isEdit ? 'Edit Notification' : 'Add Notification' }}</DialogTitle>
          <DialogDescription>
            Configure email notification settings for this form
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-6 overflow-y-auto flex-1 pr-2">
          <!-- Basic Settings -->
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="notif-name">Notification Name</Label>
              <Input 
                id="notif-name" 
                v-model="form.name" 
                placeholder="e.g., Admin Notification"
                required
              />
            </div>
            <div class="space-y-2">
              <Label>Notification Type</Label>
              <Select v-model="form.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Notification</SelectItem>
                  <SelectItem value="customer">Customer Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model="form.isActive" />
            <Label>{{ form.isActive ? 'Active' : 'Inactive' }}</Label>
          </div>

          <Separator />

          <!-- Email Recipients (Admin only) -->
          <div v-if="form.type === 'admin'" class="space-y-4">
            <div class="space-y-2">
              <Label>Send To</Label>
              <div class="space-y-2">
                <div 
                  v-for="(email, index) in form.sendTo" 
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <Input 
                    v-model="form.sendTo[index]" 
                    type="email"
                    placeholder="email@example.com"
                  />
                  <Button 
                    v-if="form.sendTo.length > 1"
                    type="button"
                    variant="ghost" 
                    size="icon"
                    @click="form.sendTo.splice(index, 1)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" @click="form.sendTo.push('')">
                <Plus class="mr-2 h-4 w-4" />
                Add Email
              </Button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label>CC (Optional)</Label>
                <Input v-model="form.cc" placeholder="cc@example.com" />
              </div>
              <div class="space-y-2">
                <Label>BCC (Optional)</Label>
                <Input v-model="form.bcc" placeholder="bcc@example.com" />
              </div>
            </div>
          </div>

          <Separator />

          <!-- Email Content -->
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>From Name</Label>
              <Input v-model="form.fromName" placeholder="Sale Hyundai" />
            </div>

            <div class="space-y-2">
              <Label>Reply To</Label>
              <Input v-model="form.replyTo" placeholder="enquiries@hyundai.com.au" />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label>Subject</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  @click="showMergeTags = !showMergeTags"
                >
                  <Tags class="mr-2 h-4 w-4" />
                  Merge Tags
                </Button>
              </div>
              <Input 
                v-model="form.subject" 
                placeholder="New {form_type} Enquiry - {customer_name}"
              />
              <p class="text-xs text-muted-foreground">
                Use merge tags like {`{customer_name}`}, {`{form_type}`}, {`{vehicle_model}`} to personalize
              </p>
            </div>

            <div class="space-y-2">
              <Label>Email Body</Label>
              <Tabs v-model="bodyTab" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="visual" class="mt-2">
                  <Textarea 
                    v-model="form.bodyText"
                    placeholder="Enter your email message..."
                    rows="10"
                    class="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="html" class="mt-2">
                  <Textarea 
                    v-model="form.bodyHtml"
                    placeholder="<html>...</html>"
                    rows="10"
                    class="font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <!-- Merge Tags Reference -->
          <Collapsible v-model:open="showMergeTags">
            <CollapsibleContent>
              <Card>
                <CardHeader class="py-3">
                  <CardTitle class="text-sm">Available Merge Tags</CardTitle>
                </CardHeader>
                <CardContent class="py-3">
                  <div class="grid gap-2 md:grid-cols-3 text-sm">
                    <div v-for="tag in mergeTags" :key="tag.tag" class="flex items-center gap-2">
                      <code class="bg-muted px-1 py-0.5 rounded text-xs">{{ tag.tag }}</code>
                      <span class="text-muted-foreground">{{ tag.description }}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <!-- Conditional Logic -->
          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <Switch v-model="form.hasConditions" />
              <Label>Enable Conditional Logic</Label>
            </div>
            
            <div v-if="form.hasConditions" class="space-y-3 pl-6">
              <p class="text-sm text-muted-foreground">
                Only send this notification when certain conditions are met
              </p>
              <div 
                v-for="(condition, index) in form.conditions" 
                :key="index"
                class="flex items-center gap-2"
              >
                <Select v-model="condition.field" class="w-[180px]">
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type">Enquiry Type</SelectItem>
                    <SelectItem value="vehicleInfo.condition">Vehicle Condition</SelectItem>
                    <SelectItem value="vehicleInfo.make">Vehicle Make</SelectItem>
                    <SelectItem value="testDrive">Test Drive</SelectItem>
                    <SelectItem value="financeInterest">Finance Interest</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="condition.operator" class="w-[120px]">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">not equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                  </SelectContent>
                </Select>
                <Input v-model="condition.value" placeholder="Value" class="flex-1" />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  @click="form.conditions.splice(index, 1)"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                @click="form.conditions.push({ field: '', operator: 'equals', value: '' })"
              >
                <Plus class="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </div>
          </div>

          </form>

        <DialogFooter class="shrink-0 pt-4 border-t">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button @click="handleSubmit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Notification' }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus, X, Tags } from 'lucide-vue-next';
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
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface Notification {
  id?: string;
  name: string;
  type: 'admin' | 'customer';
  isActive: boolean;
  sendTo?: string[];
  cc?: string;
  bcc?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  hasConditions?: boolean;
  conditions?: Array<{ field: string; operator: string; value: string }>;
}

interface Props {
  notification?: Notification | null;
  formSlug: string;
}

const props = withDefaults(defineProps<Props>(), {
  notification: null,
});

const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => !!props.notification);
const saving = ref(false);
const bodyTab = ref('visual');
const showMergeTags = ref(false);

// Form state
const form = ref<Notification>({
  name: props.notification?.name || '',
  type: props.notification?.type || 'admin',
  isActive: props.notification?.isActive ?? true,
  sendTo: props.notification?.sendTo || [''],
  cc: props.notification?.cc || '',
  bcc: props.notification?.bcc || '',
  fromName: props.notification?.fromName || 'Sale Hyundai',
  replyTo: props.notification?.replyTo || 'enquiries@hyundai.com.au',
  subject: props.notification?.subject || '',
  bodyText: props.notification?.bodyText || getDefaultBody(props.notification?.type || 'admin'),
  bodyHtml: props.notification?.bodyHtml || '',
  hasConditions: props.notification?.hasConditions || false,
  conditions: props.notification?.conditions || [],
});

// Merge tags available
const mergeTags = [
  { tag: '{customer_name}', description: 'Full name' },
  { tag: '{first_name}', description: 'First name' },
  { tag: '{last_name}', description: 'Last name' },
  { tag: '{email}', description: 'Email address' },
  { tag: '{phone}', description: 'Phone number' },
  { tag: '{form_type}', description: 'Form type' },
  { tag: '{vehicle_make}', description: 'Vehicle make' },
  { tag: '{vehicle_model}', description: 'Vehicle model' },
  { tag: '{vehicle_year}', description: 'Vehicle year' },
  { tag: '{vehicle_condition}', description: 'New/Used/Demo' },
  { tag: '{message}', description: 'Customer message' },
  { tag: '{submission_date}', description: 'Date submitted' },
  { tag: '{enquiry_id}', description: 'Reference number' },
];

function getDefaultBody(type: string): string {
  if (type === 'admin') {
    return `New enquiry received:

Name: {customer_name}
Email: {email}
Phone: {phone}

Form: {form_type}
Date: {submission_date}

Message:
{message}

---
View in admin dashboard: {admin_link}`;
  }
  return `Dear {first_name},

Thank you for your enquiry with Sale Hyundai.

We have received your submission and a member of our team will be in touch within 24 hours.

Reference: {enquiry_id}

If you have any urgent questions, please call us on 02 1234 5678.

Kind regards,
Sale Hyundai Team`;
}

const handleSubmit = async () => {
  saving.value = true;
  try {
    const notificationData = {
      ...form.value,
      sendTo: form.value.type === 'admin' ? form.value.sendTo.filter(e => e.trim()) : undefined,
    };
    emit('save', notificationData);
  } catch (error) {
    console.error('Error saving notification:', error);
  } finally {
    saving.value = false;
  }
};
</script>







