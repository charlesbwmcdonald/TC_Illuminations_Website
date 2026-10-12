const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const script = fs.readFileSync('reservation.js', 'utf8');

function setup(fetch) {
    let handler, resets = 0;
    const status = { style: {}, focus() {} };
    const button = { innerHTML: 'Submit Reservation', disabled: false };
    const form = {
        action: 'https://api.web3forms.com/submit',
        querySelector: () => button,
        addEventListener: (_, callback) => { handler = callback; },
        reportValidity: () => true,
        setAttribute() {}, removeAttribute() {},
        reset: () => { resets++; }
    };
    vm.runInNewContext(script, {
        document: { getElementById: id => id === 'reservationForm' ? form : status },
        FormData: class { constructor() { return [['name', 'Test'], ['cart_items', '18ft | TOTAL: $600'], ['redirect', 'https://web3forms.com/success']]; } },
        fetch, AbortController, setTimeout, clearTimeout
    });
    return { submit: () => handler({ preventDefault() {} }), status, button, resets: () => resets };
}

test('success submits all reservation fields without redirect, then resets', async () => {
    let sent;
    const ui = setup(async (url, options) => {
        assert.equal(url, 'https://api.web3forms.com/submit');
        sent = JSON.parse(options.body);
        return { ok: true, json: async () => ({ success: true }) };
    });
    await ui.submit();
    assert.equal(sent.cart_items, '18ft | TOTAL: $600');
    assert.equal(sent.redirect, undefined);
    assert.equal(ui.resets(), 1);
    assert.match(ui.status.textContent, /request was received/);
    assert.equal(ui.button.disabled, false);
});

for (const [label, fetch] of [
    ['provider rejects key', async () => ({ ok: false, json: async () => ({ success: false, message: 'Invalid access key' }) })],
    ['failure with HTTP 200', async () => ({ ok: true, json: async () => ({ success: false }) })],
    ['network failure', async () => { throw new Error('offline'); }],
    ['unreadable response', async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } })]
]) {
    test(label + ' keeps customer details and allows retry', async () => {
        const ui = setup(fetch);
        await ui.submit();
        assert.equal(ui.resets(), 0);
        assert.match(ui.status.textContent, /details are still here/);
        assert.doesNotMatch(ui.status.textContent, /Thank you!/);
        assert.equal(ui.button.disabled, false);
    });
}

test('repeated submits while sending only make one request', async () => {
    let complete, calls = 0;
    const ui = setup(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
    const pending = ui.submit();
    assert.equal(ui.button.disabled, true);
    await ui.submit();
    assert.equal(calls, 1);
    complete({ ok: true, json: async () => ({ success: true }) });
    await pending;
});
