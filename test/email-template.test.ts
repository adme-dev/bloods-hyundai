import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { replaceMergeTags } from '../server/utils/emailTemplate.ts';

const enquiry = {
  id: 'abc12345-0000-0000-0000-000000000000',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '0400000000',
  type: 'general',
  message: 'Hello',
  createdAt: '2026-07-08T00:00:00.000Z',
};

const dealer = {
  name: 'Bloods Hyundai',
  phone: '03 9000 0000',
  email: 'sales@bloods.example',
  address: '1 Example St',
  websiteUrl: 'https://bloodhyundai.com.au',
};

describe('replaceMergeTags', () => {
  it('substitutes tags in plain-text context without altering values', () => {
    const out = replaceMergeTags('Hi {first_name}, re: {message}', { ...enquiry, message: 'Trade-in <2019> & "quote"' }, dealer);
    assert.equal(out, 'Hi Jane, re: Trade-in <2019> & "quote"');
  });

  it('HTML-escapes user-controlled values in html context', () => {
    const out = replaceMergeTags(
      '<p>{message}</p>',
      { ...enquiry, message: '<img src=x onerror=alert(1)>' },
      dealer,
      { html: true },
    );
    assert.equal(out, '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  });

  it('HTML-escapes every merge field in html context, not just message', () => {
    const out = replaceMergeTags(
      '{first_name} {last_name} {email}',
      { ...enquiry, firstName: '<b>J</b>', lastName: 'D"oe', email: 'a&b@example.com' },
      dealer,
      { html: true },
    );
    assert.equal(out, '&lt;b&gt;J&lt;/b&gt; D&quot;oe a&amp;b@example.com');
  });

  it('leaves template markup intact in html context (only values are escaped)', () => {
    const out = replaceMergeTags('<h1>Thanks {first_name}</h1>', enquiry, dealer, { html: true });
    assert.equal(out, '<h1>Thanks Jane</h1>');
  });

  it('inserts values containing replacement patterns like $& literally', () => {
    const out = replaceMergeTags('msg: {message}', { ...enquiry, message: 'costs $100 & $& more' }, dealer);
    assert.equal(out, 'msg: costs $100 & $& more');
  });
});
