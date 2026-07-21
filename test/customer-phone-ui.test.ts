import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('website enquiry phone requirement', () => {
  const manuallyValidatedForms = [
    'app/components/contact/ContactFormCard.vue',
    'app/components/page-elements/ContactForm.vue',
    'app/components/page-elements/FinanceForm.vue',
    'app/components/page-elements/PartsForm.vue',
    'app/components/search/SingleForm.vue',
    'app/components/vehicle/VehicleEnquiryModal.vue',
  ];

  for (const path of manuallyValidatedForms) {
    it(`${path} validates a required CRM-compatible phone`, () => {
      const component = source(path);
      assert.match(component, /validateRequiredCustomerPhone/);
      assert.match(component, /phone/);
    });
  }

  it('requires phone data through the shared enquiry composable', () => {
    const composable = source('app/composables/useEnquiryForm.ts');
    assert.match(composable, /phone:\s*string;/);
    assert.match(composable, /validateRequiredCustomerPhone/);
    assert.match(composable, /phone:\s*phoneValidation\.phone/);
  });
});
