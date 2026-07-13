<template>
  <div class="space-y-6">
    <AdminPageHeader title="Sales Targets" description="Configure sales goals and performance metrics" />

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Loading targets...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error loading targets</AlertTitle>
      <AlertDescription>
        {{ error.message || 'Failed to load sales targets. Please try again.' }}
        <Button variant="outline" size="sm" class="mt-2" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Content -->
    <template v-else>
      <form @submit.prevent="saveTargets" class="space-y-6">
        <!-- Monthly Sales Targets -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Target class="h-5 w-5" />
              Monthly Sales Targets
            </CardTitle>
            <CardDescription>
              Set monthly goals for your sales team. These targets appear on the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-6 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="monthlyLeads">Monthly Lead Target</Label>
                <Input
                  id="monthlyLeads"
                  v-model.number="targets.monthlyLeads"
                  type="number"
                  min="1"
                  placeholder="50"
                />
                <p class="text-xs text-muted-foreground">
                  Target number of vehicle/test drive enquiries per month
                </p>
              </div>

              <div class="space-y-2">
                <Label for="monthlyConversions">Monthly Conversion Target</Label>
                <Input
                  id="monthlyConversions"
                  v-model.number="targets.monthlyConversions"
                  type="number"
                  min="1"
                  placeholder="15"
                />
                <p class="text-xs text-muted-foreground">
                  Target number of closed sales per month
                </p>
              </div>

              <div class="space-y-2">
                <Label for="conversionRateTarget">Conversion Rate Target (%)</Label>
                <Input
                  id="conversionRateTarget"
                  v-model.number="targets.conversionRateTarget"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="30"
                />
                <p class="text-xs text-muted-foreground">
                  Target percentage of leads that convert to sales
                </p>
              </div>

              <div class="space-y-2">
                <Label for="accessoriesRevenueTarget">Accessories Revenue Target ($)</Label>
                <Input
                  id="accessoriesRevenueTarget"
                  v-model.number="targets.accessoriesRevenueTarget"
                  type="number"
                  min="0"
                  placeholder="10000"
                />
                <p class="text-xs text-muted-foreground">
                  Target revenue from accessories added to enquiries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Response Time Targets -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Response Time Targets
            </CardTitle>
            <CardDescription>
              Set expectations for how quickly staff should respond to enquiries.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-6 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="responseTimeHours">Initial Response Time (hours)</Label>
                <Input
                  id="responseTimeHours"
                  v-model.number="targets.responseTimeHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="1"
                />
                <p class="text-xs text-muted-foreground">
                  Target time to first contact with new leads
                </p>
              </div>

              <div class="space-y-2">
                <Label for="criticalResponseHours">Critical Response Time (hours)</Label>
                <Input
                  id="criticalResponseHours"
                  v-model.number="targets.criticalResponseHours"
                  type="number"
                  min="1"
                  placeholder="24"
                />
                <p class="text-xs text-muted-foreground">
                  Leads waiting longer than this will be marked as overdue
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>Response Time Impact</AlertTitle>
              <AlertDescription>
                Industry research shows that leads contacted within 5 minutes are 21x more likely to convert.
                The dashboard will alert staff when leads exceed your response time targets.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <!-- Marketing ROI -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Banknote class="h-5 w-5" />
              Marketing ROI
            </CardTitle>
            <CardDescription>
              Used to estimate return on ad spend on the Marketing report.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-6 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="avgSaleValue">Average Sale Value ($)</Label>
                <Input
                  id="avgSaleValue"
                  v-model.number="avgSaleValue"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="40000"
                />
                <p class="text-xs text-muted-foreground">
                  Used to estimate ROAS on the Marketing report. Leave blank to hide ROAS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Test Drive Targets -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Car class="h-5 w-5" />
              Test Drive Targets
            </CardTitle>
            <CardDescription>
              Set goals for test drive bookings and completions.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-6 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="monthlyTestDrives">Monthly Test Drive Target</Label>
                <Input
                  id="monthlyTestDrives"
                  v-model.number="targets.monthlyTestDrives"
                  type="number"
                  min="0"
                  placeholder="25"
                />
                <p class="text-xs text-muted-foreground">
                  Target number of test drives booked per month
                </p>
              </div>

              <div class="space-y-2">
                <Label for="testDriveConversionTarget">Test Drive Conversion Target (%)</Label>
                <Input
                  id="testDriveConversionTarget"
                  v-model.number="targets.testDriveConversionTarget"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="50"
                />
                <p class="text-xs text-muted-foreground">
                  Target percentage of test drives that lead to sales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <Button type="button" variant="outline" @click="resetToDefaults">
            <RotateCcw class="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <div class="flex gap-3">
            <Button type="button" variant="ghost" @click="refresh">
              Cancel
            </Button>
            <Button type="submit" :disabled="saving">
              <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              {{ saving ? 'Saving...' : 'Save Targets' }}
            </Button>
          </div>
        </div>

        <!-- Success Alert -->
        <Alert v-if="saveSuccess" class="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle class="h-4 w-4 text-green-600" />
          <AlertTitle class="text-green-800 dark:text-green-200">Targets Updated</AlertTitle>
          <AlertDescription class="text-green-700 dark:text-green-300">
            Your sales targets have been saved and will be reflected on the dashboard.
          </AlertDescription>
        </Alert>

        <!-- Error Alert -->
        <Alert v-if="saveError" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Failed to Save</AlertTitle>
          <AlertDescription>{{ saveError }}</AlertDescription>
        </Alert>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  Clock,
  Car,
  Banknote,
  Save,
  RotateCcw,
  CheckCircle,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const defaultTargets = {
  monthlyLeads: 50,
  monthlyConversions: 15,
  conversionRateTarget: 30,
  accessoriesRevenueTarget: 10000,
  responseTimeHours: 1,
  criticalResponseHours: 24,
  monthlyTestDrives: 25,
  testDriveConversionTarget: 50,
};

type TargetsResponse = {
  targets?: Partial<typeof defaultTargets>;
  avgSaleValue?: number | null;
};

const { data, pending, error, refresh } = await useFetch<TargetsResponse>('/api/admin/settings/targets', {
  default: () => ({ targets: defaultTargets, avgSaleValue: null }),
});

const targets = ref({ ...defaultTargets });
// undefined (not null) so it binds cleanly to the Input component's modelValue type;
// the API treats a missing/empty value the same as null (see parseAvgSaleValue).
const avgSaleValue = ref<number | undefined>(undefined);
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

// Initialize targets from fetched data
watch(data, (newData) => {
  if (newData?.targets) {
    targets.value = {
      ...defaultTargets,
      ...newData.targets,
    };
  }
  avgSaleValue.value = newData?.avgSaleValue ?? undefined;
}, { immediate: true });

const resetToDefaults = () => {
  targets.value = { ...defaultTargets };
};

const saveTargets = async () => {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';

  try {
    await $fetch('/api/admin/settings/targets', {
      method: 'PUT',
      // Server normalizes '' / non-numeric / <=0 to null via parseAvgSaleValue, so an
      // emptied input clears avgSaleValue and hides ROAS again.
      body: {
        targets: targets.value,
        avgSaleValue: avgSaleValue.value,
      },
    });
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 5000);
  } catch (err: any) {
    saveError.value = err.data?.message || 'Failed to save targets';
  } finally {
    saving.value = false;
  }
};
</script>
