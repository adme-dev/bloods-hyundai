<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm text-muted-foreground">Email deliverability & sender management</p>
      <h1 class="text-3xl font-semibold tracking-tight">Email Settings</h1>
    </div>

    <!-- Verified Senders Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Verified Senders</CardTitle>
            <CardDescription>
              Email addresses verified to send on behalf of your dealership. 
              Verified senders help ensure emails reach inboxes instead of spam folders.
            </CardDescription>
          </div>
          <Button @click="showAddSenderModal = true">
            <Plus class="mr-2 h-4 w-4" />
            Add Sender
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loadingSenders" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          <span class="ml-2 text-muted-foreground">Loading senders...</span>
        </div>

        <div v-else-if="senders.length === 0" class="text-center py-8">
          <Mail class="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 class="mt-4 text-lg font-medium">No verified senders</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Add a sender email address to start sending enquiry notifications.
          </p>
          <Button class="mt-4" @click="showAddSenderModal = true">
            <Plus class="mr-2 h-4 w-4" />
            Add Your First Sender
          </Button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="sender in senders"
            :key="sender.id"
            class="flex items-center justify-between rounded-lg border p-4"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail class="h-5 w-5 text-primary" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium">{{ sender.from_name || sender.nickname }}</p>
                  <Badge :variant="sender.verified ? 'default' : 'secondary'">
                    {{ sender.verified ? 'Verified' : 'Pending' }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ sender.from_email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button
                v-if="!sender.verified"
                variant="outline"
                size="sm"
                @click="resendVerification(sender.id)"
                :disabled="resendingId === sender.id"
              >
                <RefreshCw v-if="resendingId === sender.id" class="mr-2 h-4 w-4 animate-spin" />
                <Send v-else class="mr-2 h-4 w-4" />
                Resend
              </Button>
              <Button
                variant="ghost"
                size="icon"
                @click="confirmDelete(sender)"
              >
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Domain Authentication Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Domain Authentication</CardTitle>
            <CardDescription>
              Authenticate your domain to improve email deliverability. 
              This adds SPF and DKIM records to verify emails are legitimately from your domain.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loadingDomains" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          <span class="ml-2 text-muted-foreground">Loading domains...</span>
        </div>

        <div v-else-if="domains.length === 0" class="rounded-lg border border-dashed p-6">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle class="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 class="font-medium">No authenticated domains</h3>
              <p class="mt-1 text-sm text-muted-foreground">
                For best email deliverability, authenticate your sending domain in SendGrid.
                This requires adding DNS records to your domain.
              </p>
              <div class="mt-4 space-y-2">
                <p class="text-sm font-medium">To authenticate your domain:</p>
                <ol class="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Log into your <a href="https://app.sendgrid.com/settings/sender_auth" target="_blank" class="text-primary hover:underline">SendGrid Dashboard</a></li>
                  <li>Go to Settings → Sender Authentication</li>
                  <li>Click "Authenticate Your Domain"</li>
                  <li>Follow the steps to add DNS records</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="domain in domains"
            :key="domain.id"
            class="flex items-center justify-between rounded-lg border p-4"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Shield class="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium">{{ domain.domain }}</p>
                  <Badge variant="default">
                    <CheckCircle class="mr-1 h-3 w-3" />
                    Authenticated
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">
                  All emails from @{{ domain.domain }} are verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Email Deliverability Tips -->
    <Card>
      <CardHeader>
        <CardTitle>Email Deliverability Tips</CardTitle>
        <CardDescription>Best practices to ensure your emails reach customers</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex gap-3">
            <CheckCircle class="h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p class="font-medium">Verify sender addresses</p>
              <p class="text-sm text-muted-foreground">All "from" addresses must be verified</p>
            </div>
          </div>
          <div class="flex gap-3">
            <CheckCircle class="h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p class="font-medium">Authenticate your domain</p>
              <p class="text-sm text-muted-foreground">Add SPF, DKIM records to your DNS</p>
            </div>
          </div>
          <div class="flex gap-3">
            <CheckCircle class="h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p class="font-medium">Use consistent sender names</p>
              <p class="text-sm text-muted-foreground">Recipients recognize trusted senders</p>
            </div>
          </div>
          <div class="flex gap-3">
            <CheckCircle class="h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p class="font-medium">Include unsubscribe links</p>
              <p class="text-sm text-muted-foreground">Comply with email regulations</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Sender Modal -->
    <Dialog :open="showAddSenderModal" @update:open="showAddSenderModal = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Verified Sender</DialogTitle>
          <DialogDescription>
            Add a new email address to send notifications from. A verification email will be sent to confirm ownership.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="addSender" class="space-y-4">
          <div class="space-y-2">
            <Label>Nickname <span class="text-destructive">*</span></Label>
            <Input 
              v-model="newSender.nickname" 
              placeholder="e.g., Sales Team" 
              required 
            />
            <p class="text-xs text-muted-foreground">Internal name to identify this sender</p>
          </div>
          
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>From Name <span class="text-destructive">*</span></Label>
              <Input 
                v-model="newSender.fromName" 
                placeholder="e.g., Sale Hyundai" 
                required 
              />
            </div>
            <div class="space-y-2">
              <Label>From Email <span class="text-destructive">*</span></Label>
              <Input 
                v-model="newSender.fromEmail" 
                type="email" 
                placeholder="e.g., sales@example.com" 
                required 
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Reply-To Name</Label>
              <Input 
                v-model="newSender.replyToName" 
                placeholder="Same as From Name" 
              />
            </div>
            <div class="space-y-2">
              <Label>Reply-To Email</Label>
              <Input 
                v-model="newSender.replyToEmail" 
                type="email" 
                placeholder="Same as From Email" 
              />
            </div>
          </div>

          <Separator />

          <div class="space-y-2">
            <Label>Business Address <span class="text-destructive">*</span></Label>
            <Input 
              v-model="newSender.address" 
              placeholder="Street address" 
              required 
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <Label>City <span class="text-destructive">*</span></Label>
              <Input v-model="newSender.city" placeholder="Sydney" required />
            </div>
            <div class="space-y-2">
              <Label>State <span class="text-destructive">*</span></Label>
              <Input v-model="newSender.state" placeholder="NSW" required />
            </div>
            <div class="space-y-2">
              <Label>Postcode <span class="text-destructive">*</span></Label>
              <Input v-model="newSender.zip" placeholder="2000" required />
            </div>
          </div>

          <Alert v-if="addSenderError" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ addSenderError }}</AlertDescription>
          </Alert>

          <Alert v-if="addSenderSuccess" class="border-green-200 bg-green-50">
            <CheckCircle class="h-4 w-4 text-green-600" />
            <AlertDescription class="text-green-800">{{ addSenderSuccess }}</AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddSenderModal = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="addingSender">
              <Loader2 v-if="addingSender" class="mr-2 h-4 w-4 animate-spin" />
              {{ addingSender ? 'Adding...' : 'Add Sender' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog :open="showDeleteModal" @update:open="showDeleteModal = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sender</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{{ senderToDelete?.from_email }}</strong>? 
            This sender will no longer be able to send emails.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="deleteSender" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Loader2 v-if="deletingSender" class="mr-2 h-4 w-4 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Plus,
  Mail,
  Trash2,
  Send,
  RefreshCw,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

// State
const loadingSenders = ref(true);
const loadingDomains = ref(true);
const senders = ref<any[]>([]);
const domains = ref<any[]>([]);

const showAddSenderModal = ref(false);
const addingSender = ref(false);
const addSenderError = ref('');
const addSenderSuccess = ref('');

const showDeleteModal = ref(false);
const senderToDelete = ref<any>(null);
const deletingSender = ref(false);

const resendingId = ref<number | null>(null);

const newSender = ref({
  nickname: '',
  fromName: '',
  fromEmail: '',
  replyToName: '',
  replyToEmail: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'Australia',
});

// Fetch data on mount
onMounted(async () => {
  await Promise.all([fetchSenders(), fetchDomains()]);
});

const fetchSenders = async () => {
  loadingSenders.value = true;
  try {
    const data = await $fetch<{ senders: any[] }>('/api/admin/sendgrid/senders');
    senders.value = data.senders || [];
  } catch (error: any) {
    console.error('Failed to fetch senders:', error);
  } finally {
    loadingSenders.value = false;
  }
};

const fetchDomains = async () => {
  loadingDomains.value = true;
  try {
    const data = await $fetch<{ domains: any[] }>('/api/admin/sendgrid/domains');
    domains.value = (data.domains || []).filter((d: any) => d.valid);
  } catch (error: any) {
    console.error('Failed to fetch domains:', error);
  } finally {
    loadingDomains.value = false;
  }
};

const addSender = async () => {
  addingSender.value = true;
  addSenderError.value = '';
  addSenderSuccess.value = '';

  try {
    const result = await $fetch<{ success: boolean; message: string }>('/api/admin/sendgrid/senders', {
      method: 'POST',
      body: newSender.value,
    });

    addSenderSuccess.value = result.message;
    
    // Refresh the list
    await fetchSenders();

    // Reset form after a delay
    setTimeout(() => {
      showAddSenderModal.value = false;
      addSenderSuccess.value = '';
      newSender.value = {
        nickname: '',
        fromName: '',
        fromEmail: '',
        replyToName: '',
        replyToEmail: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'Australia',
      };
    }, 2000);
  } catch (error: any) {
    addSenderError.value = error.data?.message || error.message || 'Failed to add sender';
  } finally {
    addingSender.value = false;
  }
};

const confirmDelete = (sender: any) => {
  senderToDelete.value = sender;
  showDeleteModal.value = true;
};

const deleteSender = async () => {
  if (!senderToDelete.value) return;

  deletingSender.value = true;
  try {
    await $fetch(`/api/admin/sendgrid/senders/${senderToDelete.value.id}`, {
      method: 'DELETE',
    });

    // Remove from local list
    senders.value = senders.value.filter(s => s.id !== senderToDelete.value.id);
    showDeleteModal.value = false;
    senderToDelete.value = null;
  } catch (error: any) {
    console.error('Failed to delete sender:', error);
  } finally {
    deletingSender.value = false;
  }
};

const resendVerification = async (senderId: number) => {
  resendingId.value = senderId;
  try {
    await $fetch(`/api/admin/sendgrid/senders/${senderId}/resend`, {
      method: 'POST',
    });
    // Could show a toast here
  } catch (error: any) {
    console.error('Failed to resend verification:', error);
  } finally {
    resendingId.value = null;
  }
};
</script>







